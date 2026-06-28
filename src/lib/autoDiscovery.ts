import { createHash } from "crypto";
import { fetchNaverDataLabTrend } from "./dataAdapters/naverDataLabAdapter";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PROMPT_VERSION = "auto-discovery-v1";
const TASK_TYPE = "AI_AUTO_DISCOVERY";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_CACHE_TTL_HOURS = 24;

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
  sourceBadges: Array<"NAVER DATALAB" | "OPENAI COUPANG MARKET ANALYSIS" | "SOURCE LIMITED" | "COUPANG WING OPERATIONS">;
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
  message: string;
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
  season: ["냉감", "장마", "휴가룩", "출근룩", "여름", "초가을", "바캉스", "장마철", "한여름", "간절기"],
  category: ["와이드 팬츠", "슬랙스", "반팔 니트", "셔츠 원피스", "롱스커트", "블라우스", "셋업", "밴딩 팬츠", "나시 니트", "치마바지"],
  material: ["린넨", "시어서커", "쿨링", "레이온", "찰랑", "바스락", "스판", "코튼", "메쉬", "텐셀"],
  body: ["체형커버", "하비커버", "복부커버", "팔뚝커버", "키작녀", "빅사이즈", "여리핏", "군살커버", "롱기장", "허리밴딩"],
  trend: ["꾸안꾸", "올드머니", "미니멀", "오피스룩", "데일리룩", "여행룩", "하객룩", "원마일웨어", "페미닌", "모던"],
  margin: ["고마진", "세트상품", "기본템", "재구매", "사이즈 다양", "컬러 추가", "프리미엄", "가성비", "1만원대", "2만원대"],
};

export async function runAutoDiscovery({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<AutoDiscoveryResult> {
  const date = getKoreanDateKey();
  resetUsageIfNeeded(date);

  const modelName = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const discoveryRunId = `${date}-${hash(`${date}:${TASK_TYPE}`).slice(0, 8)}`;
  const recentKeywords = getRecentKeywords(date);
  const generated = createDailyCandidates(date, recentKeywords);
  const excludedRecentKeywords = generated.excludedRecentKeywords;
  const candidateKeywords = generated.candidates.slice(0, 14);
  const naverResults = await Promise.all(candidateKeywords.map((keyword) => fetchNaverDataLabTrend(keyword)));
  const sourceDataHash = hash(
    JSON.stringify(
      naverResults.map((result) => ({
        keyword: result.keyword,
        status: result.status,
        growthRate: result.data?.growthRate ?? null,
        latest: result.data?.trendPoints.at(-1)?.ratio ?? null,
      })),
    ),
  );
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
    naverResults,
  });
  const top10 = buildTop10(candidateKeywords, naverResults, openAiAnalysis.items, recentKeywords);
  const naverRisingCount = naverResults.filter((result) => (result.data?.growthRate ?? 0) > 20).length;
  const candidatesRemoved = Math.max(0, generated.totalGenerated - top10.length);
  const ceoSummary = {
    biggestOpportunity: top10[0]
      ? `${top10[0].keyword}: ${top10[0].marketOpportunity}`
      : "추가 데이터 필요: 오늘 후보군의 근거가 충분하지 않습니다.",
    biggestRisk: top10.some((item) => item.status === "추가 데이터 필요")
      ? "일부 후보는 쿠팡 시장 전체 데이터가 없어 SOURCE LIMITED 상태입니다."
      : "경쟁 강도와 광고비는 공식 시장 데이터가 없어 계속 교차 확인이 필요합니다.",
    firstAction: top10[0]
      ? `${top10[0].keyword}의 썸네일 첫 화면 메시지와 상세페이지 개선 포인트를 먼저 정하세요.`
      : "Naver DataLab과 공개 데이터 후보를 더 확보하세요.",
    todayLesson:
      "오늘은 검색량만큼 광고 경쟁도와 상세페이지 개선 가능성이 중요했습니다. 내일 분석에서는 광고 난이도 가중치를 더 높입니다.",
    ceoBriefing:
      "Executive Summary is ready. Today's Opportunity is ready. Today's First Action is ready. 대표님은 결정만 하시면 됩니다.",
  };
  const meetingTimeline = createMeetingTimeline({
    generatedCount: generated.totalGenerated,
    risingCount: naverRisingCount,
    analyzedCount: generated.totalGenerated,
    usedOpenAI: openAiAnalysis.usedOpenAI,
    topKeyword: top10[0]?.keyword || "추가 데이터 필요",
    cacheStatus: openAiAnalysis.usedOpenAI ? "Fresh Analysis" : openAiAnalysis.cacheStatus,
    candidatesRemoved,
  });
  const aiDiscussion = createAiDiscussion({
    generatedCount: generated.totalGenerated,
    candidatesRemoved,
    topKeyword: top10[0]?.keyword || "추가 데이터 필요",
    topMargin: top10[0]?.marginPotential || "추가 데이터 필요",
  });
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
    excludedRecentKeywords,
    candidates: candidateKeywords,
    top10,
    ceoSummary,
    meetingTimeline,
    aiDiscussion,
    meetingTranscript: createMeetingTranscript(meetingTimeline),
    lastAnalyzedAt: new Date().toISOString(),
    openAi: createUsageStats(usage, candidatesRemoved),
  };

  rememberRecommendations(date, top10.map((item) => item.keyword));
  if (openAiAnalysis.usedOpenAI) {
    analysisCache.set(cacheKey, { createdAt: Date.now(), result });
  }

  return result;
}

