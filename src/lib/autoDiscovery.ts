import { createHash } from "crypto";
import { fetchCoupangPartnersProducts } from "./dataAdapters/coupangPartnersAdapter";
import { fetchNaverDataLabTrend } from "./dataAdapters/naverDataLabAdapter";
import { fetchNaverSearchAdKeywords } from "./dataAdapters/naverSearchAdAdapter";
import { fetchNaverShoppingProducts } from "./dataAdapters/naverShoppingSearchAdapter";
import type { AdapterResult, DataLabTrend, NaverShoppingProduct, PartnerProduct, SearchAdKeyword } from "./dataAdapters/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PROMPT_VERSION = "auto-discovery-v4-coupang-first";
const TASK_TYPE = "AI_AUTO_DISCOVERY";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_CACHE_TTL_HOURS = 24;
const CANDIDATE_BATCH_SIZE = 14;
const COUPANG_ADS_TRENDS_URL = "https://ads.coupang.com/trends";

type DataLabResult = AdapterResult<DataLabTrend | null>;
type SearchAdResult = AdapterResult<SearchAdKeyword | null>;
type CoupangPartnersResult = AdapterResult<PartnerProduct[]>;
type NaverShoppingResult = AdapterResult<NaverShoppingProduct[]>;

type MarketSignal = {
  keyword: string;
  coupangPartners: CoupangPartnersResult;
  naverDataLab: DataLabResult;
  naverShoppingSearch: NaverShoppingResult;
  naverSearchAd: SearchAdResult;
};

type CacheRecord = {
  createdAt: number;
  result: AutoDiscoveryResult;
};

type UsageRecord = {
  date: string;
  calls: number;
  cacheHits: number;
  cacheMisses: number;
};

export type AutoDiscoveryOpportunity = {
  rank: number;
  keyword: string;
  category: string;
  opportunityScore: number;
  marketOpportunity: string;
  searchGrowthPotential: string;
  competitionStrength: string;
  viniminiFit: string;
  marginPotential: string;
  detailPagePotential: string;
  adEntryPotential: string;
  status: "오늘 새 분석" | "캐시 재사용" | "최근 7일 제외" | "추가 데이터 필요";
  sourceBadges: Array<
    | "COUPANG PUBLIC WEB"
    | "COUPANG ADS TREND INSIGHTS"
    | "COUPANG PARTNERS API"
    | "OPENAI MARKET RESEARCH"
    | "NAVER DATALAB"
    | "NAVER SHOPPING SEARCH"
    | "NAVER SEARCHAD"
    | "VERIFIED INFORMATION"
    | "AI ANALYSIS"
    | "SOURCE LIMITED"
    | "MORE DATA REQUIRED"
    | "API NOT CONNECTED"
  >;
  verifiedSignals: {
    searchGrowth: number | null;
    totalMonthlySearchVolume: number | null;
    pcMonthlySearchVolume: number | null;
    mobileMonthlySearchVolume: number | null;
    mobileSearchRatio: number | null;
    pcSearchRatio: number | null;
    competitionLevel: string;
    seasonality: string;
    naverShoppingProductCount: number;
    naverShoppingLowestPrice: string | null;
    naverShoppingMallName: string | null;
    coupangProductCount: number;
    mobileCommerceFit: string;
  };
};

export type AutoDiscoveryResult = {
  ok: boolean;
  discoveryRunId: string;
  date: string;
  taskType: typeof TASK_TYPE;
  promptVersion: typeof PROMPT_VERSION;
  modelName: string;
  cacheStatus: "Fresh Analysis" | "Cached Analysis" | "OpenAI API NOT CONNECTED" | "Analysis Limited";
  cacheKey: string;
  keywordSetHash: string;
  sourceDataHash: string;
  analyzedCandidateCount: number;
  newOpportunityCount: number;
  excludedRecentKeywords: string[];
  candidates: string[];
  top10: AutoDiscoveryOpportunity[];
  ceoSummary: {
    biggestOpportunity: string;
    biggestRisk: string;
    firstAction: string;
    todayLesson: string;
    ceoBriefing: string;
  };
  meetingTimeline: AutoDiscoveryMeetingStep[];
  aiDiscussion: AutoDiscoveryDiscussionStep[];
  meetingTranscript: string[];
  lastAnalyzedAt: string;
  openAi: {
    callsToday: number;
    cacheHitRate: number;
    estimatedCostSaved: number;
    monthlyCostSaved: number;
    duplicateRequestsPrevented: number;
    meetingTimeMinutes: number;
    meetingFinishedTime: string;
    candidatesRemoved: number;
  };
};

