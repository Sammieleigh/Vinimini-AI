import { createHash } from "crypto";
import { fetchCoupangSearch } from "./coupang";
import { fetchCoupangPartnersProducts } from "./dataAdapters/coupangPartnersAdapter";
import type { PartnerProduct } from "./dataAdapters/types";
import type { CoupangSearchProduct } from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PROMPT_VERSION = "market-research-v8-openai-coupang-url-research";
const TASK_TYPE = "OPENAI_EXECUTIVE_MARKET_RESEARCH";
const COUPANG_ADS_TRENDS_URL = "https://ads.coupang.com/trends";
const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_TTL_HOURS = 24;
const MORE_DATA_REQUIRED_KO = "추가 데이터 필요";
const SOURCE_LIMITED_KO = "근거 부족";
const WIDE_SLACKS_EMPTY_MESSAGE = "동일 카테고리 경쟁상품 데이터를 불러오지 못했습니다. 키워드를 조정해 다시 리서치하세요.";

type ResearchSource = "Coupang Official API" | "Coupang HTML" | "OpenAI Search" | "Coupang Ads Trend Insights" | "Other Public Sources";

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
  const officialCoupangSearch = await fetchOfficialCoupangCompetitors(categoryProfile);
  const verifiedCoupangCompetitors = officialCoupangSearch.competitors;
  const rankedOfficialCoupangCompetitors = rankCompetitors(verifiedCoupangCompetitors, categoryProfile);
  const sourceHash = hash(
    JSON.stringify({
      primarySource: "coupang-public-web",
      officialCoupangApiStatus: officialCoupangSearch.status,
      officialCoupangSearchKeywords: officialCoupangSearch.triedKeywords,
      officialCoupangSearchLogs: officialCoupangSearch.searchLogs,
      officialCoupangProducts: rankedOfficialCoupangCompetitors.competitors.map((item) => ({
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
      competitors: rankedOfficialCoupangCompetitors.competitors,
      searchLogs: officialCoupangSearch.searchLogs,
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
      categoryProfile,
      cacheStatus: "Analysis Limited",
      competitors: rankedOfficialCoupangCompetitors.competitors,
      searchLogs: officialCoupangSearch.searchLogs,
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
                "You are VINIMINI Executive Market Research Engine for Korean Coupang sellers. First use the provided Coupang HTML/API products. If Coupang HTML collection failed or is insufficient, use OpenAI web search only to find real publicly available Coupang product pages for the same Korean keywords. Never invent competitor products, product facts, review counts, ratings, prices, sellers, shipping, URLs, thumbnails, sales volume, or rankings. Return no competitor row unless it is tied to a real public Coupang URL or provided Coupang HTML/API evidence. Return JSON only. All user-facing JSON string values must be written in Korean. Do not write English analysis sentences. If evidence is insufficient, write '근거 부족' or '추가 데이터 필요' in Korean.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: TASK_TYPE,
              promptVersion: PROMPT_VERSION,
              keyword: normalizedKeyword,
              targetUrl: normalizedUrl || "not provided",
              categoryProfile,
              minimumCompetitorGoal: 5,
              exactCoupangSearchUrls: officialCoupangSearch.searchLogs.map((log) => ({
                keyword: log.keyword,
                searchUrl: log.searchUrl,
                collectedByApiAndHtmlParser: log.selectedCount,
                status: log.status,
              })),
              verifiedOfficialCoupangProducts: verifiedCoupangCompetitors.map((item) => ({
                productName: item.productName,
                price: item.price,
                productUrl: item.productUrl,
                thumbnailUrl: item.thumbnailUrl,
                evidenceStatus: item.evidenceStatus,
                unavailableFields: ["reviewCount", "rating", "seller", "shippingInfo", "rocketDelivery"],
              })),
              sourcePriority: [
                "1. Coupang HTML/API products already collected by the server",
                "2. If the server collected fewer than 5 items, OpenAI Search may find real public Coupang product pages for the exact Korean keyword set",
                `3. Coupang Ads Trend Insights (${COUPANG_ADS_TRENDS_URL}) for seasonality, category trend, keyword trend, customer purchase trend, and ad timing only`,
                "4. Other public sources only as supporting context, not as product rows unless they point to a real Coupang product page",
              ],
              strictRules: [
                `Search these same-category keywords in order and do not broaden beyond them: ${categoryProfile.allowedKeywordExpansion.join(" -> ")}`,
                `Score each discovered product for category relevance against: ${categoryProfile.categoryLock}`,
                `Products containing these terms are hard-excluded and must not be used as competitors or excluded candidates: ${categoryProfile.excludedTerms.join(", ") || "none"}`,
                "For wide-slacks research, only pants/slacks/trouser-family products are allowed. Never return shoes, dresses, tops, sleeveless tops, leggings, underwear, bags, or hats.",
                "Do not discard publicly verified same-category Coupang products. Return them with relevanceScore, relevanceReason, and researchSource.",
                "If official API and HTML Parser data is insufficient, use OpenAI Search to add same-category Coupang competitors only when the product has a real public Coupang productUrl.",
                "When official API and HTML Parser return fewer than 5 competitors, inspect the provided exact Coupang search URLs and public Coupang-related web results, then return up to 10 same-category competitors with public Coupang URL evidence.",
                "OpenAI-discovered competitors must set researchSource to 'OpenAI Search'. Server-collected HTML products use 'Coupang HTML'. Coupang Ads Trend Insights is supporting trend context, not direct product-row evidence.",
                "OpenAI-discovered competitor rows without a Coupang productUrl must be omitted. Missing fields must remain SOURCE LIMITED or MORE DATA REQUIRED.",
                "Verified product fields must come from public evidence. AI interpretation must stay in aiAnalysis.",
                "Every analysis sentence shown to the CEO must be Korean only.",
              ],
              collectWhenVerified: ["productName", "thumbnailUrl", "price", "reviewCount", "rating", "seller", "shippingInfo", "rocketDelivery", "sellingPoints", "productUrl", "researchSource"],
              analyzeSeparately: [
                "competitionStrength",
                "pricePosition",
                "reviewBarrier",
                "detailPageStrengths",
                "thumbnailPattern",
                "customerComplaints",
                "differentiationPoints",
                "summary",
                "recommendedAction",
              ],
              perCompetitorAnalysis:
                "For each competitor, analyze whyItSells, thumbnailFeatures, firstScreenFeatures, detailPageFeatures, repeatedReviewPros, repeatedReviewCons, differentiationHints in Korean only. If reviews are unavailable, write 근거 부족 instead of inventing complaints.",
              outputSchema:
                "{ competitors: [{ productName, price, reviewCount, rating, seller, shippingInfo, rocketDelivery, productUrl, thumbnailUrl, sellingPoints, thumbnailFeatures, firstScreenFeatures, detailPageFeatures, repeatedReviewPros, repeatedReviewCons, differentiationHints, whyItSells, relevanceScore, relevanceReason, evidenceStatus, researchSource }], aiAnalysis: { competitionStrength, pricePosition, reviewBarrier, detailPageStrengths, thumbnailPattern, customerComplaints, differentiationPoints, summary, recommendedAction } }",
            }),
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI Market Research failed: ${response.status}`);

    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const parsed = parseMarketResearch(extractOutputText(payload), categoryProfile);
    const ranked = rankCompetitors(mergeCompetitors(verifiedCoupangCompetitors, parsed.competitors), categoryProfile);
    const competitors = ranked.competitors;
    const hasVerified = competitors.some((item) => item.evidenceStatus === "VERIFIED INFORMATION");
    const hasPartial = competitors.some((item) => item.evidenceStatus === "PARTIAL DATA");
    const hasAnyProductData = competitors.length + ranked.excludedCompetitors.length > 0;
    const researchSources = Array.from(new Set([...competitors, ...ranked.excludedCompetitors].map((item) => item.researchSource)));
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
      searchLogs: officialCoupangSearch.searchLogs,
      selectedCount: competitors.length,
      aiAnalysis,
      finance: createFinanceStats(),
      message: hasVerified
        ? "쿠팡 HTML/API와 OpenAI Search가 실제 공개 쿠팡 근거를 기준으로 경쟁상품을 정리했습니다."
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
      cacheStatus: "Analysis Limited",
      competitors: rankedOfficialCoupangCompetitors.competitors,
      searchLogs: officialCoupangSearch.searchLogs,
      message: `OpenAI 쿠팡 중심 공개 웹 리서치에 실패했습니다. ${WIDE_SLACKS_EMPTY_MESSAGE} ${error instanceof Error ? error.message : ""}`.trim(),
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
      productName: item.productName || MORE_DATA_REQUIRED_KO,
      price: item.price || SOURCE_LIMITED_KO,
      reviewCount: item.reviewCount || SOURCE_LIMITED_KO,
      rating: item.rating || SOURCE_LIMITED_KO,
      seller: item.seller || SOURCE_LIMITED_KO,
      shippingInfo: item.shippingInfo || SOURCE_LIMITED_KO,
      rocketDelivery: item.rocketDelivery || SOURCE_LIMITED_KO,
      productUrl: item.productUrl || "",
      thumbnailUrl: item.thumbnailUrl || "",
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
    }));
}

function hasCandidateEvidence(item: Partial<MarketResearchCompetitor>) {
  return hasUsableValue(item.productName) && hasUsableValue(item.productUrl) && item.productUrl?.includes("coupang.com");
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
      productUrl: product.productUrl || "",
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
    }));
}

async function fetchOfficialCoupangCompetitors(categoryProfile: CategoryProfile) {
  const triedKeywords: string[] = [];
  const searchLogs: MarketResearchResult["searchLogs"] = [];
  const competitors: MarketResearchCompetitor[] = [];
  let status = "API NOT CONNECTED";

  for (const keyword of categoryProfile.allowedKeywordExpansion) {
    triedKeywords.push(keyword);
    const result = await fetchCoupangPartnersProducts(keyword);
    status = result.status;
    const mapped = mapPartnerProductsToCompetitors(result.data, categoryProfile);
    let ranked = rankCompetitors(mapped, categoryProfile);

    if (ranked.competitors.length === 0 || mergeCompetitors([], [...competitors, ...ranked.competitors]).length < 5) {
      try {
        const publicProducts = await fetchCoupangSearch(keyword);
        const publicMapped = mapPublicSearchProductsToCompetitors(publicProducts, categoryProfile);
        ranked = rankCompetitors(mergeCompetitors(ranked.competitors, publicMapped), categoryProfile);
        status = publicMapped.length ? "LIVE DATA" : status;
      } catch {
        // Public Coupang search can be blocked; keep official adapter result and continue keyword expansion.
      }
    }

    competitors.push(...ranked.competitors);
    const selectedCount = mergeCompetitors([], competitors).length;
    searchLogs.push({
      keyword,
      searchUrl: createCoupangSearchUrl(keyword),
      resultCount: ranked.competitors.length,
      selectedCount,
      status: ranked.competitors.length ? "COLLECTED" : "COUPANG COLLECTION FAILED",
    });
    if (selectedCount >= 5) break;
  }

  return {
    status,
    triedKeywords,
    searchLogs,
    competitors: mergeCompetitors([], competitors),
  };
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
      productUrl: product.productUrl || "",
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
    }));
}

function mergeCompetitors(primary: MarketResearchCompetitor[], secondary: MarketResearchCompetitor[]) {
  const seen = new Map<string, MarketResearchCompetitor>();
  const order: string[] = [];

  for (const item of [...primary, ...secondary]) {
    const key = normalizeText(item.productUrl || item.productName);
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, item);
      order.push(key);
      continue;
    }
    seen.set(key, mergeCompetitorRecord(existing, item));
  }

  return order.map((key) => seen.get(key)).filter((item): item is MarketResearchCompetitor => Boolean(item)).slice(0, 30);
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
  };
}

function createCoupangSearchUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${keyword.trim().split(/\s+/).join("+")}`;
}

function rankCompetitors(items: MarketResearchCompetitor[], categoryProfile: CategoryProfile) {
  const visibleSameCategoryItems = items.filter((item) => isSameCategoryCompetitor(item.productName, categoryProfile));
  const sorted = [...visibleSameCategoryItems].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const competitors = sorted.filter((item) => item.relevanceScore >= 45).slice(0, 10);
  const excludedCompetitors = sorted.filter((item) => item.relevanceScore < 45).slice(0, 10);
  return { competitors, excludedCompetitors };
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
      excludedTerms: ["운동화", "신발", "원피스", "상의", "티셔츠", "나시", "망고나시", "민소매", "브라", "속옷", "가방", "모자", "치마레깅스", "치마바지", "레깅스", "후드", "맨투맨", "블라우스", "니트"],
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
  if (value === "Coupang Official API") return "Coupang Official API";
  if (value === "Coupang HTML") return "Coupang HTML";
  if (value === "Coupang Ads Trend Insights") return "Coupang Ads Trend Insights";
  if (value === "Other Public Sources") return "Other Public Sources";
  return "OpenAI Search";
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

function extractOutputText(payload: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (payload.output_text) return payload.output_text;
  return payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text).filter(Boolean).join("\n").trim() || "";
}

function resetUsageIfNeeded(date: string) {
  if (usage.date !== date) usage = { date, calls: 0, cacheHits: 0, cacheMisses: 0 };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
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
