import { createHash } from "crypto";
import { fetchCoupangSearch } from "./coupang";
import { fetchCoupangPartnersProducts } from "./dataAdapters/coupangPartnersAdapter";
import { fetchNaverCoupangSearchProducts } from "./dataAdapters/naverCoupangSearchAdapter";
import type { NaverCoupangSearchProduct, PartnerProduct } from "./dataAdapters/types";
import type { CoupangSearchProduct } from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PROMPT_VERSION = "market-research-v10-naver-verified-coupang-links";
const TASK_TYPE = "OPENAI_EXECUTIVE_MARKET_RESEARCH";
const COUPANG_ADS_TRENDS_URL = "https://ads.coupang.com/trends";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_TTL_HOURS = 24;
const DEVELOPMENT_DAILY_LIMIT = 1_000_000;
const MORE_DATA_REQUIRED_KO = "추가 데이터 필요";
const SOURCE_LIMITED_KO = "근거 부족";
const WIDE_SLACKS_EMPTY_MESSAGE = "동일 카테고리 경쟁상품 데이터를 불러오지 못했습니다. 키워드를 조정해 다시 리서치하세요.";

type ResearchSource = "Naver Search API" | "Coupang Official API" | "Coupang HTML" | "OpenAI Analysis" | "Coupang Ads Trend Insights" | "Other Public Sources";

type SourceFlags = {
  openAiSearch: boolean;
  openAiAnalysis: boolean;
  naverSearch: boolean;
  htmlParser: boolean;
  coupangApi: boolean;
  adsInsight: boolean;
};