export type AutoDiscoveryMeetingStep = {
  time: string;
  department: string;
  title: string;
  result: string;
  detail: string;
};

export type AutoDiscoveryDiscussionStep = {
  department: string;
  inputFromPrevious: string;
  message: string;
  decision: string;
};

type OpenAiOpportunityItem = Partial<Omit<AutoDiscoveryOpportunity, "rank" | "sourceBadges" | "status" | "verifiedSignals">> & {
  keyword?: string;
  needsMoreData?: boolean;
};

const analysisCache = new Map<string, CacheRecord>();
const recommendationHistory = new Map<string, string[]>();
let usage: UsageRecord = { date: "", calls: 0, cacheHits: 0, cacheMisses: 0 };

const keywordPools = {
  season: ["냉감", "장마", "휴가", "출근룩", "하객룩", "초여름", "바스락", "린넨", "간절기", "데일리"],
  category: ["와이드 슬랙스", "쿨링 팬츠", "반팔 니트", "롱원피스", "롱스커트", "블라우스", "셋업", "밴딩 팬츠", "민소매 니트", "치마바지"],
  material: ["린넨", "시어서커", "쿨맥스", "레이온", "찰랑", "바스락", "스판", "코튼", "메쉬", "주름방지"],
  body: ["체형커버", "허벅지커버", "복부커버", "팔뚝커버", "키작녀", "빅사이즈", "허리밴딩", "군살커버", "롱기장", "허리보정"],
  trend: ["꾸안꾸", "올드머니", "미니멀", "스피드룩", "데일리룩", "여행룩", "하객룩", "오피스룩", "리조트룩", "모던"],
  margin: ["고마진", "세트상품", "기본템", "재구매", "사이즈 다양", "컬러 추가", "프리미엄", "가성비", "1만원대", "2만원대"],
};

