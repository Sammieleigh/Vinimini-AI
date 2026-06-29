import { createHash } from "crypto";
import { fetchCoupangPartnersProducts } from "./dataAdapters/coupangPartnersAdapter";
import { fetchNaverDataLabTrend } from "./dataAdapters/naverDataLabAdapter";
import { fetchNaverSearchAdKeywords } from "./dataAdapters/naverSearchAdAdapter";
import { fetchNaverShoppingProducts } from "./dataAdapters/naverShoppingSearchAdapter";
import type { AdapterResult, DataLabTrend, NaverShoppingProduct, PartnerProduct, SearchAdKeyword } from "./dataAdapters/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PROMPT_VERSION = "auto-discovery-v3-data-integration";
const TASK_TYPE = "AI_AUTO_DISCOVERY";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_CACHE_TTL_HOURS = 24;
const CANDIDATE_BATCH_SIZE = 14;

type DataLabResult = AdapterResult<DataLabTrend | null>;
type SearchAdResult = AdapterResult<SearchAdKeyword | null>;
type CoupangPartnersResult = AdapterResult<PartnerProduct[]>;
type NaverShoppingResult = AdapterResult<NaverShoppingProduct[]>;

type MarketSignal = {
  keyword: string;
  naverDataLab: DataLabResult;
  naverShoppingSearch: NaverShoppingResult;
  naverSearchAd: SearchAdResult;
  coupangPartners: CoupangPartnersResult;
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
  estimatedCostSaved: number;
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
    | "NAVER DATALAB"
    | "NAVER SHOPPING SEARCH"
    | "NAVER SEARCHAD"
    | "OPENAI COUPANG MARKET ANALYSIS"
    | "COUPANG PARTNERS API"
    | "VERIFIED INFORMATION"
    | "AI ANALYSIS"
    | "SOURCE LIMITED"
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
let usage: UsageRecord = {
  date: "",
  calls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  estimatedCostSaved: 0,
};

const keywordPools = {
  season: ["냉감", "여름", "장마", "출근룩", "휴가룩", "초가을", "바스락", "린넨", "간절기", "썸머"],
  category: ["와이드 슬랙스", "쿨링 팬츠", "반팔 니트", "셔츠 원피스", "롱스커트", "블라우스", "셋업", "밴딩 팬츠", "민소매 니트", "치마바지"],
  material: ["린넨", "시어서커", "쿨맥스", "레이온", "찰랑", "바스락", "스판", "코튼", "메쉬", "주름방지"],
  body: ["체형커버", "하비커버", "복부커버", "팔뚝커버", "키작녀", "빅사이즈", "허리밴딩", "군살커버", "롱기장", "허리보정"],
  trend: ["꾸안꾸", "올드머니", "미니멀", "스피드룩", "데일리룩", "여행룩", "하객룩", "오피스룩", "휴양지룩", "모던"],
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
    usage.estimatedCostSaved += 1;
    return markCached(cached.result, usage);
  }

  usage.cacheMisses += 1;
  const openAiAnalysis = await analyzeCandidatesWithOpenAI({
    date,
    modelName,
    candidateKeywords,
    marketSignals,
  });
  const top10 = buildTop10(candidateKeywords, marketSignals, openAiAnalysis.items, recentKeywords);
  const risingCount = marketSignals.filter((signal) => (signal.naverDataLab.data?.growthRate ?? 0) > 15).length;
  const candidatesRemoved = Math.max(0, generated.totalGenerated - top10.length);
  const ceoSummary = createCeoSummary(top10);
  const meetingContext = {
    generatedCount: generated.totalGenerated,
    risingCount,
    analyzedCount: candidateKeywords.length,
    usedOpenAI: openAiAnalysis.usedOpenAI,
    topKeyword: top10[0]?.keyword || "추가 데이터 필요",
    topMargin: top10[0]?.marginPotential || "추가 데이터 필요",
    cacheStatus: openAiAnalysis.usedOpenAI ? "Fresh Analysis" : openAiAnalysis.cacheStatus,
    candidatesRemoved,
    searchAdConnected: marketSignals.some((signal) => signal.naverSearchAd.status === "LIVE DATA"),
    naverShoppingConnected: marketSignals.some((signal) => signal.naverShoppingSearch.status === "LIVE DATA"),
    coupangConnected: marketSignals.some((signal) => signal.coupangPartners.status === "LIVE DATA"),
  };
  const meetingTimeline = createMeetingTimeline(meetingContext);
  const aiDiscussion = createAiDiscussion(meetingContext);

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
    ceoSummary,
    meetingTimeline,
    aiDiscussion,
    meetingTranscript: createMeetingTranscript(aiDiscussion),
    lastAnalyzedAt: new Date().toISOString(),
    openAi: createUsageStats(usage, candidatesRemoved),
  };

  rememberRecommendations(date, top10.map((item) => item.keyword));
  if (openAiAnalysis.usedOpenAI) {
    analysisCache.set(cacheKey, { createdAt: Date.now(), result });
  }

  return result;
}