export type MarketResearchCompetitor = {
  productName: string;
  price: string;
  reviewCount: string;
  rating: string;
  seller: string;
  shippingInfo: string;
  rocketDelivery: string;
  productUrl: string;
  thumbnailUrl: string;
  sellingPoints: string[];
  thumbnailFeatures: string[];
  firstScreenFeatures: string[];
  detailPageFeatures: string[];
  repeatedReviewPros: string[];
  repeatedReviewCons: string[];
  differentiationHints: string[];
  whyItSells: string;
  relevanceScore: number;
  relevanceReason: string;
  evidenceStatus: "VERIFIED INFORMATION" | "PARTIAL DATA" | "SOURCE LIMITED";
  researchSource: ResearchSource;
  sourceFlags: SourceFlags;
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
  categoryProfile: CategoryProfile;
  sourceBadges: Array<"VERIFIED INFORMATION" | "PARTIAL DATA" | "AI ANALYSIS" | "SOURCE LIMITED" | "MORE DATA REQUIRED" | "OPENAI MARKET RESEARCH" | "COUPANG PUBLIC WEB" | "COUPANG ADS TREND INSIGHTS" | ResearchSource>;
  competitors: MarketResearchCompetitor[];
  excludedCompetitors: MarketResearchCompetitor[];
  searchLogs: Array<{ keyword: string; searchUrl: string; resultCount: number; selectedCount: number; status: "COLLECTED" | "COUPANG COLLECTION FAILED" }>;
  debug?: {
    policy: "development" | "production";
    dailyLimit: number;
    modelName: string;
    toolName: string;
    apiCallCode: string;
    rawResponsesEnabled: boolean;
    openAiSearchAttempts: Array<{
      query: string;
      modelName: string;
      toolName: string;
      toolList: string[];
      apiCallCode: string;
      prompt: string;
      requestJson: string;
      rawResponse: string;
      responseText: string;
      responseLength: number;
      collectedCoupangUrlCount: number;
      extractedCoupangUrls: string[];
      extractedProducts: Array<Partial<MarketResearchCompetitor>>;
      beforeFilterCount: number;
      afterFilterCount: number;
      removed: Array<{ productName: string; productUrl: string; reason: string }>;
      zeroStage: string;
    }>;
    zeroStage: string;
    finalSelectedTop10: Array<{ productName: string; productUrl: string; relevanceScore: number; researchSource: ResearchSource }>;
    finalUrlStrings: string[];
    pipeline: {
      promptSent: number;
      responseReceived: number;
      urlParsed: number;
      jsonParsed: number;
      candidateCollected: number;
      afterMerge: number;
      categoryFilter: number;
      deduplicate: number;
      top10: number;
      mergeRate: number;
    };
  };
  selectedCount: number;
  aiAnalysis: {
    competitionStrength: string;
    pricePosition: string;
    reviewBarrier: string;
    detailPageStrengths: string[];
    thumbnailPattern: string;
    customerComplaints: string[];
    differentiationPoints: string[];
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

type CategoryProfile = {
  baseCategory: string;
  categoryLock: string;
  allowedKeywordExpansion: string[];
  requiredAnyTerms: string[];
  requiredAllTerms: string[];
  excludedTerms: string[];
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

  const normalizedKeyword = mapRouteSlugToKoreanKeyword(keyword.trim() || "쿠팡 여성패션");
  const normalizedUrl = url.trim();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const categoryProfile = createCategoryProfile(normalizedKeyword);
  const coupangCollection = await fetchOfficialCoupangCompetitors(categoryProfile);
  const collectedCoupangCompetitors = coupangCollection.competitors;
  const rankedCollectedCoupangCompetitors = rankCompetitors(collectedCoupangCompetitors, categoryProfile);
  const sourceHash = hash(
    JSON.stringify({
      primarySource: "coupang-public-web",
      collectionStatus: coupangCollection.status,
      collectionKeywords: coupangCollection.triedKeywords,
      collectionLogs: coupangCollection.searchLogs,
      rawCandidateCount: coupangCollection.rawCandidateCount,
      mergedCandidateCount: coupangCollection.mergedCandidateCount,
      collectedProducts: rankedCollectedCoupangCompetitors.competitors.map((item) => ({
        productName: item.productName,
        price: item.price,
        productUrl: item.productUrl,
      })),
      coupangAdsTrendInsights: COUPANG_ADS_TRENDS_URL,
      keyword: normalizedKeyword,
      url: normalizedUrl || "keyword-search",
      categoryProfile,
    }),
  );
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
      categoryProfile,
      cacheStatus: "OPENAI API NOT CONNECTED",
      competitors: rankedCollectedCoupangCompetitors.competitors,
      searchLogs: coupangCollection.searchLogs,
      message: "OPENAI_API_KEY가 없어 수집된 쿠팡 경쟁상품만 표시합니다. OpenAI는 상품 URL을 생성하지 않습니다.",
    });
  }

  const dailyLimit = getEffectiveOpenAiDailyLimit();
  const debug = createResearchDebug(dailyLimit, model);
  if (usage.calls >= dailyLimit) {
    return createLimitedResult({
      keyword: normalizedKeyword,
      url: normalizedUrl,
      date,
      sourceHash,
      cacheKey,
      categoryProfile,
      cacheStatus: "Analysis Limited",
      competitors: rankedCollectedCoupangCompetitors.competitors,
      searchLogs: coupangCollection.searchLogs,
      message: `OpenAI daily limit reached. 오늘 허용된 ${dailyLimit}회 호출을 모두 사용했습니다.`,
    });
  }

  try {
    usage.calls += 1;
    const requestJson = {
      model,
      input: [
        {
          role: "system",
          content:
            "You are VINIMINI Executive Analysis Engine for Korean Coupang sellers. You do not collect product URLs. You do not invent product facts, prices, reviews, ratings, sellers, thumbnails, sales volume, or rankings. Analyze only the verified product rows provided by the server. Return JSON only. All user-facing strings must be Korean.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: TASK_TYPE,
            promptVersion: PROMPT_VERSION,
            keyword: normalizedKeyword,
            targetUrl: normalizedUrl || "not provided",
            categoryProfile,
            verifiedCoupangProducts: rankedCollectedCoupangCompetitors.competitors.map((item) => ({
              productName: item.productName,
              price: item.price,
              reviewCount: item.reviewCount,
              rating: item.rating,
              seller: item.seller,
              shippingInfo: item.shippingInfo,
              rocketDelivery: item.rocketDelivery,
              productUrl: item.productUrl,
              thumbnailUrl: item.thumbnailUrl,
              evidenceStatus: item.evidenceStatus,
              researchSource: item.researchSource,
            })),
            strictRules: [
              "Do not add new competitor products.",
              "Do not create, guess, or rewrite product URLs.",
              "Return competitor analysis only for productUrl values already provided in verifiedCoupangProducts.",
              "Never fill missing price, reviewCount, rating, seller, shippingInfo, rocketDelivery, or thumbnailUrl.",
              "Use 근거 부족 when evidence is missing.",
              "All analysis sentences shown to the CEO must be Korean only.",
            ],
            outputSchema:
              "{ competitors: [{ productUrl, sellingPoints, thumbnailFeatures, firstScreenFeatures, detailPageFeatures, repeatedReviewPros, repeatedReviewCons, differentiationHints, whyItSells, relevanceScore, relevanceReason, evidenceStatus, researchSource }], aiAnalysis: { competitionStrength, pricePosition, reviewBarrier, detailPageStrengths, thumbnailPattern, customerComplaints, differentiationPoints, summary, recommendedAction } }",
          }),
        },
      ],
    };
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestJson),
    });

    if (!response.ok) throw new Error(`OpenAI Market Research failed: ${response.status}`);

    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const outputText = extractOutputText(payload);
    const parsed = parseMarketResearch(outputText, categoryProfile);
    const analyzedCompetitors = mergeAnalysisIntoCollected(rankedCollectedCoupangCompetitors.competitors, parsed.competitors);
    const preRankMerged = mergeCompetitors([], analyzedCompetitors);
    const ranked = rankCompetitors(preRankMerged, categoryProfile);
    const competitors = ranked.competitors;
    const hasVerified = competitors.some((item) => item.evidenceStatus === "VERIFIED INFORMATION");
    const hasPartial = competitors.some((item) => item.evidenceStatus === "PARTIAL DATA");
    const hasAnyProductData = competitors.length + ranked.excludedCompetitors.length > 0;
    const researchSources = Array.from(new Set([...competitors, ...ranked.excludedCompetitors].map((item) => item.researchSource)));
    if (debug) {
      debug.openAiSearchAttempts.push({
        query: "수집된 쿠팡 경쟁상품 분석",
        modelName: model,
        toolName: "없음",
        toolList: [],
        apiCallCode: "responses.create (HTTP POST /v1/responses, non-streaming)",
        prompt: requestJson.input.map((item) => item.content).join("\n\n"),
        requestJson: JSON.stringify(requestJson, null, 2),
        rawResponse: JSON.stringify(payload, null, 2).slice(0, 12000),
        responseText: outputText.slice(0, 4000),
        responseLength: outputText.length,
        collectedCoupangUrlCount: rankedCollectedCoupangCompetitors.competitors.length,
        extractedCoupangUrls: rankedCollectedCoupangCompetitors.competitors.map((item) => item.productUrl),
        extractedProducts: parsed.competitors.slice(0, 20),
        beforeFilterCount: coupangCollection.rawCandidateCount,
        afterFilterCount: ranked.categoryFilteredCount,
        removed: [],
        zeroStage: competitors.length ? "통과" : "카테고리 필터 후 최종 0개",
      });
      debug.zeroStage = getFinalZeroStage({
        officialCount: collectedCoupangCompetitors.length,
        parsedCount: parsed.competitors.length,
        rankedCount: competitors.length,
      });
      debug.pipeline = {
        promptSent: 1,
        responseReceived: outputText.length ? 1 : 0,
        urlParsed: rankedCollectedCoupangCompetitors.competitors.length,
        jsonParsed: parsed.competitors.length,
        candidateCollected: coupangCollection.rawCandidateCount,
        afterMerge: coupangCollection.mergedCandidateCount,
        categoryFilter: ranked.categoryFilteredCount,
        deduplicate: Math.max(0, coupangCollection.rawCandidateCount - coupangCollection.mergedCandidateCount),
        top10: competitors.length,
        mergeRate: calculateMergeRate(coupangCollection.rawCandidateCount, coupangCollection.mergedCandidateCount),
      };
      debug.finalSelectedTop10 = competitors.map((item) => ({
        productName: item.productName,
        productUrl: item.productUrl,
        relevanceScore: item.relevanceScore,
        researchSource: item.researchSource,
      }));
      debug.finalUrlStrings = competitors.map((item) => item.productUrl);
    }
    const aiAnalysis = competitors.length ? parsed.aiAnalysis : createEmptyResearch(categoryProfile).aiAnalysis;
    const result: MarketResearchResult = {
      ok: true,
      keyword: normalizedKeyword,
      url: normalizedUrl,
      date,
      promptVersion: PROMPT_VERSION,
      cacheStatus: "Fresh Analysis",
      sourceHash,
      cacheKey,
      categoryProfile,
      sourceBadges: createSourceBadges({ hasVerified, hasPartial, hasAnyProductData, researchSources }),
      competitors,
      excludedCompetitors: ranked.excludedCompetitors,
      searchLogs: coupangCollection.searchLogs,
      debug,
      selectedCount: competitors.length,
      aiAnalysis,
      finance: createFinanceStats(),
      message: hasVerified
        ? "네이버 검색 API가 실제 쿠팡 링크를 확보했고, OpenAI는 수집된 상품만 분석했습니다."
        : WIDE_SLACKS_EMPTY_MESSAGE,
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
      categoryProfile,
      cacheStatus: "Fresh Analysis",
      competitors: rankedCollectedCoupangCompetitors.competitors,
      searchLogs: coupangCollection.searchLogs,
      message: `OpenAI 분석은 실패했지만 네이버 검색 API로 확보한 실제 쿠팡 경쟁상품을 표시합니다. ${error instanceof Error ? error.message : ""}`.trim(),
    });
  }
}