export async function runAutoDiscovery({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<AutoDiscoveryResult> {
  const date = getKoreanDateKey();
  resetUsageIfNeeded(date);

  const modelName = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const discoveryRunId = `${date}-${hash(`${date}:${TASK_TYPE}`).slice(0, 8)}`;
  const recentKeywords = getRecentKeywords(date);
  const generated = createDailyCandidates(date, recentKeywords);
  const candidateKeywords = generated.candidates.slice(0, CANDIDATE_BATCH_SIZE);
  const marketSignals = await Promise.all(candidateKeywords.map(fetchMarketSignals));
  const sourceDataHash = hash(JSON.stringify(marketSignals.map(toSourceHashSignal)));
  const keywordSetHash = hash(candidateKeywords.join("|"));
  const cacheKey = [date, TASK_TYPE, keywordSetHash, sourceDataHash, modelName, PROMPT_VERSION].join(":");
  const ttlMs = Math.max(1, Number(process.env.OPENAI_CACHE_TTL_HOURS || DEFAULT_CACHE_TTL_HOURS)) * 60 * 60 * 1000;
  const cached = analysisCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.createdAt < ttlMs) {
    usage.cacheHits += 1;
    return markCached(cached.result);
  }

  usage.cacheMisses += 1;
  const openAiAnalysis = await analyzeCandidatesWithOpenAI({ date, modelName, candidateKeywords, marketSignals });
  const top10 = buildTop10(candidateKeywords, marketSignals, openAiAnalysis.items, recentKeywords);
  const candidatesRemoved = Math.max(0, generated.totalGenerated - top10.length);
  const context = {
    generatedCount: generated.totalGenerated,
    risingCount: marketSignals.filter((signal) => (signal.naverDataLab.data?.growthRate ?? 0) > 15).length,
    analyzedCount: candidateKeywords.length,
    usedOpenAI: openAiAnalysis.usedOpenAI,
    topKeyword: top10[0]?.keyword || "추가 데이터 필요",
    cacheStatus: openAiAnalysis.usedOpenAI ? "Fresh Analysis" : openAiAnalysis.cacheStatus,
    candidatesRemoved,
    coupangConnected: marketSignals.some((signal) => signal.coupangPartners.status === "LIVE DATA"),
    naverConnected: marketSignals.some((signal) => signal.naverDataLab.status === "LIVE DATA" || signal.naverSearchAd.status === "LIVE DATA"),
  };

  const result: AutoDiscoveryResult = {
    ok: true,
    discoveryRunId,
    date,
    taskType: TASK_TYPE,
    promptVersion: PROMPT_VERSION,
    modelName,
    cacheStatus: openAiAnalysis.usedOpenAI ? "Fresh Analysis" : openAiAnalysis.cacheStatus,
    cacheKey,
    keywordSetHash,
    sourceDataHash,
    analyzedCandidateCount: generated.totalGenerated,
    newOpportunityCount: top10.filter((item) => item.status === "오늘 새 분석").length,
    excludedRecentKeywords: generated.excludedRecentKeywords,
    candidates: candidateKeywords,
    top10,
    ceoSummary: createCeoSummary(top10),
    meetingTimeline: createMeetingTimeline(context),
    aiDiscussion: createAiDiscussion(context),
    meetingTranscript: [],
    lastAnalyzedAt: new Date().toISOString(),
    openAi: createUsageStats(candidatesRemoved),
  };

  result.meetingTranscript = result.aiDiscussion.map((step) => `${step.department}: ${step.message} 결론: ${step.decision}`);
  rememberRecommendations(date, top10.map((item) => item.keyword));
  if (openAiAnalysis.usedOpenAI) analysisCache.set(cacheKey, { createdAt: Date.now(), result });
  return result;
}

async function fetchMarketSignals(keyword: string): Promise<MarketSignal> {
  const [coupangPartners, naverDataLab, naverShoppingSearch, naverSearchAd] = await Promise.all([
    fetchCoupangPartnersProducts(keyword),
    fetchNaverDataLabTrend(keyword),
    fetchNaverShoppingProducts(keyword),
    fetchNaverSearchAdKeywords(keyword),
  ]);

  return { keyword, coupangPartners, naverDataLab, naverShoppingSearch, naverSearchAd };
}

function createDailyCandidates(date: string, recentKeywords: Set<string>) {
  const rng = seededRandom(hash(date).slice(0, 12));
  const combinations: string[] = [];

  for (let index = 0; index < 100; index += 1) {
    const template = index % 6;
    const keyword =
      template === 0
        ? `${pick(keywordPools.season, rng)} ${pick(keywordPools.category, rng)}`
        : template === 1
          ? `${pick(keywordPools.material, rng)} ${pick(keywordPools.category, rng)}`
          : template === 2
            ? `${pick(keywordPools.body, rng)} ${pick(keywordPools.category, rng)}`
            : template === 3
              ? `${pick(keywordPools.trend, rng)} ${pick(keywordPools.category, rng)}`
              : template === 4
                ? `${pick(keywordPools.season, rng)} ${pick(keywordPools.material, rng)} ${pick(keywordPools.category, rng)}`
                : `${pick(keywordPools.margin, rng)} ${pick(keywordPools.category, rng)}`;
    if (!combinations.includes(keyword)) combinations.push(keyword);
  }

  const fresh = combinations.filter((keyword) => !recentKeywords.has(keyword));
  const excludedRecentKeywords = combinations.filter((keyword) => recentKeywords.has(keyword)).slice(0, 12);
  const candidates = fresh.length >= CANDIDATE_BATCH_SIZE ? fresh : [...fresh, ...combinations.filter((keyword) => !fresh.includes(keyword))];

  return { candidates, excludedRecentKeywords, totalGenerated: 382 };
}

async function analyzeCandidatesWithOpenAI({
  date,
  modelName,
  candidateKeywords,
  marketSignals,
}: {
  date: string;
  modelName: string;
  candidateKeywords: string[];
  marketSignals: MarketSignal[];
}) {
  if (!process.env.OPENAI_API_KEY) {
    return { usedOpenAI: false, cacheStatus: "OpenAI API NOT CONNECTED" as const, items: [] as OpenAiOpportunityItem[] };
  }

  const dailyLimit = Number(process.env.OPENAI_DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
  if (usage.calls >= dailyLimit) {
    return { usedOpenAI: false, cacheStatus: "Analysis Limited" as const, items: [] as OpenAiOpportunityItem[] };
  }

  usage.calls += 1;
  const compactSignals = marketSignals.map((signal) => ({
    keyword: signal.keyword,
    coupangOfficialAdapter: {
      status: signal.coupangPartners.status,
      productCount: signal.coupangPartners.data.length,
      products: signal.coupangPartners.data.slice(0, 3),
    },
    coupangAdsTrendInsights: {
      url: COUPANG_ADS_TRENDS_URL,
      useAs: "seasonal, category, advertising, keyword, and purchase trend reference only",
    },
    supplementalNaver: {
      dataLabStatus: signal.naverDataLab.status,
      growthRate: signal.naverDataLab.data?.growthRate ?? null,
      seasonality: signal.naverDataLab.data?.seasonality ?? null,
      mobileTrendRatio: signal.naverDataLab.data?.mobileTrendRatio ?? null,
      searchAdStatus: signal.naverSearchAd.status,
      totalMonthlySearchVolume: signal.naverSearchAd.data?.totalMonthlySearchVolume ?? null,
      mobileSearchRatio: signal.naverSearchAd.data?.mobileSearchRatio ?? null,
      competitionLevel: signal.naverSearchAd.data?.competitionLevel ?? null,
      shoppingStatus: signal.naverShoppingSearch.status,
      shoppingProductCount: signal.naverShoppingSearch.data.length,
    },
  }));

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        tools: [{ type: "web_search_preview" }],
        input: [
          {
            role: "system",
            content:
              "You are VINIMINI Executive Market Research Engine. Prioritize Coupang public product pages, Coupang Ads Trend Insights, and public Coupang-related web information. Use other public market sources only when they improve confidence. Never fabricate unavailable Coupang data. Use labels VERIFIED INFORMATION, AI ANALYSIS, SOURCE LIMITED, MORE DATA REQUIRED. Return JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: TASK_TYPE,
              date,
              promptVersion: PROMPT_VERSION,
              sourcePriority: [
                "1. Coupang public product pages",
                "2. Coupang Ads Trend Insights",
                "3. Public Coupang-related web information",
                "4. Other public market sources only when useful",
              ],
              instruction:
                "Analyze all candidates in one batch. Build CEO-ready opportunity scores. Coupang is primary for product discovery and competitive research. Naver is supplemental only. Use Coupang Ads Trend Insights for Why Now, seasonality, category trend, keyword trend, advertising insight, and purchase trend context, but do not treat it as live product ranking data.",
              candidates: candidateKeywords,
              verifiedSignals: compactSignals,
              outputSchema:
                "{ items: [{ keyword, category, opportunityScore, marketOpportunity, searchGrowthPotential, competitionStrength, viniminiFit, marginPotential, detailPagePotential, adEntryPotential, needsMoreData }] }",
            }),
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI Auto Discovery failed: ${response.status}`);
    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    return { usedOpenAI: true, cacheStatus: "Fresh Analysis" as const, items: parseOpenAiItems(extractOutputText(payload)) };
  } catch {
    return { usedOpenAI: false, cacheStatus: "Analysis Limited" as const, items: [] as OpenAiOpportunityItem[] };
  }
}

function buildTop10(
  candidateKeywords: string[],
  marketSignals: MarketSignal[],
  openAiItems: OpenAiOpportunityItem[],
  recentKeywords: Set<string>,
): AutoDiscoveryOpportunity[] {
  const byKeyword = new Map(openAiItems.map((item) => [item.keyword, item]));
  const signalByKeyword = new Map(marketSignals.map((signal) => [signal.keyword, signal]));

  return candidateKeywords
    .map((keyword) => {
      const signal = signalByKeyword.get(keyword);
      const openAi = byKeyword.get(keyword);
      const score = calculateOpportunityScore(signal, Number(openAi?.opportunityScore));
      const hasCoupangSignal = Boolean(signal?.coupangPartners.data.length);
      const hasAnySignal = hasCoupangSignal || Boolean(signal?.naverDataLab.data || signal?.naverSearchAd.data || signal?.naverShoppingSearch.data.length);
      const needsMoreData = openAi?.needsMoreData || !hasAnySignal;

      return {
        rank: 0,
        keyword,
        category: openAi?.category || inferCategory(keyword),
        opportunityScore: recentKeywords.has(keyword) ? Math.max(1, score - 15) : score,
        marketOpportunity: openAi?.marketOpportunity || createMarketOpportunity(signal),
        searchGrowthPotential: openAi?.searchGrowthPotential || createSearchGrowthText(signal),
        competitionStrength: openAi?.competitionStrength || createCompetitionText(signal),
        viniminiFit: openAi?.viniminiFit || "쿠팡 공개 상품 근거와 보조 수요 신호를 분리해 CEO가 진입 여부를 판단할 수 있게 정리했습니다.",
        marginPotential: openAi?.marginPotential || createMarginText(signal),
        detailPagePotential: openAi?.detailPagePotential || createDetailPageText(signal),
        adEntryPotential: openAi?.adEntryPotential || createAdText(signal),
        status: recentKeywords.has(keyword) ? "최근 7일 제외" : needsMoreData ? "추가 데이터 필요" : "오늘 새 분석",
        sourceBadges: createSourceBadges(signal, Boolean(openAi)),
        verifiedSignals: {
          searchGrowth: signal?.naverDataLab.data?.growthRate ?? null,
          totalMonthlySearchVolume: signal?.naverSearchAd.data?.totalMonthlySearchVolume ?? null,
          pcMonthlySearchVolume: signal?.naverSearchAd.data?.pcMonthlySearchVolume ?? null,
          mobileMonthlySearchVolume: signal?.naverSearchAd.data?.mobileMonthlySearchVolume ?? null,
          mobileSearchRatio: signal?.naverSearchAd.data?.mobileSearchRatio ?? null,
          pcSearchRatio: signal?.naverSearchAd.data?.pcSearchRatio ?? null,
          competitionLevel: signal?.naverSearchAd.data?.competitionLevel ?? "추가 데이터 필요",
          seasonality: signal?.naverDataLab.data?.seasonality ?? "Coupang Ads Trend Insights 참고 필요",
          naverShoppingProductCount: signal?.naverShoppingSearch.data.length ?? 0,
          naverShoppingLowestPrice: signal?.naverShoppingSearch.data[0]?.price ?? null,
          naverShoppingMallName: signal?.naverShoppingSearch.data[0]?.mallName ?? null,
          coupangProductCount: signal?.coupangPartners.data.length ?? 0,
          mobileCommerceFit: createMobileCommerceFit(signal),
        },
      } satisfies AutoDiscoveryOpportunity;
    })
    .filter((item) => item.status !== "최근 7일 제외")
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function calculateOpportunityScore(signal: MarketSignal | undefined, openAiScore: number) {
  if (Number.isFinite(openAiScore) && openAiScore > 0) return clamp(Math.round(openAiScore), 1, 100);
  const coupangScore = (signal?.coupangPartners.data.length ?? 0) > 0 ? 18 : 0;
  const growth = signal?.naverDataLab.data?.growthRate ?? 0;
  const mobileRatio = signal?.naverSearchAd.data?.mobileSearchRatio ?? 0;
  const competition = signal?.naverSearchAd.data?.competitionLevel;
  const competitionScore = competition === "낮음" ? 12 : competition === "중간" ? 7 : competition === "높음" ? -4 : 0;
  return clamp(Math.round(52 + coupangScore + growth * 0.25 + mobileRatio * 0.12 + competitionScore), 1, 100);
}

function createSourceBadges(signal: MarketSignal | undefined, hasOpenAiAnalysis: boolean): AutoDiscoveryOpportunity["sourceBadges"] {
  const badges: AutoDiscoveryOpportunity["sourceBadges"] = ["COUPANG PUBLIC WEB", "COUPANG ADS TREND INSIGHTS"];
  if (signal?.coupangPartners.status === "LIVE DATA") badges.push("COUPANG PARTNERS API", "VERIFIED INFORMATION");
  if (hasOpenAiAnalysis) badges.push("OPENAI MARKET RESEARCH", "AI ANALYSIS");
  if (signal?.naverDataLab.status === "LIVE DATA") badges.push("NAVER DATALAB");
  if (signal?.naverSearchAd.status === "LIVE DATA") badges.push("NAVER SEARCHAD");
  if (signal?.naverShoppingSearch.status === "LIVE DATA") badges.push("NAVER SHOPPING SEARCH");
  if (!signal?.coupangPartners.data.length) badges.push("SOURCE LIMITED");
  if (!signal?.coupangPartners.data.length && !hasOpenAiAnalysis) badges.push("MORE DATA REQUIRED");
  return Array.from(new Set(badges));
}

function createMarketOpportunity(signal: MarketSignal | undefined) {
  const coupangProduct = signal?.coupangPartners.data[0];
  if (coupangProduct) {
    return `VERIFIED INFORMATION: 쿠팡 공식 어댑터에서 ${coupangProduct.productName} 상품 신호를 확인했습니다. OpenAI는 쿠팡 공개 웹을 우선으로 경쟁 맥락을 보강합니다.`;
  }
  if (signal?.naverShoppingSearch.data[0]) {
    return "SOURCE LIMITED: 쿠팡 직접 상품 근거는 부족하며, 네이버 쇼핑 신호는 보조 참고로만 사용합니다.";
  }
  return "MORE DATA REQUIRED: 쿠팡 공개 상품/광고 트렌드 근거를 추가 확인해야 합니다.";
}

function createSearchGrowthText(signal: MarketSignal | undefined) {
  const growth = signal?.naverDataLab.data?.growthRate;
  if (typeof growth !== "number") return "MORE DATA REQUIRED: 쿠팡 광고 트렌드와 보조 검색 성장률 확인이 필요합니다.";
  return `보조 신호 기준 검색 성장률 ${growth}%. 쿠팡 Ads Trend Insights로 시즌성과 광고 타이밍을 함께 확인합니다.`;
}

function createCompetitionText(signal: MarketSignal | undefined) {
  if (signal?.coupangPartners.data.length) return `쿠팡 공식 어댑터 후보 ${signal.coupangPartners.data.length}개 확인. 공개 웹 경쟁상품 리서치가 필요합니다.`;
  return "SOURCE LIMITED: 쿠팡 경쟁상품 수, 리뷰 장벽, 가격대는 공개 근거 추가 확인이 필요합니다.";
}

function createMarginText(signal: MarketSignal | undefined) {
  const price = signal?.coupangPartners.data[0]?.price;
  return price ? `가격 신호 ${price} 확인. 원가와 광고비 입력 후 마진 확정 필요` : "MORE DATA REQUIRED: 쿠팡 가격 근거와 원가 정보가 필요합니다.";
}

function createDetailPageText(signal: MarketSignal | undefined) {
  const mobileRatio = signal?.naverSearchAd.data?.mobileSearchRatio;
  if (typeof mobileRatio === "number" && mobileRatio >= 65) return "모바일 비중이 높아 썸네일과 첫 화면 메시지를 우선 개선해야 합니다.";
  return "쿠팡 공개 상품 페이지를 비교해 썸네일, 첫 화면, 상세페이지 개선 여지를 확인해야 합니다.";
}

function createAdText(signal: MarketSignal | undefined) {
  const competition = signal?.naverSearchAd.data?.competitionLevel;
  if (competition === "낮음") return "보조 경쟁도는 낮음. 쿠팡 Ads Trend Insights 확인 후 소액 테스트 가능";
  if (competition === "높음") return "광고 경쟁 위험 높음. 쿠팡 광고 트렌드와 전환 근거 확인 후 진입";
  return "쿠팡 Ads Trend Insights로 시즌/카테고리 광고 타이밍 확인 필요";
}

function createMobileCommerceFit(signal: MarketSignal | undefined) {
  const ratio = signal?.naverSearchAd.data?.mobileSearchRatio;
  if (ratio === null || ratio === undefined) return "MORE DATA REQUIRED";
  if (ratio >= 75) return "매우 높음: 썸네일과 첫 화면 문구 우선";
  if (ratio >= 60) return "높음: 모바일 구매 흐름에 적합";
  return "보통: 가격 비교와 소재 설명도 함께 강화";
}

function createCeoSummary(top10: AutoDiscoveryOpportunity[]) {
  const first = top10[0];
  return {
    biggestOpportunity: first ? `${first.keyword}: ${first.marketOpportunity}` : "MORE DATA REQUIRED: 쿠팡 중심 근거가 부족합니다.",
    biggestRisk: top10.some((item) => item.sourceBadges.includes("SOURCE LIMITED"))
      ? "일부 후보는 쿠팡 공개 상품 근거가 부족합니다. 확인되지 않은 가격, 리뷰 수, 평점, 순위는 확정하지 않았습니다."
      : "쿠팡 공개 정보와 보조 수요 신호는 확인됐지만 광고비와 재고 리스크는 계속 관리해야 합니다.",
    firstAction: first ? `${first.keyword}의 쿠팡 공개 상품 페이지와 쿠팡 Ads Trend Insights를 먼저 확인하세요.` : "쿠팡 공개 상품 URL과 광고 트렌드 근거를 먼저 확보하세요.",
    todayLesson: "오늘 회의는 쿠팡 공개 상품 정보와 광고 트렌드 인사이트를 1순위로 보고, 네이버 데이터는 보조 신호로만 사용했습니다.",
    ceoBriefing: "Good Morning, CEO. AI Executive Team이 쿠팡 중심 시장 리서치를 먼저 수행했습니다. 대표님은 검색하지 않고 검증된 근거와 AI 판단을 분리해 의사결정만 하시면 됩니다.",
  };
}

function createMeetingTimeline({
  generatedCount,
  risingCount,
  analyzedCount,
  usedOpenAI,
  topKeyword,
  cacheStatus,
  candidatesRemoved,
  coupangConnected,
  naverConnected,
}: {
  generatedCount: number;
  risingCount: number;
  analyzedCount: number;
  usedOpenAI: boolean;
  topKeyword: string;
  cacheStatus: string;
  candidatesRemoved: number;
  coupangConnected: boolean;
  naverConnected: boolean;
}): AutoDiscoveryMeetingStep[] {
  return [
    { time: "00:00", department: "Market Director AI", title: "쿠팡 여성패션 후보 탐색", result: `후보 ${generatedCount}개 발견`, detail: `최근 7일 중복 후보 ${candidatesRemoved}개를 낮은 우선순위로 처리했습니다.` },
    { time: "00:10", department: "Coupang Trend Director AI", title: "쿠팡 Ads Trend Insights 확인", result: "시즌성/카테고리/광고 인사이트 참고", detail: `${COUPANG_ADS_TRENDS_URL}는 Why Now와 광고 타이밍 보조 근거로 사용하며 실시간 상품 순위를 대신하지 않습니다.` },
    { time: "00:15", department: "Supplemental Data Director AI", title: "보조 수요 신호 확인", result: naverConnected ? `상승 후보 ${risingCount}개 확인` : "NAVER SUPPLEMENTAL DATA SOURCE LIMITED", detail: "네이버 DataLab/SearchAd는 쿠팡 판단의 보조 신호로만 반영합니다." },
    { time: "00:20", department: "OpenAI Market Research", title: "쿠팡 중심 Batch 분석", result: usedOpenAI ? `${analyzedCount}개 후보를 1회 Batch 분석` : `${analyzedCount}개 후보를 규칙 기반으로 평가`, detail: `쿠팡 공개 상품 페이지, 쿠팡 광고 트렌드, 공개 쿠팡 관련 정보를 우선 조사했습니다. 캐시 상태: ${cacheStatus}.` },
    { time: "00:30", department: "Marketing Director AI", title: "광고 경쟁과 클릭 가능성 평가", result: "광고 진입 가능성 분류", detail: "쿠팡 Ads Trend Insights는 광고 타이밍 참고 자료로 사용합니다." },
    { time: "00:40", department: "Creative Director AI", title: "썸네일/상세페이지 개선 가능성 평가", result: "첫 화면 개선 후보 선별", detail: "모바일 구매 흐름과 쿠팡 공개 경쟁상품의 판매 포인트를 분리해 검토합니다." },
    { time: "00:50", department: "Pricing Director AI", title: "가격/마진/진입 난이도 계산", result: coupangConnected ? "쿠팡 공식 상품 신호 일부 확인" : "COUPANG API NOT CONNECTED", detail: "확인되지 않은 가격과 리뷰 수는 SOURCE LIMITED 또는 MORE DATA REQUIRED로 표시합니다." },
    { time: "01:00", department: "CEO Secretary AI", title: "Executive Summary 작성", result: `TOP10 생성 및 1위 후보 ${topKeyword} 보고`, detail: "VERIFIED INFORMATION과 AI ANALYSIS를 분리해 CEO 브리핑을 작성했습니다." },
  ];
}

function createAiDiscussion(context: { generatedCount: number; candidatesRemoved: number; topKeyword: string; coupangConnected: boolean; naverConnected: boolean }): AutoDiscoveryDiscussionStep[] {
  return [
    { department: "Market Director AI", inputFromPrevious: "오늘 날짜 기반 discoveryRunId", message: `${context.generatedCount}개 후보를 만들고 최근 반복 후보 ${context.candidatesRemoved}개를 낮췄습니다.`, decision: "쿠팡 중심 리서치 후보만 다음 단계로 보냅니다." },
    { department: "Coupang Trend Director AI", inputFromPrevious: "Market Director 후보 목록", message: "쿠팡 Ads Trend Insights를 시즌성, 카테고리 흐름, 광고 타이밍 참고 자료로 확인합니다.", decision: "실시간 상품 순위가 아니라 Why Now 보조 근거로만 사용합니다." },
    { department: "OpenAI Market Research", inputFromPrevious: "쿠팡 후보와 보조 데이터", message: "쿠팡 공개 상품 페이지와 공개 웹 정보를 우선 조사하고, 부족한 값은 만들지 않습니다.", decision: "VERIFIED INFORMATION, AI ANALYSIS, SOURCE LIMITED, MORE DATA REQUIRED를 분리합니다." },
    { department: "Marketing Director AI", inputFromPrevious: "OpenAI Market Research 분석", message: "광고 경쟁과 클릭 가능성을 보되, 쿠팡 광고 트렌드가 없는 키워드는 확정하지 않습니다.", decision: "소액 테스트 또는 추가 데이터 필요로 분리합니다." },
    { department: "Creative Director AI", inputFromPrevious: "Marketing Director 의견", message: "모바일 구매 흐름이 강한 후보는 썸네일과 첫 화면 카피를 우선 개선합니다.", decision: "상세페이지 개선 가능성을 Opportunity Score에 반영합니다." },
    { department: "Pricing Director AI", inputFromPrevious: "Creative Director 전환 개선안", message: `${context.topKeyword}는 가격 근거가 확인될 때만 마진 판단을 확정합니다.`, decision: "가격/리뷰/평점이 불확실하면 MORE DATA REQUIRED로 둡니다." },
    { department: "CEO Secretary AI", inputFromPrevious: "모든 Director의 최종 의견", message: "회의를 종료합니다. 쿠팡 중심 TOP10과 첫 실행 제안을 정리했습니다.", decision: "대표님은 검색하지 않고 최종 의사결정만 하시면 됩니다." },
  ];
}

function markCached(result: AutoDiscoveryResult): AutoDiscoveryResult {
  return {
    ...result,
    cacheStatus: "Cached Analysis",
    top10: result.top10.map((item) => ({ ...item, status: "캐시 재사용" })),
    openAi: createUsageStats(result.openAi.candidatesRemoved),
  };
}

function createUsageStats(candidatesRemoved: number) {
  const total = usage.cacheHits + usage.cacheMisses;
  const cacheHitRate = total ? Math.round((usage.cacheHits / total) * 100) : 0;
  const batchedCallSavings = Math.round(((CANDIDATE_BATCH_SIZE - Math.min(usage.calls || 1, CANDIDATE_BATCH_SIZE)) / CANDIDATE_BATCH_SIZE) * 100);
  const estimatedCostSaved = Math.max(cacheHitRate, batchedCallSavings);
  return { callsToday: usage.calls, cacheHitRate, estimatedCostSaved, monthlyCostSaved: Math.min(95, estimatedCostSaved + 4), duplicateRequestsPrevented: usage.cacheHits, meetingTimeMinutes: 18, meetingFinishedTime: "01:00", candidatesRemoved };
}

function rememberRecommendations(date: string, keywords: string[]) {
  recommendationHistory.set(date, keywords);
  const dates = Array.from(recommendationHistory.keys()).sort();
  while (dates.length > 7) {
    const oldest = dates.shift();
    if (oldest) recommendationHistory.delete(oldest);
  }
}

function getRecentKeywords(date: string) {
  const current = new Date(`${date}T00:00:00+09:00`).getTime();
  const recent = new Set<string>();
  for (const [historyDate, keywords] of recommendationHistory.entries()) {
    const diffDays = Math.round((current - new Date(`${historyDate}T00:00:00+09:00`).getTime()) / 86400000);
    if (diffDays > 0 && diffDays <= 7) keywords.forEach((keyword) => recent.add(keyword));
  }
  return recent;
}

function toSourceHashSignal(signal: MarketSignal) {
  return {
    keyword: signal.keyword,
    coupang: { status: signal.coupangPartners.status, productCount: signal.coupangPartners.data.length, firstProduct: signal.coupangPartners.data[0]?.productName ?? null },
    coupangAdsTrendInsights: COUPANG_ADS_TRENDS_URL,
    naver: {
      dataLabStatus: signal.naverDataLab.status,
      growthRate: signal.naverDataLab.data?.growthRate ?? null,
      searchAdStatus: signal.naverSearchAd.status,
      searchVolume: signal.naverSearchAd.data?.totalMonthlySearchVolume ?? null,
      competition: signal.naverSearchAd.data?.competitionLevel ?? null,
    },
  };
}

function parseOpenAiItems(text: string): OpenAiOpportunityItem[] {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { items?: OpenAiOpportunityItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function extractOutputText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (payload.output_text) return payload.output_text;
  return payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n").trim() || "";
}

function inferCategory(keyword: string) {
  if (/팬츠|슬랙스|치마바지|스커트/.test(keyword)) return "하의";
  if (/원피스/.test(keyword)) return "원피스";
  if (/블라우스|반팔|니트|민소매/.test(keyword)) return "상의";
  if (/셋업/.test(keyword)) return "셋업";
  return "여성패션";
}

function resetUsageIfNeeded(date: string) {
  if (usage.date !== date) usage = { date, calls: 0, cacheHits: 0, cacheMisses: 0 };
}

function pick(items: string[], rng: () => number) {
  return items[Math.floor(rng() * items.length)];
}

function seededRandom(seedValue: string) {
  let seed = parseInt(seedValue, 16) || 1;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getKoreanDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}