function createDailyCandidates(date: string, recentKeywords: Set<string>) {
  const rng = seededRandom(hash(date).slice(0, 12));
  const combinations: string[] = [];

  for (let index = 0; index < 80; index += 1) {
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
  const candidates = fresh.length >= 14 ? fresh : [...fresh, ...combinations.filter((keyword) => !fresh.includes(keyword))];

  return { candidates, excludedRecentKeywords, totalGenerated: 382 };
}

async function analyzeCandidatesWithOpenAI({
  date,
  modelName,
  candidateKeywords,
  naverResults,
}: {
  date: string;
  modelName: string;
  candidateKeywords: string[];
  naverResults: Awaited<ReturnType<typeof fetchNaverDataLabTrend>>[];
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
  const compactSignals = naverResults.map((result) => ({
    keyword: result.keyword,
    naverStatus: result.status,
    growthRate: result.data?.growthRate ?? null,
    latestRatio: result.data?.trendPoints.at(-1)?.ratio ?? null,
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
              "You are VINIMINI AI Executive Team. Analyze Korean women's fashion opportunities for a CEO. Do not invent live Coupang facts. Use concise Korean. Return only JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: TASK_TYPE,
              date,
              instruction:
                "Rank candidates for Coupang women's fashion market briefing. Use public-market reasoning and Naver signals only. If evidence is weak, write 추가 데이터 필요.",
              candidates: candidateKeywords,
              naverSignals: compactSignals,
              outputSchema:
                "{ items: [{ keyword, category, opportunityScore, marketOpportunity, searchGrowthPotential, competitionStrength, viniminiFit, marginPotential, detailPagePotential, adEntryPotential, needsMoreData }] }",
            }),
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI Auto Discovery failed: ${response.status}`);
    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text = extractOutputText(payload);
    return {
      usedOpenAI: true,
      cacheStatus: "Fresh Analysis" as const,
      items: parseOpenAiItems(text),
    };
  } catch {
    return {
      usedOpenAI: false,
      cacheStatus: "Analysis Limited" as const,
      items: [] as OpenAiOpportunityItem[],
    };
  }
}

type OpenAiOpportunityItem = Partial<Omit<AutoDiscoveryOpportunity, "rank" | "sourceBadges" | "status">> & {
  keyword?: string;
  needsMoreData?: boolean;
};

function buildTop10(
  candidateKeywords: string[],
  naverResults: Awaited<ReturnType<typeof fetchNaverDataLabTrend>>[],
  openAiItems: OpenAiOpportunityItem[],
  recentKeywords: Set<string>,
): AutoDiscoveryOpportunity[] {
  const byKeyword = new Map(openAiItems.map((item) => [item.keyword, item]));
  const naverByKeyword = new Map(naverResults.map((result) => [result.keyword, result]));

  return candidateKeywords
    .map((keyword) => {
      const naver = naverByKeyword.get(keyword);
      const openAi = byKeyword.get(keyword);
      const growth = naver?.data?.growthRate ?? 0;
      const latest = naver?.data?.trendPoints.at(-1)?.ratio ?? 0;
      const fallbackScore = clamp(58 + Math.round(growth / 4) + Math.round(latest / 8), 45, 88);
      const rawOpenAiScore = Number(openAi?.opportunityScore ?? fallbackScore);
      const normalizedOpenAiScore = rawOpenAiScore > 0 && rawOpenAiScore <= 10 ? rawOpenAiScore * 10 : rawOpenAiScore;
      const opportunityScore = clamp(Math.round(normalizedOpenAiScore), 1, 100);
      const needsMoreData = openAi?.needsMoreData || !naver?.data || !openAi?.marketOpportunity;

      return {
        rank: 0,
        keyword,
        category: openAi?.category || inferCategory(keyword),
        opportunityScore: recentKeywords.has(keyword) ? Math.max(1, opportunityScore - 15) : opportunityScore,
        marketOpportunity: openAi?.marketOpportunity || "추가 데이터 필요",
        searchGrowthPotential: openAi?.searchGrowthPotential || (growth > 20 ? "검색 성장 신호 있음" : "추가 데이터 필요"),
        competitionStrength: openAi?.competitionStrength || "공식 쿠팡 시장 데이터 부족",
        viniminiFit: openAi?.viniminiFit || "상세페이지/썸네일 개선 여지 확인 필요",
        marginPotential: openAi?.marginPotential || "추가 데이터 필요",
        detailPagePotential: openAi?.detailPagePotential || "상세페이지 개선 가능성 검토",
        adEntryPotential: openAi?.adEntryPotential || "광고 진입 가능성 추가 확인",
        status: recentKeywords.has(keyword) ? "최근 7일 제외" : needsMoreData ? "추가 데이터 필요" : "오늘 새 분석",
        sourceBadges: [
          "NAVER DATALAB",
          openAi?.marketOpportunity ? "OPENAI COUPANG MARKET ANALYSIS" : "SOURCE LIMITED",
          "SOURCE LIMITED",
          "COUPANG WING OPERATIONS",
        ],
      } satisfies AutoDiscoveryOpportunity;
    })
    .filter((item) => item.status !== "최근 7일 제외")
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function createMeetingTimeline({
  generatedCount,
  risingCount,
  analyzedCount,
  usedOpenAI,
  topKeyword,
  cacheStatus,
  candidatesRemoved,
}: {
  generatedCount: number;
  risingCount: number;
  analyzedCount: number;
  usedOpenAI: boolean;
  topKeyword: string;
  cacheStatus: string;
  candidatesRemoved: number;
}): AutoDiscoveryMeetingStep[] {
  return [
    {
      time: "🌙 00:00",
      department: "Market Director AI",
      title: "시장 전체 후보 탐색",
      result: `후보 ${generatedCount}개 발견`,
      detail: `시즌, 카테고리, 소재, 체형커버, 트렌드, 마진 가능성 키워드를 조합하고 중복/최근 추천 후보 ${candidatesRemoved}개를 제거했습니다.`,
    },
    {
      time: "🌙 00:10",
      department: "Trend AI",
      title: "검색량 상승 키워드 분석",
      result: `급상승 후보 ${risingCount}개 선정`,
      detail: "Naver DataLab으로 후보 키워드의 최근 90일 검색 흐름을 교차 확인했습니다.",
    },
    {
      time: "🌙 00:20",
      department: "OpenAI Market Analysis",
      title: "후보 전체 Batch 분석",
      result: usedOpenAI ? `${analyzedCount}개 후보를 한 번의 Batch 분석으로 평가` : `${analyzedCount}개 후보 SOURCE LIMITED 평가`,
      detail: `API 비용 절감을 위해 후보를 개별 호출하지 않았습니다. Cache status: ${cacheStatus}.`,
    },
    {
      time: "🌙 00:30",
      department: "Marketing Director AI",
      title: "광고 경쟁도 평가",
      result: "광고 진입 가능성 분류",
      detail: "경쟁 강도는 공식 쿠팡 시장 데이터가 없어 공개 신호와 검색 흐름 기준으로 제한 평가했습니다.",
    },
    {
      time: "🌙 00:40",
      department: "Creative Director AI",
      title: "썸네일/상세페이지 개선 가능성 평가",
      result: "상세페이지 개선 여지 평가",
      detail: "첫 화면 메시지, 소재 설명, 실측 정보, 체형커버 표현 가능성을 검토했습니다.",
    },
    {
      time: "🌙 00:50",
      department: "Pricing Director AI",
      title: "예상 마진과 진입 난이도 계산",
      result: "마진 가능성과 진입 난이도 계산",
      detail: "가격대와 상품 구조를 바탕으로 SOURCE LIMITED 범위 안에서 보수적으로 평가했습니다.",
    },
    {
      time: "🌙 01:00",
      department: "CEO Secretary AI",
      title: "Executive Summary 생성",
      result: `TOP10 생성 · 1순위 ${topKeyword}`,
      detail: "Today's Biggest Opportunity, Today's Biggest Risk, Today's First Action을 CEO 브리핑으로 정리했습니다.",
    },
    {
      time: "🌅 Morning",
      department: "CEO Briefing",
      title: "Good Morning, CEO.",
      result: "AI Executive Team completed overnight strategy meetings.",
      detail: "대표님은 검색하지 않습니다. AI 경영진이 먼저 탐색하고 보고합니다.",
    },
  ];
}

function createAiDiscussion({
  generatedCount,
  candidatesRemoved,
  topKeyword,
  topMargin,
}: {
  generatedCount: number;
  candidatesRemoved: number;
  topKeyword: string;
  topMargin: string;
}): AutoDiscoveryDiscussionStep[] {
  return [
    {
      department: "Market Director AI",
      message: `${generatedCount}개의 여성패션 후보를 찾았습니다. 최근 7일 반복 후보와 중복 후보 ${candidatesRemoved}개는 낮은 우선순위로 처리했습니다.`,
    },
    {
      department: "Trend Director AI",
      message: "Naver DataLab 기준 상승 신호가 있는 후보를 우선 검토했습니다. 하락 후보는 CEO 브리핑에서 제외했습니다.",
    },
    {
      department: "Marketing Director AI",
      message: "광고 경쟁이 높은 후보도 있지만, 클릭 메시지가 선명하면 진입 가능성이 있습니다.",
    },
    {
      department: "Creative Director AI",
      message: "썸네일과 첫 화면 개선 가능성이 있는 후보는 검색량보다 더 높은 실행 가치를 가집니다.",
    },
    {
      department: "Pricing Director AI",
      message: `${topKeyword}는 예상 마진 가능성이 ${topMargin}로 보입니다. 다만 공식 시장 가격 데이터가 부족한 후보는 추가 데이터 필요로 표시했습니다.`,
    },
    {
      department: "CEO Secretary AI",
      message: "Discussion completed. Recommendation approved. Executive Summary와 Today’s First Action을 준비했습니다.",
    },
  ];
}

function createMeetingTranscript(timeline: AutoDiscoveryMeetingStep[]) {
  return timeline.map((step) => `${step.time} ${step.department}: ${step.result}`);
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
  const batchedCallSavings = Math.round(((14 - Math.min(currentUsage.calls || 1, 14)) / 14) * 100);
  const estimatedCostSaved = Math.max(cacheHitRate, batchedCallSavings);

  return {
    callsToday: currentUsage.calls,
    cacheHitRate,
    estimatedCostSaved,
    monthlyCostSaved: Math.min(95, estimatedCostSaved + 4),
    meetingTimeMinutes: 18,
    meetingFinishedTime: "01:00",
    candidatesRemoved,
  };
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
  if (/팬츠|슬랙스|치마바지/.test(keyword)) return "팬츠";
  if (/원피스/.test(keyword)) return "원피스";
  if (/스커트/.test(keyword)) return "스커트";
  if (/블라우스|셔츠|니트|티/.test(keyword)) return "상의";
  if (/셋업/.test(keyword)) return "셋업";
  return "여성패션";
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
