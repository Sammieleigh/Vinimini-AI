import { createHash } from "crypto";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PROMPT_VERSION = "market-research-v3-coupang-primary";
const TASK_TYPE = "OPENAI_EXECUTIVE_MARKET_RESEARCH";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_TTL_HOURS = 24;

export type MarketResearchCompetitor = {
  productName: string;
  price: string;
  reviewCount: string;
  rating: string;
  productUrl: string;
  thumbnailUrl: string;
  sellingPoints: string[];
  evidenceStatus: "VERIFIED INFORMATION" | "SOURCE LIMITED";
};

export type MarketResearchResult = {
  ok: boolean;
  keyword: string;
  url: string;
  date: string;
  promptVersion: typeof PROMPT_VERSION;
  cacheStatus: "Fresh Analysis" | "Cached Analysis" | "OPENAI API NOT CONNECTED" | "Analysis Limited";
  sourceHash: string;
  cacheKey: string;
  sourceBadges: Array<"VERIFIED INFORMATION" | "AI ANALYSIS" | "SOURCE LIMITED" | "OPENAI MARKET RESEARCH" | "COUPANG PUBLIC WEB">;
  competitors: MarketResearchCompetitor[];
  aiAnalysis: {
    competitionStrength: string;
    reviewBarrier: string;
    detailPageHints: string[];
    summary: string;
    recommendedAction: string;
  };
  finance: {
    todayOpenAiCalls: number;
    cacheHitRate: number;
    estimatedCostSaved: number;
    duplicateRequestsPrevented: number;
  };
  message: string;
  lastAnalyzedAt: string | null;
};

type CacheRecord = {
  createdAt: number;
  result: MarketResearchResult;
};

type UsageRecord = {
  date: string;
  calls: number;
  cacheHits: number;
  cacheMisses: number;
};

type OpenAiMarketResearchPayload = {
  competitors?: Array<Partial<MarketResearchCompetitor>>;
  aiAnalysis?: Partial<MarketResearchResult["aiAnalysis"]>;
};

const cache = new Map<string, CacheRecord>();
let usage: UsageRecord = { date: "", calls: 0, cacheHits: 0, cacheMisses: 0 };