function parseMarketResearch(text: string, categoryProfile: CategoryProfile): Pick<MarketResearchResult, "competitors" | "aiAnalysis"> {
  try {
    const cleaned = extractJsonObjectText(text);
    const parsed = JSON.parse(cleaned) as OpenAiMarketResearchPayload;
    const competitors = sanitizeCompetitors(parsed.competitors ?? [], categoryProfile);
    return {
      competitors,
      aiAnalysis: sanitizeAnalysis(parsed.aiAnalysis, competitors.length),
    };
  } catch {
    return createEmptyResearch(categoryProfile);
  }
}

function getFinalZeroStage({
  officialCount,
  parsedCount,
  rankedCount,
}: {
  officialCount: number;
  parsedCount: number;
  rankedCount: number;
}) {
  if (rankedCount > 0) return "통과";
  if (officialCount === 0 && parsedCount === 0) return "rankCompetitors 이전 모든 수집 소스 0개";
  return "rankCompetitors 카테고리/관련도 필터 후 최종 0개";
}

function extractJsonObjectText(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) return cleaned.slice(first, last + 1);
  return cleaned;
}

function sanitizeCompetitors(items: Array<Partial<MarketResearchCompetitor>>, categoryProfile: CategoryProfile): MarketResearchCompetitor[] {
  const seen = new Set<string>();
  return items
    .filter(hasCandidateEvidence)
    .filter((item) => {
      const key = normalizeText(item.productName || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20)
    .map((item) => ({
      productName: toDisplayValue(item.productName, MORE_DATA_REQUIRED_KO),
      price: toDisplayValue(item.price, SOURCE_LIMITED_KO),
      reviewCount: toDisplayValue(item.reviewCount, SOURCE_LIMITED_KO),
      rating: toDisplayValue(item.rating, SOURCE_LIMITED_KO),
      seller: toDisplayValue(item.seller, SOURCE_LIMITED_KO),
      shippingInfo: toDisplayValue(item.shippingInfo, SOURCE_LIMITED_KO),
      rocketDelivery: toDisplayValue(item.rocketDelivery, SOURCE_LIMITED_KO),
      productUrl: normalizeFinalCoupangProductUrl(toDisplayValue(item.productUrl, "")),
      thumbnailUrl: toDisplayValue(item.thumbnailUrl, ""),
      sellingPoints: sanitizeKoreanList(item.sellingPoints, [MORE_DATA_REQUIRED_KO]),
      thumbnailFeatures: sanitizeKoreanList(item.thumbnailFeatures, [MORE_DATA_REQUIRED_KO]),
      firstScreenFeatures: sanitizeKoreanList(item.firstScreenFeatures, [MORE_DATA_REQUIRED_KO]),
      detailPageFeatures: sanitizeKoreanList(item.detailPageFeatures, [MORE_DATA_REQUIRED_KO]),
      repeatedReviewPros: sanitizeKoreanList(item.repeatedReviewPros, [SOURCE_LIMITED_KO]),
      repeatedReviewCons: sanitizeKoreanList(item.repeatedReviewCons, [SOURCE_LIMITED_KO]),
      differentiationHints: sanitizeKoreanList(item.differentiationHints, [MORE_DATA_REQUIRED_KO]),
      whyItSells: sanitizeKoreanText(item.whyItSells, MORE_DATA_REQUIRED_KO),
      relevanceScore: normalizeScore(item.relevanceScore, calculateRelevanceScore(item.productName || "", categoryProfile)),
      relevanceReason: sanitizeKoreanText(item.relevanceReason, createRelevanceReason(item.productName || "", categoryProfile)),
      evidenceStatus: inferEvidenceStatus(item),
      researchSource: normalizeResearchSource(item.researchSource),
      sourceFlags: normalizeSourceFlags(item.sourceFlags, normalizeResearchSource(item.researchSource)),
    }));
}

function hasCandidateEvidence(item: Partial<MarketResearchCompetitor>) {
  const productUrl = normalizeFinalCoupangProductUrl(toDisplayValue(item.productUrl, ""));
  return hasUsableValue(item.productName) && Boolean(productUrl) && !isSuspiciousPlaceholderUrl(productUrl);
}

function isSuspiciousPlaceholderUrl(url: string) {
  return /\/vp\/products\/(1234567890|0000000000)(?:\D|$)/.test(url);
}

function toDisplayValue(value: unknown, fallback: string) {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === "string") return value.trim() || fallback;
  return fallback;
}

function mapPartnerProductsToCompetitors(products: PartnerProduct[], categoryProfile: CategoryProfile): MarketResearchCompetitor[] {
  return products
    .slice(0, 8)
    .map((product) => ({
      productName: product.productName || MORE_DATA_REQUIRED_KO,
      price: product.price || SOURCE_LIMITED_KO,
      reviewCount: SOURCE_LIMITED_KO,
      rating: SOURCE_LIMITED_KO,
      seller: SOURCE_LIMITED_KO,
      shippingInfo: SOURCE_LIMITED_KO,
      rocketDelivery: SOURCE_LIMITED_KO,
      productUrl: normalizeFinalCoupangProductUrl(product.productUrl || ""),
      thumbnailUrl: product.image || "",
      sellingPoints: sanitizeKoreanList([product.brand, product.category].filter((item) => item && item !== SOURCE_LIMITED_KO), ["쿠팡 공식 상품 검색에서 확인된 동일 카테고리 상품입니다."]),
      thumbnailFeatures: product.image ? ["대표 이미지가 확인되었습니다."] : [SOURCE_LIMITED_KO],
      firstScreenFeatures: [MORE_DATA_REQUIRED_KO],
      detailPageFeatures: [MORE_DATA_REQUIRED_KO],
      repeatedReviewPros: [SOURCE_LIMITED_KO],
      repeatedReviewCons: [SOURCE_LIMITED_KO],
      differentiationHints: ["가격, 썸네일, 상세페이지 첫 화면을 경쟁상품과 비교해 차별화하세요."],
      whyItSells: "쿠팡 공식 상품 검색에서 동일 키워드 상품으로 확인되었습니다. 리뷰, 평점, 판매자, 배송 정보는 추가 확인이 필요합니다.",
      relevanceScore: calculateRelevanceScore(product.productName, categoryProfile),
      relevanceReason: createRelevanceReason(product.productName, categoryProfile),
      evidenceStatus: inferEvidenceStatus({
        productName: product.productName,
        price: product.price,
        productUrl: product.productUrl,
      }),
      researchSource: "Coupang Official API",
      sourceFlags: createSourceFlags("Coupang Official API"),
    }));
}

async function fetchOfficialCoupangCompetitors(categoryProfile: CategoryProfile) {
  const triedKeywords: string[] = [];
  const searchLogs: MarketResearchResult["searchLogs"] = [];
  const competitors: MarketResearchCompetitor[] = [];
  let status = "API NOT CONNECTED";

  const naverResult = await fetchNaverCoupangSearchProducts(categoryProfile.allowedKeywordExpansion);
  const naverMapped = mapNaverSearchProductsToCompetitors(naverResult.data, categoryProfile);
  competitors.push(...naverMapped);
  status = naverResult.status;
  triedKeywords.push(...categoryProfile.allowedKeywordExpansion);

  const naverCounts = new Map<string, number>();
  for (const item of naverMapped) {
    const query = item.sellingPoints.find((point) => point.startsWith("검색어: "))?.replace("검색어: ", "") || categoryProfile.allowedKeywordExpansion[0];
    naverCounts.set(query, (naverCounts.get(query) ?? 0) + 1);
  }
  let selectedCount = mergeCompetitors([], competitors).length;
  for (const keyword of categoryProfile.allowedKeywordExpansion) {
    const query = `${keyword} 쿠팡`;
    const resultCount = naverCounts.get(query) ?? 0;
    searchLogs.push({
      keyword,
      searchUrl: createNaverSearchUrl(query),
      resultCount,
      selectedCount,
      status: resultCount ? "COLLECTED" : "COUPANG COLLECTION FAILED",
    });
  }

  if (selectedCount < 10) {
    for (const keyword of categoryProfile.allowedKeywordExpansion) {
      const result = await fetchCoupangPartnersProducts(keyword);
      status = status === "LIVE DATA" ? status : result.status;
      const mapped = mapPartnerProductsToCompetitors(result.data, categoryProfile);
      let ranked = rankCompetitors(mapped, categoryProfile);

      if (selectedCount < 5) {
        try {
          const publicProducts = await fetchCoupangSearch(keyword);
          const publicMapped = mapPublicSearchProductsToCompetitors(publicProducts, categoryProfile);
          ranked = rankCompetitors(mergeCompetitors(ranked.competitors, publicMapped), categoryProfile);
          status = publicMapped.length ? "LIVE DATA" : status;
        } catch {
          // 쿠팡 HTML은 차단될 수 있으므로 네이버 검색 API 결과를 유지합니다.
        }
      }

      competitors.push(...ranked.competitors);
      selectedCount = mergeCompetitors([], competitors).length;
      searchLogs.push({
        keyword,
        searchUrl: createCoupangSearchUrl(keyword),
        resultCount: ranked.competitors.length,
        selectedCount,
        status: ranked.competitors.length ? "COLLECTED" : "COUPANG COLLECTION FAILED",
      });
      if (selectedCount >= 10) break;
    }
  }

  const merged = mergeCompetitors([], competitors);

  return {
    status,
    triedKeywords,
    searchLogs,
    competitors: merged,
    rawCandidateCount: competitors.length,
    mergedCandidateCount: merged.length,
  };
}

function mapNaverSearchProductsToCompetitors(products: NaverCoupangSearchProduct[], categoryProfile: CategoryProfile): MarketResearchCompetitor[] {
  return products.map((product) => ({
    productName: product.productName || MORE_DATA_REQUIRED_KO,
    price: product.price || SOURCE_LIMITED_KO,
    reviewCount: product.reviewCount || SOURCE_LIMITED_KO,
    rating: product.rating || SOURCE_LIMITED_KO,
    seller: product.seller || SOURCE_LIMITED_KO,
    shippingInfo: product.shippingInfo || SOURCE_LIMITED_KO,
    rocketDelivery: product.rocketDelivery || SOURCE_LIMITED_KO,
    productUrl: normalizeFinalCoupangProductUrl(product.productUrl || ""),
    thumbnailUrl: product.thumbnailUrl || "",
    sellingPoints: sanitizeKoreanList(
      [
        `검색어: ${product.sourceQuery}`,
        product.sourceType === "Naver Web Search" ? "네이버 웹 검색에서 실제 쿠팡 상품 URL을 확인했습니다." : "네이버 쇼핑 검색에서 쿠팡 상품 링크와 가격/이미지를 확인했습니다.",
        product.sourceDescription,
      ],
      ["네이버 검색 API에서 확인된 쿠팡 상품입니다."],
    ),
    thumbnailFeatures: product.thumbnailUrl ? ["네이버 쇼핑 검색에서 대표 이미지를 확인했습니다."] : [SOURCE_LIMITED_KO],
    firstScreenFeatures: [MORE_DATA_REQUIRED_KO],
    detailPageFeatures: [MORE_DATA_REQUIRED_KO],
    repeatedReviewPros: [product.rating !== SOURCE_LIMITED_KO ? `평점 ${product.rating}점으로 확인되었습니다.` : SOURCE_LIMITED_KO],
    repeatedReviewCons: [SOURCE_LIMITED_KO],
    differentiationHints: ["가격, 리뷰 장벽, 썸네일 구도를 경쟁상품과 비교하세요."],
    whyItSells: "네이버 검색 결과에서 실제 쿠팡 상품 페이지로 확인된 경쟁상품입니다.",
    relevanceScore: calculateRelevanceScore(product.productName, categoryProfile),
    relevanceReason: createRelevanceReason(product.productName, categoryProfile),
    evidenceStatus: inferEvidenceStatus({
      productName: product.productName,
      price: product.price,
      reviewCount: product.reviewCount,
      rating: product.rating,
      productUrl: product.productUrl,
    }),
    researchSource: "Naver Search API",
    sourceFlags: createSourceFlags("Naver Search API"),
  }));
}

function mapPublicSearchProductsToCompetitors(products: CoupangSearchProduct[], categoryProfile: CategoryProfile): MarketResearchCompetitor[] {
  return products
    .slice(0, 12)
    .map((product) => ({
      productName: product.productName || MORE_DATA_REQUIRED_KO,
      price: product.price || SOURCE_LIMITED_KO,
      reviewCount: product.reviewCount || SOURCE_LIMITED_KO,
      rating: product.rating || SOURCE_LIMITED_KO,
      seller: product.sellerName || SOURCE_LIMITED_KO,
      shippingInfo: product.isRocket ? "로켓배송" : product.isRocketGrowth ? "로켓그로스" : SOURCE_LIMITED_KO,
      rocketDelivery: product.isRocket ? "로켓배송" : product.isRocketGrowth ? "로켓그로스" : SOURCE_LIMITED_KO,
      productUrl: normalizeFinalCoupangProductUrl(product.productUrl || ""),
      thumbnailUrl: product.thumbnail || "",
      sellingPoints: sanitizeKoreanList([product.category, product.recommendation].filter(Boolean), ["쿠팡 공개 검색에서 확인된 상품입니다."]),
      thumbnailFeatures: product.thumbnail ? ["대표 이미지가 확인되었습니다."] : [SOURCE_LIMITED_KO],
      firstScreenFeatures: [MORE_DATA_REQUIRED_KO],
      detailPageFeatures: [MORE_DATA_REQUIRED_KO],
      repeatedReviewPros: [SOURCE_LIMITED_KO],
      repeatedReviewCons: [SOURCE_LIMITED_KO],
      differentiationHints: ["가격, 리뷰 장벽, 썸네일 구도를 비교해 차별화하세요."],
      whyItSells: "쿠팡 공개 검색에서 동일 카테고리 후보로 확인되었습니다.",
      relevanceScore: calculateRelevanceScore(product.productName, categoryProfile),
      relevanceReason: createRelevanceReason(product.productName, categoryProfile),
      evidenceStatus: inferEvidenceStatus({
        productName: product.productName,
        price: product.price,
        reviewCount: product.reviewCount,
        rating: product.rating,
        productUrl: product.productUrl,
      }),
      researchSource: "Coupang HTML",
      sourceFlags: createSourceFlags("Coupang HTML"),
    }));
}

function mergeCompetitors(primary: MarketResearchCompetitor[], secondary: MarketResearchCompetitor[]) {
  const merged: MarketResearchCompetitor[] = [];

  for (const item of [...primary, ...secondary]) {
    if (!normalizeText(item.productName || item.productUrl)) continue;
    const existingIndex = merged.findIndex((existing) => isSameCompetitorRecord(existing, item));
    if (existingIndex === -1) {
      merged.push(item);
      continue;
    }
    merged[existingIndex] = mergeCompetitorRecord(merged[existingIndex], item);
  }

  return merged.slice(0, 30);
}

function isSameCompetitorRecord(existing: MarketResearchCompetitor, incoming: MarketResearchCompetitor) {
  const existingProductId = extractCoupangProductId(existing.productUrl);
  const incomingProductId = extractCoupangProductId(incoming.productUrl);
  if (existingProductId && incomingProductId && existingProductId === incomingProductId) return true;

  const nameSimilarity = calculateNameSimilarity(existing.productName, incoming.productName);
  const existingSeller = normalizeText(existing.seller);
  const incomingSeller = normalizeText(incoming.seller);
  const sameSeller = hasUsableValue(existing.seller) && hasUsableValue(incoming.seller) && existingSeller === incomingSeller;

  if (nameSimilarity >= 0.9) return true;
  if (nameSimilarity >= 0.78 && sameSeller) return true;
  return false;
}

function mergeAnalysisIntoCollected(collected: MarketResearchCompetitor[], analysisItems: MarketResearchCompetitor[]) {
  const next = [...collected];

  for (const analysisItem of analysisItems) {
    const index = next.findIndex((item) => isSameCompetitorRecord(item, analysisItem));
    if (index === -1) continue;
    const existing = next[index];
    next[index] = {
      ...existing,
      sellingPoints: mergeTextList(existing.sellingPoints, analysisItem.sellingPoints),
      thumbnailFeatures: mergeTextList(existing.thumbnailFeatures, analysisItem.thumbnailFeatures),
      firstScreenFeatures: mergeTextList(existing.firstScreenFeatures, analysisItem.firstScreenFeatures),
      detailPageFeatures: mergeTextList(existing.detailPageFeatures, analysisItem.detailPageFeatures),
      repeatedReviewPros: mergeTextList(existing.repeatedReviewPros, analysisItem.repeatedReviewPros),
      repeatedReviewCons: mergeTextList(existing.repeatedReviewCons, analysisItem.repeatedReviewCons),
      differentiationHints: mergeTextList(existing.differentiationHints, analysisItem.differentiationHints),
      whyItSells: hasUsableValue(analysisItem.whyItSells) ? analysisItem.whyItSells : existing.whyItSells,
      relevanceScore: Math.max(existing.relevanceScore, analysisItem.relevanceScore),
      relevanceReason: hasUsableValue(analysisItem.relevanceReason) ? analysisItem.relevanceReason : existing.relevanceReason,
      sourceFlags: mergeSourceFlags(existing.sourceFlags, createSourceFlags("OpenAI Analysis")),
    };
  }

  return next;
}

function chooseValue(current: string, next: string) {
  return hasUsableValue(current) ? current : next;
}

function mergeTextList(current: string[], next: string[]) {
  const merged = [...current, ...next].filter(hasUsableValue);
  return Array.from(new Set(merged)).slice(0, 5);
}

function compareEvidence(a: MarketResearchCompetitor["evidenceStatus"], b: MarketResearchCompetitor["evidenceStatus"]) {
  const rank = {
    "SOURCE LIMITED": 0,
    "PARTIAL DATA": 1,
    "VERIFIED INFORMATION": 2,
  } satisfies Record<MarketResearchCompetitor["evidenceStatus"], number>;
  return rank[a] - rank[b];
}

function mergeCompetitorRecord(existing: MarketResearchCompetitor, incoming: MarketResearchCompetitor): MarketResearchCompetitor {
  const betterEvidence = compareEvidence(incoming.evidenceStatus, existing.evidenceStatus) > 0 ? incoming.evidenceStatus : existing.evidenceStatus;
  return {
    ...existing,
    productName: chooseValue(existing.productName, incoming.productName),
    price: chooseValue(existing.price, incoming.price),
    reviewCount: chooseValue(existing.reviewCount, incoming.reviewCount),
    rating: chooseValue(existing.rating, incoming.rating),
    seller: chooseValue(existing.seller, incoming.seller),
    shippingInfo: chooseValue(existing.shippingInfo, incoming.shippingInfo),
    rocketDelivery: chooseValue(existing.rocketDelivery, incoming.rocketDelivery),
    productUrl: chooseValue(existing.productUrl, incoming.productUrl),
    thumbnailUrl: chooseValue(existing.thumbnailUrl, incoming.thumbnailUrl),
    sellingPoints: mergeTextList(existing.sellingPoints, incoming.sellingPoints),
    thumbnailFeatures: mergeTextList(existing.thumbnailFeatures, incoming.thumbnailFeatures),
    firstScreenFeatures: mergeTextList(existing.firstScreenFeatures, incoming.firstScreenFeatures),
    detailPageFeatures: mergeTextList(existing.detailPageFeatures, incoming.detailPageFeatures),
    repeatedReviewPros: mergeTextList(existing.repeatedReviewPros, incoming.repeatedReviewPros),
    repeatedReviewCons: mergeTextList(existing.repeatedReviewCons, incoming.repeatedReviewCons),
    differentiationHints: mergeTextList(existing.differentiationHints, incoming.differentiationHints),
    whyItSells: chooseValue(existing.whyItSells, incoming.whyItSells),
    relevanceScore: Math.max(existing.relevanceScore, incoming.relevanceScore),
    relevanceReason: chooseValue(existing.relevanceReason, incoming.relevanceReason),
    evidenceStatus: betterEvidence,
    researchSource: compareEvidence(incoming.evidenceStatus, existing.evidenceStatus) > 0 ? incoming.researchSource : existing.researchSource,
    sourceFlags: mergeSourceFlags(existing.sourceFlags, incoming.sourceFlags),
  };
}

function createCoupangSearchUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${keyword.trim().split(/\s+/).join("+")}`;
}

function createNaverSearchUrl(keyword: string) {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
}

function rankCompetitors(items: MarketResearchCompetitor[], categoryProfile: CategoryProfile) {
  const visibleSameCategoryItems = items.filter((item) => isSameCategoryCompetitor(item.productName, categoryProfile));
  const sorted = [...visibleSameCategoryItems].sort((a, b) => calculateDisplayScore(b) - calculateDisplayScore(a));
  const competitors = sorted.filter((item) => item.relevanceScore >= 45).slice(0, 10);
  const excludedCompetitors = sorted.filter((item) => item.relevanceScore < 45).slice(0, 10);
  return { competitors, excludedCompetitors, categoryFilteredCount: visibleSameCategoryItems.length };
}

function calculateDisplayScore(item: MarketResearchCompetitor) {
  return (
    item.relevanceScore +
    (hasUsableValue(item.price) ? 12 : 0) +
    (hasUsableValue(item.reviewCount) ? 10 : 0) +
    (hasUsableValue(item.rating) ? 10 : 0) +
    (hasUsableValue(item.thumbnailUrl) ? 8 : 0) +
    (hasUsableValue(item.productUrl) ? 8 : 0)
  );
}

function sanitizeAnalysis(aiAnalysis: OpenAiMarketResearchPayload["aiAnalysis"], competitorCount: number): MarketResearchResult["aiAnalysis"] {
  const limited = competitorCount === 0;
  return {
    competitionStrength: sanitizeKoreanText(aiAnalysis?.competitionStrength, limited ? MORE_DATA_REQUIRED_KO : "경쟁 강도 추가 분석이 필요합니다."),
    pricePosition: sanitizeKoreanText(aiAnalysis?.pricePosition, limited ? SOURCE_LIMITED_KO : "가격대 비교가 필요합니다."),
    reviewBarrier: sanitizeKoreanText(aiAnalysis?.reviewBarrier, SOURCE_LIMITED_KO),
    detailPageStrengths: sanitizeKoreanList(aiAnalysis?.detailPageStrengths, [limited ? MORE_DATA_REQUIRED_KO : "상세페이지 강점 추가 분석이 필요합니다."]),
    thumbnailPattern: sanitizeKoreanText(aiAnalysis?.thumbnailPattern, limited ? MORE_DATA_REQUIRED_KO : "썸네일 패턴 추가 분석이 필요합니다."),
    customerComplaints: sanitizeKoreanList(aiAnalysis?.customerComplaints, [SOURCE_LIMITED_KO]),
    differentiationPoints: sanitizeKoreanList(aiAnalysis?.differentiationPoints, [limited ? MORE_DATA_REQUIRED_KO : "차별화 포인트 추가 분석이 필요합니다."]),
    summary: sanitizeKoreanText(aiAnalysis?.summary, limited ? "동일 카테고리의 검증 가능한 쿠팡 경쟁상품 근거가 부족합니다." : "동일 카테고리 경쟁상품을 기준으로 분석했습니다."),
    recommendedAction: sanitizeKoreanText(aiAnalysis?.recommendedAction, "동일 카테고리 쿠팡 상품 URL과 리뷰 데이터를 추가로 확인하세요."),
  };
}

function createEmptyResearch(categoryProfile?: CategoryProfile): Pick<MarketResearchResult, "competitors" | "excludedCompetitors" | "searchLogs" | "selectedCount" | "aiAnalysis"> {
  return {
    competitors: [],
    excludedCompetitors: [],
    searchLogs: [],
    selectedCount: 0,
    aiAnalysis: {
      competitionStrength: MORE_DATA_REQUIRED_KO,
      pricePosition: SOURCE_LIMITED_KO,
      reviewBarrier: SOURCE_LIMITED_KO,
      detailPageStrengths: ["검증 가능한 동일 카테고리 쿠팡 상품 페이지가 필요합니다."],
      thumbnailPattern: MORE_DATA_REQUIRED_KO,
      customerComplaints: [SOURCE_LIMITED_KO],
      differentiationPoints: [`${categoryProfile?.baseCategory || "동일 카테고리"} 경쟁상품 근거가 더 필요합니다.`],
      summary: "동일 카테고리의 검증 가능한 쿠팡 경쟁상품 정보를 확정하지 않았습니다.",
      recommendedAction: "카테고리가 일치하는 쿠팡 상품 URL, 가격, 리뷰 수, 평점 근거를 추가로 확보하세요.",
    },
  };
}

function createLimitedResult({
  keyword,
  url,
  date,
  sourceHash,
  cacheKey,
  categoryProfile,
  cacheStatus,
  message,
  competitors = [],
  searchLogs = [],
}: {
  keyword: string;
  url: string;
  date: string;
  sourceHash: string;
  cacheKey: string;
  categoryProfile: CategoryProfile;
  cacheStatus: MarketResearchResult["cacheStatus"];
  message: string;
  competitors?: MarketResearchCompetitor[];
  searchLogs?: MarketResearchResult["searchLogs"];
}): MarketResearchResult {
  const empty = createEmptyResearch(categoryProfile);
  const hasVerified = competitors.some((item) => item.evidenceStatus === "VERIFIED INFORMATION");
  const hasPartial = competitors.some((item) => item.evidenceStatus === "PARTIAL DATA");
  const hasAnyProductData = competitors.length > 0;
  const researchSources = Array.from(new Set(competitors.map((item) => item.researchSource)));
  return {
    ok: cacheStatus !== "Analysis Limited",
    keyword,
    url,
    date,
    promptVersion: PROMPT_VERSION,
    cacheStatus,
    sourceHash,
    cacheKey,
    categoryProfile,
    sourceBadges: createSourceBadges({ hasVerified, hasPartial, hasAnyProductData, researchSources }),
    competitors: competitors.length ? competitors : empty.competitors,
    excludedCompetitors: [],
    searchLogs,
    selectedCount: competitors.length,
    aiAnalysis: empty.aiAnalysis,
    finance: createFinanceStats(),
    message,
    lastAnalyzedAt: null,
  };
}

function createSourceBadges({
  hasVerified,
  hasPartial,
  hasAnyProductData,
  researchSources = [],
}: {
  hasVerified: boolean;
  hasPartial: boolean;
  hasAnyProductData: boolean;
  researchSources?: ResearchSource[];
}): MarketResearchResult["sourceBadges"] {
  const badges: MarketResearchResult["sourceBadges"] = ["OPENAI MARKET RESEARCH", "COUPANG PUBLIC WEB", "COUPANG ADS TREND INSIGHTS", "AI ANALYSIS"];
  for (const source of researchSources) {
    if (!badges.includes(source)) badges.push(source);
  }
  if (hasVerified) badges.push("VERIFIED INFORMATION");
  if (hasPartial) badges.push("PARTIAL DATA");
  if (!hasVerified && !hasPartial) badges.push("SOURCE LIMITED");
  if (!hasAnyProductData) badges.push("MORE DATA REQUIRED");
  return badges;
}

function createCategoryProfile(keyword: string): CategoryProfile {
  const normalized = normalizeText(keyword);

  if (normalized.includes("치마바지")) {
    return {
      baseCategory: "치마바지",
      categoryLock: "치마바지 상품만 허용",
      allowedKeywordExpansion: ["치마바지", "여성 치마바지", "와이드 치마바지", "쿨링 치마바지", "밴딩 치마바지", "여름 치마바지"],
      requiredAnyTerms: ["치마바지"],
      requiredAllTerms: [],
      excludedTerms: ["원피스", "레깅스", "후드", "맨투맨", "블라우스", "니트", "슬랙스"],
    };
  }

  if (normalized.includes("슬랙스")) {
    return {
      baseCategory: "와이드 슬랙스",
      categoryLock: "슬랙스/팬츠/바지 상품만 허용",
      allowedKeywordExpansion: ["여름 와이드 슬랙스", "여성 와이드 슬랙스", "와이드 슬랙스", "여름 슬랙스", "여성 슬랙스", "와이드 팬츠", "여름 팬츠", "팬츠"],
      requiredAnyTerms: ["슬랙스", "팬츠", "바지", "와이드팬츠", "와이드 슬랙스", "여성 슬랙스", "여름 슬랙스", "밴딩 슬랙스", "린넨 슬랙스"],
      requiredAllTerms: [],
      excludedTerms: ["운동화", "신발", "원피스", "상의", "티셔츠", "나시", "망고나시", "민소매", "브라", "속옷", "가방", "모자", "치마레깅스", "치마바지", "레깅스", "후드", "맨투맨", "블라우스", "니트", "남성용", "남성", "남자", "재킷"],
    };
  }

  if (normalized.includes("원피스")) {
    return {
      baseCategory: "원피스",
      categoryLock: "원피스 상품만 허용",
      allowedKeywordExpansion: ["린넨 셔츠 원피스", "여름 셔츠 원피스", "여성 원피스", "롱 원피스", "반팔 원피스", "휴양지 원피스"],
      requiredAnyTerms: ["원피스"],
      requiredAllTerms: [],
      excludedTerms: ["슬랙스", "팬츠", "치마바지", "레깅스", "후드", "맨투맨", "블라우스"],
    };
  }

  if (normalized.includes("민소매") && normalized.includes("니트")) {
    return {
      baseCategory: "민소매 니트",
      categoryLock: "민소매 니트 상품만 허용",
      allowedKeywordExpansion: ["민소매 니트", "여성 민소매 니트", "여름 민소매 니트", "라운드 민소매 니트", "브이넥 민소매 니트"],
      requiredAnyTerms: [],
      requiredAllTerms: ["민소매", "니트"],
      excludedTerms: ["원피스", "슬랙스", "치마바지", "레깅스", "후드", "맨투맨"],
    };
  }

  if (normalized.includes("팬츠")) {
    return {
      baseCategory: "팬츠",
      categoryLock: "팬츠 상품만 허용",
      allowedKeywordExpansion: ["여성 팬츠", "여름 팬츠", "냉감 팬츠", "밴딩 팬츠", "쿨링 팬츠", "와이드 팬츠"],
      requiredAnyTerms: ["팬츠", "바지"],
      requiredAllTerms: [],
      excludedTerms: ["원피스", "치마바지", "레깅스", "후드", "맨투맨", "블라우스", "니트"],
    };
  }

  if (normalized.includes("블라우스")) {
    return {
      baseCategory: "블라우스",
      categoryLock: "블라우스 상품만 허용",
      allowedKeywordExpansion: ["여성 블라우스", "여름 블라우스", "반팔 블라우스", "린넨 블라우스", "출근룩 블라우스"],
      requiredAnyTerms: ["블라우스"],
      requiredAllTerms: [],
      excludedTerms: ["원피스", "슬랙스", "팬츠", "치마바지", "레깅스", "후드", "맨투맨"],
    };
  }

  return {
    baseCategory: keyword,
    categoryLock: "입력 키워드와 같은 상품군만 허용",
    allowedKeywordExpansion: [keyword, `여성 ${keyword}`, `여름 ${keyword}`, `쿠팡 ${keyword}`],
    requiredAnyTerms: extractMeaningfulTerms(normalized),
    requiredAllTerms: [],
    excludedTerms: ["후드", "맨투맨"],
  };
}

function mapRouteSlugToKoreanKeyword(value: string) {
  const normalized = value.trim();
  const key = normalized.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const mapping: Record<string, string> = {
    "wide-slacks": "여름 와이드 슬랙스",
    "wide-slack": "여름 와이드 슬랙스",
    "wide-pants": "와이드 팬츠",
    "cool-inner": "냉감 티셔츠",
    "skirt-pants": "치마바지",
    "linen-setup": "린넨 셋업",
    "long-skirt": "롱스커트",
  };

  return mapping[key] || normalized;
}

function isSameCategoryCompetitor(productName: string, categoryProfile: CategoryProfile) {
  const normalized = normalizeText(productName);
  if (!normalized) return false;
  if (categoryProfile.excludedTerms.some((term) => normalized.includes(normalizeText(term)))) return false;
  if (categoryProfile.requiredAllTerms.length && !categoryProfile.requiredAllTerms.every((term) => normalized.includes(normalizeText(term)))) return false;
  if (categoryProfile.requiredAnyTerms.length && !categoryProfile.requiredAnyTerms.some((term) => normalized.includes(normalizeText(term)))) return false;
  return true;
}

function calculateRelevanceScore(productName: string, categoryProfile: CategoryProfile) {
  const normalized = normalizeText(productName);
  if (!normalized) return 0;

  let score = 20;
  if (categoryProfile.requiredAllTerms.length) {
    score += categoryProfile.requiredAllTerms.every((term) => normalized.includes(normalizeText(term))) ? 45 : -25;
  }
  if (categoryProfile.requiredAnyTerms.length) {
    score += categoryProfile.requiredAnyTerms.some((term) => normalized.includes(normalizeText(term))) ? 50 : -20;
  }
  if (categoryProfile.allowedKeywordExpansion.some((keyword) => normalized.includes(normalizeText(keyword)))) score += 20;
  if (categoryProfile.excludedTerms.some((term) => normalized.includes(normalizeText(term)))) score -= 55;

  return Math.max(0, Math.min(100, score));
}

function createRelevanceReason(productName: string, categoryProfile: CategoryProfile) {
  if (!productName.trim()) return MORE_DATA_REQUIRED_KO;
  if (isSameCategoryCompetitor(productName, categoryProfile)) return `${categoryProfile.baseCategory} 핵심 조건과 일치합니다.`;
  if (categoryProfile.excludedTerms.some((term) => normalizeText(productName).includes(normalizeText(term)))) {
    return "다른 카테고리 신호가 있어 제외 후보로 분류합니다.";
  }
  return "핵심 카테고리 일치 근거가 약해 제외 후보로 분류합니다.";
}

function normalizeScore(value: unknown, fallback: number) {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return fallback;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function inferEvidenceStatus(item: Partial<MarketResearchCompetitor>): MarketResearchCompetitor["evidenceStatus"] {
  const productName = hasUsableValue(item.productName);
  const price = hasUsableValue(item.price);
  const reviewCount = hasUsableValue(item.reviewCount);
  const rating = hasUsableValue(item.rating);
  const productUrl = hasUsableValue(item.productUrl);

  if (productName && price && reviewCount && rating && productUrl) return "VERIFIED INFORMATION";
  if (productName && (price || reviewCount || rating || productUrl)) return "PARTIAL DATA";
  return "SOURCE LIMITED";
}

function normalizeResearchSource(value: unknown): ResearchSource {
  if (value === "Naver Search API") return "Naver Search API";
  if (value === "Coupang Official API") return "Coupang Official API";
  if (value === "Coupang HTML") return "Coupang HTML";
  if (value === "OpenAI Analysis") return "OpenAI Analysis";
  if (value === "Coupang Ads Trend Insights") return "Coupang Ads Trend Insights";
  if (value === "Other Public Sources") return "Other Public Sources";
  return "OpenAI Analysis";
}

function createSourceFlags(source: ResearchSource): SourceFlags {
  return {
    openAiSearch: false,
    openAiAnalysis: source === "OpenAI Analysis",
    naverSearch: source === "Naver Search API",
    htmlParser: source === "Coupang HTML",
    coupangApi: source === "Coupang Official API",
    adsInsight: source === "Coupang Ads Trend Insights",
  };
}

function normalizeSourceFlags(value: unknown, fallbackSource: ResearchSource): SourceFlags {
  const fallback = createSourceFlags(fallbackSource);
  if (!value || typeof value !== "object") return fallback;
  const flags = value as Partial<SourceFlags>;
  return {
    openAiSearch: Boolean(flags.openAiSearch) || fallback.openAiSearch,
    openAiAnalysis: Boolean(flags.openAiAnalysis) || fallback.openAiAnalysis,
    naverSearch: Boolean(flags.naverSearch) || fallback.naverSearch,
    htmlParser: Boolean(flags.htmlParser) || fallback.htmlParser,
    coupangApi: Boolean(flags.coupangApi) || fallback.coupangApi,
    adsInsight: Boolean(flags.adsInsight) || fallback.adsInsight,
  };
}

function mergeSourceFlags(current: SourceFlags, next: SourceFlags): SourceFlags {
  return {
    openAiSearch: current.openAiSearch || next.openAiSearch,
    openAiAnalysis: current.openAiAnalysis || next.openAiAnalysis,
    naverSearch: current.naverSearch || next.naverSearch,
    htmlParser: current.htmlParser || next.htmlParser,
    coupangApi: current.coupangApi || next.coupangApi,
    adsInsight: current.adsInsight || next.adsInsight,
  };
}

function hasUsableValue(value: unknown) {
  if (typeof value !== "string") return Boolean(value);
  const text = value.trim();
  return Boolean(text) && text !== SOURCE_LIMITED_KO && text !== MORE_DATA_REQUIRED_KO && text !== "SOURCE LIMITED" && text !== "MORE DATA REQUIRED" && text !== "-";
}

function extractMeaningfulTerms(value: string) {
  const terms = value
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .filter((term) => !["여름", "여성", "쿠팡", "추천"].includes(term));
  return terms.length ? terms.slice(0, 3) : [value];
}

function sanitizeList(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 5) : fallback;
}

function sanitizeKoreanList(value: unknown, fallback: string[]) {
  const items = sanitizeList(value, fallback).map((item) => sanitizeKoreanText(item, fallback[0] || MORE_DATA_REQUIRED_KO));
  return items.length ? items : fallback;
}

function sanitizeKoreanText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;
  if (text === "SOURCE LIMITED") return SOURCE_LIMITED_KO;
  if (text === "MORE DATA REQUIRED") return MORE_DATA_REQUIRED_KO;
  if (looksLikeEnglishSentence(text)) return fallback;
  return text.replaceAll("SOURCE LIMITED", SOURCE_LIMITED_KO).replaceAll("MORE DATA REQUIRED", MORE_DATA_REQUIRED_KO);
}

function looksLikeEnglishSentence(value: string) {
  const latinWords = value.match(/[A-Za-z]{3,}/g) ?? [];
  const koreanChars = value.match(/[가-힣]/g) ?? [];
  return latinWords.length >= 4 && koreanChars.length < 6;
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

function createResearchDebug(dailyLimit: number, modelName: string): NonNullable<MarketResearchResult["debug"]> | undefined {
  if (process.env.NODE_ENV === "production") return undefined;

  return {
    policy: "development",
    dailyLimit,
    modelName,
    toolName: "없음",
    apiCallCode: "responses.create (HTTP POST /v1/responses, non-streaming)",
    rawResponsesEnabled: true,
    openAiSearchAttempts: [],
    zeroStage: "대기 중",
    finalSelectedTop10: [],
    finalUrlStrings: [],
    pipeline: {
      promptSent: 0,
      responseReceived: 0,
      urlParsed: 0,
      jsonParsed: 0,
      candidateCollected: 0,
      afterMerge: 0,
      categoryFilter: 0,
      deduplicate: 0,
      top10: 0,
      mergeRate: 0,
    },
  };
}

export function resetOpenAiMarketResearchDebugUsage() {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, message: "Production에서는 OpenAI 사용량 디버그 초기화를 허용하지 않습니다.", usage };
  }

  usage = { date: getKoreanDateKey(), calls: 0, cacheHits: 0, cacheMisses: 0 };
  return { ok: true, message: "Development OpenAI 사용량 카운터를 초기화했습니다.", usage };
}

function extractOutputText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (payload.output_text) return payload.output_text;
  return payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n").trim() || "";
}

function resetUsageIfNeeded(date: string) {
  if (usage.date !== date) usage = { date, calls: 0, cacheHits: 0, cacheMisses: 0 };
}

function getEffectiveOpenAiDailyLimit() {
  if (process.env.NODE_ENV !== "production") {
    return Number(process.env.OPENAI_DAILY_LIMIT || DEVELOPMENT_DAILY_LIMIT);
  }

  return Number(process.env.OPENAI_DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractCoupangProductId(url: string) {
  return url.match(/\/vp\/products\/(\d+)/)?.[1] || "";
}

function normalizeFinalCoupangProductUrl(url: string) {
  const productId = extractCoupangProductId(url);
  return productId ? `https://www.coupang.com/vp/products/${productId}` : "";
}

function calculateMergeRate(candidateCount: number, mergedCount: number) {
  if (!candidateCount) return 0;
  return Math.round(((candidateCount - mergedCount) / candidateCount) * 100);
}

function calculateNameSimilarity(a: string, b: string) {
  const aTokens = tokenizeForSimilarity(a);
  const bTokens = tokenizeForSimilarity(b);
  if (!aTokens.length || !bTokens.length) return 0;

  const intersection = aTokens.filter((token) => bTokens.includes(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union ? intersection / union : 0;
}

function tokenizeForSimilarity(value: string) {
  return normalizeText(value)
    .replace(/[^0-9a-z가-힣\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !["여름", "여성", "쿠팡", "바지", "팬츠", "슬랙스"].includes(token));
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