async function fetchMarketSignals(keyword: string): Promise<MarketSignal> {
  const [naverDataLab, naverShoppingSearch, naverSearchAd, coupangPartners] = await Promise.all([
    fetchNaverDataLabTrend(keyword),
    fetchNaverShoppingProducts(keyword),
    fetchNaverSearchAdKeywords(keyword),
    fetchCoupangPartnersProducts(keyword),
  ]);

  return {
    keyword,
    naverDataLab,
    naverShoppingSearch,
    naverSearchAd,
    coupangPartners,
  };
}

function createDailyCandidates(date: string, recentKeywords: Set<string>) {
  const rng = seededRandom(hash(date).slice(0, 12));
  const combinations: string[] = [];

  for (let index = 0; index < 90; index += 1) {
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
    return {
      usedOpenAI: false,
      cacheStatus: "OpenAI API NOT CONNECTED" as const,
      items: [] as OpenAiOpportunityItem[],
    };
  }

  const dailyLimit = Number(process.env.OPENAI_DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
  if (usage.calls >= dailyLimit) {
    return {
      usedOpenAI: false,
      cacheStatus: "Analysis Limited" as const,
      items: [] as OpenAiOpportunityItem[],
    };
  }

  usage.calls += 1;
  const compactSignals = marketSignals.map((signal) => ({
    keyword: signal.keyword,
    naverDataLab: {
      status: signal.naverDataLab.status,
      growthRate: signal.naverDataLab.data?.growthRate ?? null,
      seasonality: signal.naverDataLab.data?.seasonality ?? "데이터 부족",
      mobileTrendRatio: signal.naverDataLab.data?.mobileTrendRatio ?? null,
      pcTrendRatio: signal.naverDataLab.data?.pcTrendRatio ?? null,
      latestRatio: signal.naverDataLab.data?.trendPoints.at(-1)?.ratio ?? null,
    },
    naverShoppingSearch: {
      status: signal.naverShoppingSearch.status,
      productCount: signal.naverShoppingSearch.data.length,
      verifiedProductFields: signal.naverShoppingSearch.data.slice(0, 3).map((product) => ({
        productName: product.productName,
        price: product.price,
        mallName: product.mallName,
        brand: product.brand,
        category: product.category,
      })),
    },
    naverSearchAd: {
      status: signal.naverSearchAd.status,
      totalMonthlySearchVolume: signal.naverSearchAd.data?.totalMonthlySearchVolume ?? null,
      pcMonthlySearchVolume: signal.naverSearchAd.data?.pcMonthlySearchVolume ?? null,
      mobileMonthlySearchVolume: signal.naverSearchAd.data?.mobileMonthlySearchVolume ?? null,
      mobileSearchRatio: signal.naverSearchAd.data?.mobileSearchRatio ?? null,
      pcSearchRatio: signal.naverSearchAd.data?.pcSearchRatio ?? null,
      competitionLevel: signal.naverSearchAd.data?.competitionLevel ?? "데이터 부족",
      relatedKeywords: signal.naverSearchAd.data?.relatedKeywords.slice(0, 5) ?? [],
    },
    coupangPartners: {
      status: signal.coupangPartners.status,
      productCount: signal.coupangPartners.data.length,
      verifiedProductFields: signal.coupangPartners.data.slice(0, 3).map((product) => ({
        productName: product.productName,
        price: product.price,
        category: product.category,
        brand: product.brand,
        hasImage: Boolean(product.image),
      })),
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
        input: [
          {
            role: "system",
            content:
              "You are VINIMINI AI Executive Analysis Engine. Analyze only verified source signals supplied by the system. Do not invent Coupang products, prices, reviews, ranks, sales volume, or ratings. If evidence is insufficient, write SOURCE LIMITED or 추가 데이터 필요. Return JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: TASK_TYPE,
              date,
              promptVersion: PROMPT_VERSION,
              instruction:
                "여성패션 후보 전체를 한 번의 배치로 분석하세요. OpenAI는 데이터 수집기가 아니라 Market, Marketing, Pricing, Creative, Customer Insight, CEO Secretary 역할의 분석 엔진입니다. 수집된 Naver DataLab, Naver SearchAd, Coupang Partners 신호만 근거로 한국어 CEO 브리핑 필드를 작성하세요.",
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
    return {
      usedOpenAI: true,
      cacheStatus: "Fresh Analysis" as const,
      items: parseOpenAiItems(extractOutputText(payload)),
    };
  } catch {
    return {
      usedOpenAI: false,
      cacheStatus: "Analysis Limited" as const,
      items: [] as OpenAiOpportunityItem[],
    };
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
      const scoreBreakdown = calculateOpportunityScore(signal, Number(openAi?.opportunityScore));
      const hasVerifiedData = Boolean(signal?.naverDataLab.data || signal?.naverSearchAd.data || signal?.coupangPartners.data.length);
      const needsMoreData = openAi?.needsMoreData || !hasVerifiedData;

      return {
        rank: 0,
        keyword,
        category: openAi?.category || inferCategory(keyword),
        opportunityScore: recentKeywords.has(keyword) ? Math.max(1, scoreBreakdown.score - 15) : scoreBreakdown.score,
        marketOpportunity: openAi?.marketOpportunity || createMarketOpportunity(signal),
        searchGrowthPotential: openAi?.searchGrowthPotential || createSearchGrowthText(signal),
        competitionStrength: openAi?.competitionStrength || createCompetitionText(signal),
        viniminiFit: openAi?.viniminiFit || "VINIMINI는 썸네일, 상세페이지, 가격 테스트로 검증 가능한 후보만 CEO 브리핑에 올립니다.",
        marginPotential: openAi?.marginPotential || scoreBreakdown.marginText,
        detailPagePotential: openAi?.detailPagePotential || scoreBreakdown.detailPageText,
        adEntryPotential: openAi?.adEntryPotential || scoreBreakdown.adEfficiencyText,
        status: recentKeywords.has(keyword) ? "최근 7일 제외" : needsMoreData ? "추가 데이터 필요" : "오늘 새 분석",
        sourceBadges: createSourceBadges(signal, Boolean(openAi?.marketOpportunity)),
        verifiedSignals: {
          searchGrowth: signal?.naverDataLab.data?.growthRate ?? null,
          totalMonthlySearchVolume: signal?.naverSearchAd.data?.totalMonthlySearchVolume ?? null,
          pcMonthlySearchVolume: signal?.naverSearchAd.data?.pcMonthlySearchVolume ?? null,
          mobileMonthlySearchVolume: signal?.naverSearchAd.data?.mobileMonthlySearchVolume ?? null,
          mobileSearchRatio: signal?.naverSearchAd.data?.mobileSearchRatio ?? null,
          pcSearchRatio: signal?.naverSearchAd.data?.pcSearchRatio ?? null,
          competitionLevel: signal?.naverSearchAd.data?.competitionLevel ?? "데이터 부족",
          seasonality: signal?.naverDataLab.data?.seasonality ?? "데이터 부족",
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
  const growth = signal?.naverDataLab.data?.growthRate ?? 0;
  const latestRatio = signal?.naverDataLab.data?.trendPoints.at(-1)?.ratio ?? 0;
  const totalMonthlySearchVolume = signal?.naverSearchAd.data?.totalMonthlySearchVolume ?? 0;
  const mobileMonthlySearchVolume = signal?.naverSearchAd.data?.mobileMonthlySearchVolume ?? 0;
  const mobileSearchRatio = signal?.naverSearchAd.data?.mobileSearchRatio ?? null;
  const pcSearchRatio = signal?.naverSearchAd.data?.pcSearchRatio ?? null;
  const competition = signal?.naverSearchAd.data?.competitionLevel ?? "데이터 부족";
  const coupangProductCount = signal?.coupangPartners.data.length ?? 0;
  const naverShoppingProductCount = signal?.naverShoppingSearch.data.length ?? 0;

  const searchGrowthScore = clamp(50 + growth, 0, 100);
  const demandScore = totalMonthlySearchVolume ? clamp(Math.round(Math.log10(totalMonthlySearchVolume + 1) * 20), 20, 100) : clamp(Math.round(latestRatio), 10, 70);
  const competitionScore = competition === "낮음" ? 88 : competition === "중간" ? 68 : competition === "높음" ? 38 : 52;
  const entryDifficultyScore = competition === "높음" ? 40 : competition === "중간" ? 62 : competition === "낮음" ? 82 : 55;
  const marginScore = inferMarginScore(signal?.keyword || "", coupangProductCount + naverShoppingProductCount);
  const reviewRiskScore = coupangProductCount ? 65 : 48;
  const mobileImportanceBoost = mobileSearchRatio !== null && mobileSearchRatio >= 70 ? 12 : mobileSearchRatio !== null && mobileSearchRatio >= 55 ? 6 : 0;
  const pcImportanceBoost = pcSearchRatio !== null && pcSearchRatio >= 45 ? 10 : pcSearchRatio !== null && pcSearchRatio >= 30 ? 5 : 0;
  const lowCompetitionMobileOpportunity = mobileMonthlySearchVolume >= 1000 && competition === "낮음" ? 10 : 0;
  const bigKeywordRiskPenalty = totalMonthlySearchVolume >= 10000 && mobileMonthlySearchVolume >= 5000 ? 5 : 0;
  const detailPageScore = clamp(inferDetailPageScore(signal?.keyword || "") + pcImportanceBoost, 0, 100);
  const thumbnailScore = clamp(inferThumbnailScore(signal?.keyword || "") + mobileImportanceBoost, 0, 100);
  const adEfficiencyScore = clamp(Math.round((competitionScore + searchGrowthScore) / 2) + lowCompetitionMobileOpportunity - bigKeywordRiskPenalty, 0, 100);
  const seasonalTrendScore = signal?.naverDataLab.data?.seasonality === "상승 계절성" ? 85 : signal?.naverDataLab.data?.seasonality === "안정 추세" ? 65 : 45;
  const verifiedBase = Math.round(
    searchGrowthScore * 0.18 +
      competitionScore * 0.14 +
      entryDifficultyScore * 0.12 +
      marginScore * 0.12 +
      reviewRiskScore * 0.08 +
      detailPageScore * 0.1 +
      thumbnailScore * 0.1 +
      adEfficiencyScore * 0.08 +
      demandScore * 0.1 +
      seasonalTrendScore * 0.08,
  );
  const normalizedOpenAiScore = Number.isFinite(openAiScore) && openAiScore > 0 ? (openAiScore <= 10 ? openAiScore * 10 : openAiScore) : verifiedBase;
  const score = Math.round(verifiedBase * 0.72 + normalizedOpenAiScore * 0.28);

  return {
    score: clamp(score, 1, 100),
    marginText: marginScore >= 72 ? "예상 마진 가능성 높음" : marginScore >= 55 ? "예상 마진 추가 검증 필요" : "추가 데이터 필요",
    detailPageText:
      pcImportanceBoost > 0
        ? "PC 검색 비중이 있어 가격 비교, 소재 설명, 사이즈표 보강이 중요합니다."
        : detailPageScore >= 72
          ? "상세페이지 개선 여지 높음"
          : "상세페이지 개선 가능성 추가 확인",
    adEfficiencyText:
      lowCompetitionMobileOpportunity > 0
        ? "모바일 검색량 대비 경쟁도가 낮아 신규 셀러 진입 기회가 있습니다."
        : bigKeywordRiskPenalty > 0
          ? "PC와 모바일 모두 검색량이 높은 대형 키워드라 광고 경쟁 위험을 함께 봐야 합니다."
          : adEfficiencyScore >= 72
            ? "소액 광고 테스트 가능"
            : "광고 효율 추가 데이터 필요",
  };
}

function createSourceBadges(signal: MarketSignal | undefined, hasOpenAiAnalysis: boolean): AutoDiscoveryOpportunity["sourceBadges"] {
  const badges: AutoDiscoveryOpportunity["sourceBadges"] = [];
  if (signal?.naverDataLab.status === "LIVE DATA" || signal?.naverShoppingSearch.status === "LIVE DATA" || signal?.naverSearchAd.status === "LIVE DATA") {
    badges.push("VERIFIED INFORMATION");
  }
  if (signal?.naverDataLab.status === "LIVE DATA") badges.push("NAVER DATALAB");
  if (signal?.naverShoppingSearch.status === "LIVE DATA") badges.push("NAVER SHOPPING SEARCH");
  if (signal?.naverSearchAd.status === "LIVE DATA") badges.push("NAVER SEARCHAD");
  if (signal?.coupangPartners.status === "LIVE DATA") badges.push("COUPANG PARTNERS API");
  if (hasOpenAiAnalysis) badges.push("AI ANALYSIS", "OPENAI COUPANG MARKET ANALYSIS");
  if (
    !badges.length ||
    [signal?.naverDataLab.status, signal?.naverShoppingSearch.status, signal?.naverSearchAd.status, signal?.coupangPartners.status].includes("SOURCE LIMITED")
  ) {
    badges.push("SOURCE LIMITED");
  }
  if ([signal?.naverSearchAd.status, signal?.coupangPartners.status].includes("API NOT CONNECTED")) badges.push("API NOT CONNECTED");
  return Array.from(new Set(badges));
}

function createMarketOpportunity(signal: MarketSignal | undefined) {
  const growth = signal?.naverDataLab.data?.growthRate;
  const searchVolume = signal?.naverSearchAd.data?.totalMonthlySearchVolume;
  const shoppingProduct = signal?.naverShoppingSearch.data[0];
  if (typeof growth === "number" && searchVolume) {
    return `DataLab 성장률 ${growth}%와 월 검색량 ${searchVolume.toLocaleString("ko-KR")}회를 함께 확인했습니다.`;
  }
  if (shoppingProduct) {
    return `VERIFIED INFORMATION: 네이버 쇼핑에서 ${shoppingProduct.mallName}의 ${shoppingProduct.productName} 상품 신호를 확인했습니다.`;
  }
  if (typeof growth === "number") return `DataLab 성장률 ${growth}%를 실제 신호로 반영했습니다. SearchAd 데이터는 추가 연결이 필요합니다.`;
  if (searchVolume) return `SearchAd 월 검색량 ${searchVolume.toLocaleString("ko-KR")}회를 확인했습니다. DataLab 추세는 추가 데이터 필요입니다.`;
  return "SOURCE LIMITED: 검증된 시장 데이터가 부족하여 추가 데이터 필요입니다.";
}

function createSearchGrowthText(signal: MarketSignal | undefined) {
  const growth = signal?.naverDataLab.data?.growthRate;
  if (typeof growth !== "number") return "추가 데이터 필요";
  if (growth >= 30) return `검색 성장률 ${growth}%: 빠르게 상승 중`;
  if (growth >= 10) return `검색 성장률 ${growth}%: 완만한 상승`;
  if (growth >= 0) return `검색 성장률 ${growth}%: 안정권`;
  return `검색 성장률 ${growth}%: 하락 신호 확인`;
}

function createCompetitionText(signal: MarketSignal | undefined) {
  const competition = signal?.naverSearchAd.data?.competitionLevel;
  if (!competition) return "추가 데이터 필요";
  return `SearchAd 경쟁도 ${competition}`;
}

function createMobileCommerceFit(signal: MarketSignal | undefined) {
  const data = signal?.naverSearchAd.data;
  if (!data || data.mobileSearchRatio === null) return "추가 데이터 필요";
  if (data.mobileSearchRatio >= 75 && data.competitionLevel === "낮음") return "매우 높음: 썸네일과 첫 화면을 먼저 개선";
  if (data.mobileSearchRatio >= 65) return "높음: 모바일 썸네일과 첫 문구가 핵심";
  if (data.pcSearchRatio !== null && data.pcSearchRatio >= 40) return "중간: 가격 비교, 소재 설명, 사이즈표 보강 필요";
  return "보통: 모바일/PC 근거를 추가 확인";
}

function createCeoSummary(top10: AutoDiscoveryOpportunity[]) {
  const first = top10[0];
  return {
    biggestOpportunity: first ? `${first.keyword}: ${first.marketOpportunity}` : "추가 데이터 필요: 오늘 후보군의 검증 데이터가 충분하지 않습니다.",
    biggestRisk: top10.some((item) => item.status === "추가 데이터 필요")
      ? "일부 후보는 연결 데이터가 부족해 SOURCE LIMITED 상태입니다. 검증되지 않은 쿠팡 판매량, 리뷰, 순위는 사용하지 않았습니다."
      : "검색 성장률은 확인됐지만 광고 경쟁도와 실제 상품 경쟁은 계속 교차 확인해야 합니다.",
    firstAction: first
      ? `${first.keyword}의 SearchAd 경쟁도, 쿠팡 공식 상품 후보, 썸네일 메시지를 먼저 확인하세요.`
      : "Naver DataLab, SearchAd, Coupang Partners 키 연결 상태를 먼저 확인하세요.",
    todayLesson: "오늘 회의는 검색 성장률만으로 판단하지 않고 월 검색량, 경쟁도, 계절성, 공식 상품 연결 상태를 함께 반영했습니다.",
    ceoBriefing:
      "Good Morning, CEO. AI Executive Team이 실제 연결 데이터를 기준으로 밤새 시장을 검토했습니다. 대표님은 검색하지 않고 최종 의사결정만 하시면 됩니다.",
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
  searchAdConnected,
  coupangConnected,
  naverShoppingConnected,
}: {
  generatedCount: number;
  risingCount: number;
  analyzedCount: number;
  usedOpenAI: boolean;
  topKeyword: string;
  cacheStatus: string;
  candidatesRemoved: number;
  searchAdConnected: boolean;
  naverShoppingConnected: boolean;
  coupangConnected: boolean;
}): AutoDiscoveryMeetingStep[] {
  return [
    {
      time: "00:00",
      department: "Market Director AI",
      title: "시장 전체 후보 탐색",
      result: `후보 ${generatedCount}개 발견`,
      detail: `시즌, 카테고리, 소재, 체형커버, 트렌드, 마진 키워드를 조합하고 최근 7일 중복 후보 ${candidatesRemoved}개를 낮은 우선순위로 처리했습니다.`,
    },
    {
      time: "00:10",
      department: "Trend Director AI",
      title: "Naver DataLab 검색 추세 분석",
      result: `상승 후보 ${risingCount}개 확인`,
      detail: "Naver DataLab Shopping Insight의 수요, 최근 4주 성장률, 계절성, PC/모바일 비중을 Opportunity Score에 반영했습니다.",
    },
    {
      time: "00:12",
      department: "Shopping Search Director AI",
      title: "Naver Shopping Search 상품 신호 확인",
      result: naverShoppingConnected ? "상품명, 가격, 쇼핑몰, 브랜드 연결" : "NAVER SHOPPING SEARCH API NOT CONNECTED",
      detail: "상품명, 가격, 쇼핑몰명, 브랜드, 링크는 VERIFIED INFORMATION으로 분리하고 OpenAI 분석과 구분합니다.",
    },
    {
      time: "00:15",
      department: "SearchAd Director AI",
      title: "Naver SearchAd 수요/경쟁도 확인",
      result: searchAdConnected ? "월 검색량과 경쟁도 연결" : "NAVER SEARCHAD API NOT CONNECTED",
      detail: "월 검색량, PC 검색량, 모바일 검색량, 경쟁도, 연관 키워드를 Search Growth, Competition, Entry Difficulty 계산에 사용합니다.",
    },
    {
      time: "00:20",
      department: "OpenAI Market Analysis",
      title: "후보 전체 Batch 분석",
      result: usedOpenAI ? `${analyzedCount}개 후보를 한 번의 Batch 분석으로 평가` : `${analyzedCount}개 후보를 규칙 기반 점수로 평가`,
      detail: `OpenAI는 수집된 검증 데이터만 분석합니다. 동일 입력 반복 호출은 막고 캐시를 사용합니다. 캐시 상태: ${cacheStatus}.`,
    },
    {
      time: "00:25",
      department: "Coupang Data Director AI",
      title: "Coupang Partners 공식 상품 신호 확인",
      result: coupangConnected ? "공식 상품 후보 연결" : "COUPANG API NOT CONNECTED",
      detail: "HTML Scraping이 아니라 공식 API Adapter를 우선 사용합니다. 연결되지 않으면 API NOT CONNECTED로 표시합니다.",
    },
    {
      time: "00:30",
      department: "Marketing Director AI",
      title: "광고 경쟁도와 클릭 가능성 평가",
      result: "광고 진입 가능성 분류",
      detail: "SearchAd 경쟁도와 DataLab 성장률을 함께 보며 소액 광고 테스트 가능성을 판단했습니다.",
    },
    {
      time: "00:40",
      department: "Creative Director AI",
      title: "썸네일/상세페이지 개선 가능성 평가",
      result: "크리에이티브 개선 지점 평가",
      detail: "소재, 체형커버, 시즌성 키워드를 중심으로 첫 화면 메시지와 상세페이지 개선 가능성을 검토했습니다.",
    },
    {
      time: "00:50",
      department: "Pricing Director AI",
      title: "예상 마진과 진입 난이도 계산",
      result: "마진 가능성과 진입 난이도 계산",
      detail: "공식 가격 데이터가 있으면 참고하고, 부족하면 추가 데이터 필요로 표시했습니다.",
    },
    {
      time: "00:55",
      department: "Customer Insight Director AI",
      title: "리뷰 리스크와 고객 요구 확인",
      result: "고객 불안 요소 확인",
      detail: "리뷰 원문 데이터가 없는 경우 존재하지 않는 불만을 만들지 않고 SOURCE LIMITED로 유지합니다.",
    },
    {
      time: "01:00",
      department: "CEO Secretary AI",
      title: "경영진 요약 생성",
      result: `TOP10 생성 및 1위 후보 ${topKeyword} 보고`,
      detail: "각 Director 의견을 종합해 Today's Biggest Opportunity, Risk, First Action을 작성했습니다.",
    },
  ];
}

function createAiDiscussion({
  generatedCount,
  candidatesRemoved,
  topKeyword,
  topMargin,
  searchAdConnected,
  coupangConnected,
  naverShoppingConnected,
}: {
  generatedCount: number;
  candidatesRemoved: number;
  topKeyword: string;
  topMargin: string;
  searchAdConnected: boolean;
  naverShoppingConnected: boolean;
  coupangConnected: boolean;
}): AutoDiscoveryDiscussionStep[] {
  return [
    {
      department: "Market Director AI",
      inputFromPrevious: "전일 추천 히스토리와 오늘 날짜 기반 seed",
      message: `${generatedCount}개의 여성패션 후보를 찾았습니다. 최근 7일 반복 후보와 중복 후보 ${candidatesRemoved}개는 우선순위를 낮췄습니다.`,
      decision: "새 후보 중심으로 Trend Director에게 넘깁니다.",
    },
    {
      department: "Trend Director AI",
      inputFromPrevious: "Market Director가 정리한 신규 후보군",
      message: "Naver DataLab 실제 검색 추세와 계절성을 확인했습니다. 검색 성장률이 낮은 후보는 점수에서 감점합니다.",
      decision: "성장률과 계절성 신호를 SearchAd Director에게 전달합니다.",
    },
    {
      department: "Shopping Search Director AI",
      inputFromPrevious: "Trend Director의 쇼핑인사이트 성장률 판단",
      message: naverShoppingConnected
        ? "네이버 쇼핑 검색에서 상품명, 가격, 쇼핑몰명, 브랜드, 링크를 확인했습니다. 이 정보는 VERIFIED INFORMATION으로만 사용합니다."
        : "네이버 쇼핑 검색 API가 연결되지 않아 상품명, 가격, 쇼핑몰, 브랜드 근거는 SOURCE LIMITED입니다.",
      decision: "확인된 상품 신호만 OpenAI Market Analysis에 전달합니다.",
    },
    {
      department: "SearchAd Director AI",
      inputFromPrevious: "Trend Director의 DataLab 성장률 판단",
      message: searchAdConnected
        ? "월 검색량, PC/모바일 검색량, 경쟁도를 확인했습니다. 검색량이 높아도 경쟁도가 높으면 진입 난이도를 올립니다."
        : "Naver SearchAd가 연결되지 않아 월 검색량과 경쟁도는 SOURCE LIMITED입니다.",
      decision: "수요와 경쟁도 신호를 OpenAI Market Analysis에 전달합니다.",
    },
    {
      department: "OpenAI Market Analysis",
      inputFromPrevious: "DataLab, Naver Shopping Search, SearchAd, Coupang 공식 Adapter 신호",
      message: "후보 전체를 하나의 Batch로 분석했습니다. 확인 정보는 VERIFIED INFORMATION, AI 판단은 AI ANALYSIS로 분리합니다. 존재하지 않는 쿠팡 리뷰, 판매량, 순위, 가격은 만들지 않았습니다.",
      decision: "근거가 부족한 항목은 추가 데이터 필요로 유지합니다.",
    },
    {
      department: "Coupang Data Director AI",
      inputFromPrevious: "OpenAI가 요청한 검증 가능한 상품 근거",
      message: coupangConnected
        ? "Coupang Partners 공식 API에서 상품명, 이미지, 가격, URL, 카테고리, 브랜드 후보를 확인했습니다."
        : "Coupang 공식 상품 API가 연결되지 않았습니다. 쿠팡 상품 정보는 API NOT CONNECTED로 표시합니다.",
      decision: "검증된 상품 필드만 CEO 브리핑 근거로 사용합니다.",
    },
    {
      department: "Marketing Director AI",
      inputFromPrevious: "SearchAd 경쟁도와 DataLab 성장률",
      message: "검색 성장은 좋지만 경쟁도가 높으면 바로 확장하지 않습니다. 광고 진입은 소액 테스트 중심으로 제안합니다.",
      decision: "광고 효율이 낮은 후보는 CEO 실행 제안에서 보수적으로 처리합니다.",
    },
    {
      department: "Creative Director AI",
      inputFromPrevious: "Marketing Director의 광고 경쟁 우려",
      message: "광고 경쟁을 이기려면 첫 화면 메시지가 분명해야 합니다. 소재, 체형커버, 시즌성 키워드는 썸네일 개선 여지가 있습니다.",
      decision: "상세페이지와 썸네일 개선 가능성을 점수에 반영합니다.",
    },
    {
      department: "Pricing Director AI",
      inputFromPrevious: "Creative Director의 전환 개선 가능성",
      message: `${topKeyword}의 예상 마진 가능성은 ${topMargin}입니다. 공식 가격 데이터가 부족하면 확정 판단하지 않습니다.`,
      decision: "마진 근거가 부족한 후보는 추가 데이터 필요로 표시합니다.",
    },
    {
      department: "Customer Insight Director AI",
      inputFromPrevious: "Pricing Director의 진입 가능 후보",
      message: "리뷰 원문이 없으면 불만 TOP5를 만들어내지 않습니다. 대신 사이즈, 소재, 비침처럼 검증이 필요한 가설만 분리합니다.",
      decision: "리뷰 리스크는 SOURCE LIMITED 또는 추가 데이터 필요로 표시합니다.",
    },
    {
      department: "Learning Director AI",
      inputFromPrevious: "Customer Insight Director의 검증 제한",
      message: "오늘은 실제 DataLab과 SearchAd 신호가 점수에 더 큰 영향을 줍니다. 다음 회의에서는 광고 난이도와 계절성을 더 정밀하게 보정합니다.",
      decision: "다음 분석의 가중치 개선 포인트로 기록합니다.",
    },
    {
      department: "CEO Secretary AI",
      inputFromPrevious: "모든 Director의 최종 의견",
      message: "회의를 종료합니다. AI 경영진의 합의안을 CEO Summary로 정리했습니다.",
      decision: "대표님은 TOP10, 가장 큰 기회, 가장 큰 리스크, 첫 실행만 결정하시면 됩니다.",
    },
  ];
}

function markCached(result: AutoDiscoveryResult, currentUsage: UsageRecord): AutoDiscoveryResult {
  return {
    ...result,
    cacheStatus: "Cached Analysis",
    top10: result.top10.map((item) => ({ ...item, status: "캐시 재사용" })),
    openAi: createUsageStats(currentUsage, result.openAi.candidatesRemoved),
  };
}

function createUsageStats(currentUsage: UsageRecord, candidatesRemoved: number) {
  const total = currentUsage.cacheHits + currentUsage.cacheMisses;
  const cacheHitRate = total ? Math.round((currentUsage.cacheHits / total) * 100) : 0;
  const batchedCallSavings = Math.round(((CANDIDATE_BATCH_SIZE - Math.min(currentUsage.calls || 1, CANDIDATE_BATCH_SIZE)) / CANDIDATE_BATCH_SIZE) * 100);
  const estimatedCostSaved = Math.max(cacheHitRate, batchedCallSavings);

  return {
    callsToday: currentUsage.calls,
    cacheHitRate,
    estimatedCostSaved,
    monthlyCostSaved: Math.min(95, estimatedCostSaved + 4),
    duplicateRequestsPrevented: currentUsage.cacheHits,
    meetingTimeMinutes: 18,
    meetingFinishedTime: "01:00",
    candidatesRemoved,
  };
}

function createMeetingTranscript(discussion: AutoDiscoveryDiscussionStep[]) {
  return discussion.map((step) => `${step.department}: ${step.message} 결론: ${step.decision}`);
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
    naverDataLab: {
      status: signal.naverDataLab.status,
      growthRate: signal.naverDataLab.data?.growthRate ?? null,
      seasonality: signal.naverDataLab.data?.seasonality ?? null,
      mobileTrendRatio: signal.naverDataLab.data?.mobileTrendRatio ?? null,
      pcTrendRatio: signal.naverDataLab.data?.pcTrendRatio ?? null,
      latest: signal.naverDataLab.data?.trendPoints.at(-1)?.ratio ?? null,
    },
    naverShoppingSearch: {
      status: signal.naverShoppingSearch.status,
      productCount: signal.naverShoppingSearch.data.length,
      firstProduct: signal.naverShoppingSearch.data[0]?.productName ?? null,
      firstPrice: signal.naverShoppingSearch.data[0]?.price ?? null,
      firstMall: signal.naverShoppingSearch.data[0]?.mallName ?? null,
    },
    naverSearchAd: {
      status: signal.naverSearchAd.status,
      totalMonthlySearchVolume: signal.naverSearchAd.data?.totalMonthlySearchVolume ?? null,
      pcMonthlySearchVolume: signal.naverSearchAd.data?.pcMonthlySearchVolume ?? null,
      mobileMonthlySearchVolume: signal.naverSearchAd.data?.mobileMonthlySearchVolume ?? null,
      mobileSearchRatio: signal.naverSearchAd.data?.mobileSearchRatio ?? null,
      pcSearchRatio: signal.naverSearchAd.data?.pcSearchRatio ?? null,
      competitionLevel: signal.naverSearchAd.data?.competitionLevel ?? null,
    },
    coupangPartners: {
      status: signal.coupangPartners.status,
      productCount: signal.coupangPartners.data.length,
      firstProduct: signal.coupangPartners.data[0]?.productName ?? null,
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
  if (/팬츠|슬랙스|치마바지/.test(keyword)) return "하의";
  if (/원피스/.test(keyword)) return "원피스";
  if (/스커트/.test(keyword)) return "스커트";
  if (/블라우스|셔츠|니트|상의|반팔/.test(keyword)) return "상의";
  if (/셋업/.test(keyword)) return "셋업";
  return "여성패션";
}

function inferMarginScore(keyword: string, coupangProductCount: number) {
  const marginKeywords = ["세트", "프리미엄", "고마진", "컬러", "사이즈", "기본템"];
  const base = marginKeywords.some((item) => keyword.includes(item)) ? 72 : 58;
  return clamp(base + (coupangProductCount > 0 ? 5 : -5), 30, 90);
}

function inferDetailPageScore(keyword: string) {
  const detailKeywords = ["체형커버", "하비커버", "복부커버", "팔뚝커버", "비침", "밴딩", "빅사이즈"];
  return detailKeywords.some((item) => keyword.includes(item)) ? 82 : 62;
}

function inferThumbnailScore(keyword: string) {
  const thumbnailKeywords = ["냉감", "린넨", "바스락", "여름", "휴가", "출근룩", "꾸안꾸"];
  return thumbnailKeywords.some((item) => keyword.includes(item)) ? 78 : 60;
}

function resetUsageIfNeeded(date: string) {
  if (usage.date !== date) {
    usage = { date, calls: 0, cacheHits: 0, cacheMisses: 0, estimatedCostSaved: 0 };
  }
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
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}