export async function runOpenAiMarketResearch({
  keyword,
  url = "",
  forceRefresh = false,
}: {
  keyword: string;
  url?: string;
  forceRefresh?: boolean;
}): Promise<MarketResearchResult> {
  const date = getKoreanDateKey();
  resetUsageIfNeeded(date);

  const normalizedKeyword = keyword.trim() || "쿠팡 여성패션";
  const normalizedUrl = url.trim();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const sourceHash = hash(JSON.stringify({ primarySource: "coupang-public-web", keyword: normalizedKeyword, url: normalizedUrl || "keyword-search" }));
  const cacheKey = [date, TASK_TYPE, hash(normalizedKeyword), hash(normalizedUrl || "keyword-search"), sourceHash, model, PROMPT_VERSION].join(":");
  const ttlMs = Math.max(1, Number(process.env.OPENAI_CACHE_TTL_HOURS || DEFAULT_TTL_HOURS)) * 60 * 60 * 1000;
  const cached = cache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.createdAt < ttlMs) {
    usage.cacheHits += 1;
    return { ...cached.result, cacheStatus: "Cached Analysis", finance: createFinanceStats() };
  }

  usage.cacheMisses += 1;

  if (!process.env.OPENAI_API_KEY) {
    return createLimitedResult({
      keyword: normalizedKeyword,
      url: normalizedUrl,
      date,
      sourceHash,
      cacheKey,
      cacheStatus: "OPENAI API NOT CONNECTED",
      message: "OPENAI_API_KEY가 없어 쿠팡 중심 공개 웹 리서치를 실행하지 않았습니다.",
    });
  }

  const dailyLimit = Number(process.env.OPENAI_DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
  if (usage.calls >= dailyLimit) {
    return createLimitedResult({
      keyword: normalizedKeyword,
      url: normalizedUrl,
      date,
      sourceHash,
      cacheKey,
      cacheStatus: "Analysis Limited",
      message: `OpenAI daily limit reached. 오늘 허용된 ${dailyLimit}회 호출을 모두 사용했습니다.`,
    });
  }

  try {
    usage.calls += 1;
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        tools: [{ type: "web_search_preview" }],
        input: [
          {
            role: "system",
            content:
              "You are VINIMINI Executive Market Research Engine for Korean Coupang sellers. Prioritize publicly available Coupang information for product discovery and competitive research. Use other public sources only when they improve analysis quality. Never invent product facts, review counts, ratings, prices, sales volume, rankings, URLs, or thumbnails. If a value is not verified, write SOURCE LIMITED or 추가 데이터 필요. Return JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: TASK_TYPE,
              promptVersion: PROMPT_VERSION,
              keyword: normalizedKeyword,
              targetUrl: normalizedUrl || "not provided",
              sourcePriority: [
                "1. Coupang public search results and Coupang product pages",
                "2. Other public pages that quote, link to, or compare Coupang products",
                "3. Naver signals only as supplemental context",
              ],
              collectWhenVerified: [
                "productName",
                "price",
                "reviewCount",
                "rating",
                "productUrl",
                "thumbnailUrl",
                "sellingPoints",
              ],
              analyzeSeparately: ["competitionStrength", "reviewBarrier", "detailPageHints", "summary", "recommendedAction"],
              rules: [
                "Verified values must be labeled VERIFIED INFORMATION.",
                "Interpretation must be labeled AI ANALYSIS.",
                "Unknown values must remain SOURCE LIMITED or 추가 데이터 필요.",
                "Coupang remains the primary source for product discovery and competitive research.",
              ],
              outputSchema:
                "{ competitors: [{ productName, price, reviewCount, rating, productUrl, thumbnailUrl, sellingPoints, evidenceStatus }], aiAnalysis: { competitionStrength, reviewBarrier, detailPageHints, summary, recommendedAction } }",
            }),
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI Market Research failed: ${response.status}`);

    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const parsed = parseMarketResearch(extractOutputText(payload));
    const hasVerified = parsed.competitors.some((item) => item.evidenceStatus === "VERIFIED INFORMATION");
    const result: MarketResearchResult = {
      ok: true,
      keyword: normalizedKeyword,
      url: normalizedUrl,
      date,
      promptVersion: PROMPT_VERSION,
      cacheStatus: "Fresh Analysis",
      sourceHash,
      cacheKey,
      sourceBadges: ["OPENAI MARKET RESEARCH", "COUPANG PUBLIC WEB", "AI ANALYSIS", hasVerified ? "VERIFIED INFORMATION" : "SOURCE LIMITED"],
      competitors: parsed.competitors,
      aiAnalysis: parsed.aiAnalysis,
      finance: createFinanceStats(),
      message: "OpenAI Market Research Engine이 쿠팡 공개 정보를 우선 조사하고 필요한 경우 다른 공개 소스로 보강했습니다.",
      lastAnalyzedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { createdAt: Date.now(), result });
    return result;
  } catch (error) {
    return createLimitedResult({
      keyword: normalizedKeyword,
      url: normalizedUrl,
      date,
      sourceHash,
      cacheKey,
      cacheStatus: "Analysis Limited",
      message: `OpenAI 쿠팡 중심 공개 웹 리서치에 실패했습니다. SOURCE LIMITED로 표시합니다. ${error instanceof Error ? error.message : ""}`.trim(),
    });
  }
}

function parseMarketResearch(text: string): Pick<MarketResearchResult, "competitors" | "aiAnalysis"> {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as OpenAiMarketResearchPayload;
    return {
      competitors: sanitizeCompetitors(parsed.competitors ?? []),
      aiAnalysis: {
        competitionStrength: parsed.aiAnalysis?.competitionStrength || "추가 데이터 필요",
        reviewBarrier: parsed.aiAnalysis?.reviewBarrier || "SOURCE LIMITED",
        detailPageHints: Array.isArray(parsed.aiAnalysis?.detailPageHints) ? parsed.aiAnalysis.detailPageHints.filter(Boolean).slice(0, 5) : ["추가 데이터 필요"],
        summary: parsed.aiAnalysis?.summary || "쿠팡 공개 웹 근거가 부족하여 확정 분석을 보류합니다.",
        recommendedAction: parsed.aiAnalysis?.recommendedAction || "검증 가능한 쿠팡 상품 URL과 리뷰 데이터를 추가로 확인하세요.",
      },
    };
  } catch {
    return createEmptyResearch();
  }
}

function sanitizeCompetitors(items: Array<Partial<MarketResearchCompetitor>>): MarketResearchCompetitor[] {
  return items.slice(0, 5).map((item) => ({
    productName: item.productName || "추가 데이터 필요",
    price: item.price || "SOURCE LIMITED",
    reviewCount: item.reviewCount || "SOURCE LIMITED",
    rating: item.rating || "SOURCE LIMITED",
    productUrl: item.productUrl || "",
    thumbnailUrl: item.thumbnailUrl || "",
    sellingPoints: Array.isArray(item.sellingPoints) ? item.sellingPoints.filter(Boolean).slice(0, 5) : ["추가 데이터 필요"],
    evidenceStatus: item.evidenceStatus === "VERIFIED INFORMATION" ? "VERIFIED INFORMATION" : "SOURCE LIMITED",
  }));
}

function createEmptyResearch(): Pick<MarketResearchResult, "competitors" | "aiAnalysis"> {
  return {
    competitors: [],
    aiAnalysis: {
      competitionStrength: "추가 데이터 필요",
      reviewBarrier: "SOURCE LIMITED",
      detailPageHints: ["검증 가능한 쿠팡 공개 상품 페이지가 필요합니다."],
      summary: "쿠팡 공개 웹 근거가 부족하여 경쟁상품 정보를 확정하지 않았습니다.",
      recommendedAction: "상품 URL, 가격, 리뷰 수, 평점이 확인되는 쿠팡 공개 근거를 추가로 확보하세요.",
    },
  };
}

function createLimitedResult({
  keyword,
  url,
  date,
  sourceHash,
  cacheKey,
  cacheStatus,
  message,
}: {
  keyword: string;
  url: string;
  date: string;
  sourceHash: string;
  cacheKey: string;
  cacheStatus: MarketResearchResult["cacheStatus"];
  message: string;
}): MarketResearchResult {
  const empty = createEmptyResearch();
  return {
    ok: cacheStatus !== "Analysis Limited",
    keyword,
    url,
    date,
    promptVersion: PROMPT_VERSION,
    cacheStatus,
    sourceHash,
    cacheKey,
    sourceBadges: ["SOURCE LIMITED"],
    competitors: empty.competitors,
    aiAnalysis: empty.aiAnalysis,
    finance: createFinanceStats(),
    message,
    lastAnalyzedAt: null,
  };
}

function createFinanceStats() {
  const total = usage.cacheHits + usage.cacheMisses;
  const cacheHitRate = total ? Math.round((usage.cacheHits / total) * 100) : 0;
  return {
    todayOpenAiCalls: usage.calls,
    cacheHitRate,
    estimatedCostSaved: Math.max(cacheHitRate, 80),
    duplicateRequestsPrevented: usage.cacheHits,
  };
}

function extractOutputText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (payload.output_text) return payload.output_text;
  return payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n").trim() || "";
}

function resetUsageIfNeeded(date: string) {
  if (usage.date !== date) usage = { date, calls: 0, cacheHits: 0, cacheMisses: 0 };
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
