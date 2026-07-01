import type { AdapterResult, NaverCoupangSearchProduct } from "./types";

const NAVER_WEB_SEARCH_URL = "https://openapi.naver.com/v1/search/webkr.json";
const NAVER_SHOPPING_SEARCH_URL = "https://openapi.naver.com/v1/search/shop.json";
const SOURCE_LIMITED_KO = "근거 부족";
const MAX_RAW_CANDIDATES = 120;
const MAX_ENRICHMENT_QUERIES = 8;
const NAVER_FETCH_TIMEOUT_MS = 8_000;

type NaverWebSearchResponse = {
  items?: Array<{
    title?: string;
    link?: string;
    description?: string;
  }>;
};

type NaverShoppingSearchResponse = {
  items?: Array<{
    title?: string;
    link?: string;
    image?: string;
    lprice?: string;
    mallName?: string;
  }>;
};

type NaverSearchHeaders = {
  "X-Naver-Client-Id": string;
  "X-Naver-Client-Secret": string;
};

type NaverShoppingSignal = {
  productName: string;
  thumbnailUrl: string;
  price: string;
  seller: string;
  sourceDescription: string;
};

export async function fetchNaverCoupangSearchProducts(keywords: string[]): Promise<AdapterResult<NaverCoupangSearchProduct[]>> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const normalizedKeywords = Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)));

  if (!clientId || !clientSecret) {
    return {
      source: "Naver Search API",
      status: "API NOT CONNECTED",
      keyword: normalizedKeywords[0] || "",
      message: "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없어 네이버 검색 API를 호출하지 않았습니다.",
      data: [],
      fetchedAt: null,
    };
  }

  const headers: NaverSearchHeaders = {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  };

  try {
    const rawProducts: NaverCoupangSearchProduct[] = [];

    const [shoppingResults, webResults] = await Promise.all([
      Promise.allSettled(normalizedKeywords.map((keyword) => fetchNaverShoppingCoupangProducts(keyword, headers))),
      Promise.allSettled(normalizedKeywords.map((keyword) => fetchNaverWebCoupangProducts(keyword, headers))),
    ]);
    rawProducts.push(...shoppingResults.flatMap((result) => (result.status === "fulfilled" ? result.value : [])));
    rawProducts.push(...webResults.flatMap((result) => (result.status === "fulfilled" ? result.value : [])));

    const enrichedProducts = await enrichWebProductsWithShopping(rawProducts, headers);

    return {
      source: "Naver Search API",
      status: enrichedProducts.length ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeywords.join(", "),
      message: enrichedProducts.length
        ? "네이버 검색 API에서 실제 쿠팡 상품 링크를 확보했습니다."
        : "네이버 검색 API 호출은 성공했지만 동일 카테고리 쿠팡 상품 링크를 충분히 찾지 못했습니다.",
      data: enrichedProducts.slice(0, MAX_RAW_CANDIDATES),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver Search API",
      status: "SOURCE LIMITED",
      keyword: normalizedKeywords.join(", "),
      message: `네이버 검색 API 호출에 실패했습니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function fetchNaverWebCoupangProducts(keyword: string, headers: NaverSearchHeaders): Promise<NaverCoupangSearchProduct[]> {
  const url = new URL(NAVER_WEB_SEARCH_URL);
  url.searchParams.set("query", `${keyword} 쿠팡`);
  url.searchParams.set("display", "20");
  url.searchParams.set("start", "1");

  const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 }, signal: AbortSignal.timeout(NAVER_FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Naver Web Search failed: ${response.status}`);

  const payload = (await response.json()) as NaverWebSearchResponse;
  return (payload.items ?? [])
    .map((item) => mapWebSearchItem(item, keyword))
    .filter((item): item is NaverCoupangSearchProduct => Boolean(item));
}

async function fetchNaverShoppingCoupangProducts(keyword: string, headers: NaverSearchHeaders): Promise<NaverCoupangSearchProduct[]> {
  const url = new URL(NAVER_SHOPPING_SEARCH_URL);
  url.searchParams.set("query", `${keyword} 쿠팡`);
  url.searchParams.set("display", "20");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 }, signal: AbortSignal.timeout(NAVER_FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Naver Shopping Search failed: ${response.status}`);

  const payload = (await response.json()) as NaverShoppingSearchResponse;
  return (payload.items ?? [])
    .map((item) => mapShoppingSearchItem(item, keyword))
    .filter((item): item is NaverCoupangSearchProduct => Boolean(item));
}

async function enrichWebProductsWithShopping(products: NaverCoupangSearchProduct[], headers: NaverSearchHeaders) {
  const webProductsNeedingEnrichment = products
    .filter((product) => product.sourceType === "Naver Web Search")
    .filter((product) => !hasUsableValue(product.price) || !hasUsableValue(product.thumbnailUrl))
    .sort((a, b) => getReviewVolumeScore(b) - getReviewVolumeScore(a))
    .slice(0, MAX_ENRICHMENT_QUERIES);
  const shoppingProductsNeedingReview = products
    .filter((product) => product.sourceType === "Naver Shopping Search")
    .filter((product) => !hasUsableValue(product.reviewCount) || !hasUsableValue(product.rating))
    .sort((a, b) => getReviewVolumeScore(b) - getReviewVolumeScore(a))
    .slice(0, MAX_ENRICHMENT_QUERIES);

  const enrichmentResults = await Promise.all(
    webProductsNeedingEnrichment.map(async (product) => {
      try {
        const matches = await fetchNaverShoppingSignalsForProduct(product.productName, headers);
        const best = findBestProductMatch(product.productName, matches);
        return { productUrl: product.productUrl, match: best };
      } catch {
        return { productUrl: product.productUrl, match: null };
      }
    }),
  );
  const enrichmentByUrl = new Map(enrichmentResults.map((item) => [item.productUrl, item.match]));
  const reviewResults = await Promise.all(
    shoppingProductsNeedingReview.map(async (product) => {
      try {
        const matches = await fetchNaverWebCoupangProducts(product.productName, headers);
        const best = findBestProductMatch(product.productName, matches);
        return { productUrl: product.productUrl, match: best };
      } catch {
        return { productUrl: product.productUrl, match: null };
      }
    }),
  );
  const reviewByUrl = new Map(reviewResults.map((item) => [item.productUrl, item.match]));

  return products.map((product) => {
    const enrichment = enrichmentByUrl.get(product.productUrl);
    const reviewEnrichment = reviewByUrl.get(product.productUrl);

    return {
      ...product,
      thumbnailUrl: hasUsableValue(product.thumbnailUrl) ? product.thumbnailUrl : enrichment?.thumbnailUrl || "",
      price: hasUsableValue(product.price) ? product.price : enrichment?.price || SOURCE_LIMITED_KO,
      reviewCount: hasUsableValue(product.reviewCount) ? product.reviewCount : reviewEnrichment?.reviewCount || SOURCE_LIMITED_KO,
      rating: hasUsableValue(product.rating) ? product.rating : reviewEnrichment?.rating || SOURCE_LIMITED_KO,
      seller: hasUsableValue(product.seller) ? product.seller : enrichment?.seller || SOURCE_LIMITED_KO,
      sourceDescription: [product.sourceDescription, enrichment?.sourceDescription, reviewEnrichment?.sourceDescription].filter((item): item is string => Boolean(item && hasUsableValue(item))).join(" / "),
    };
  });
}

async function fetchNaverShoppingSignalsForProduct(productName: string, headers: NaverSearchHeaders) {
  const queries = Array.from(new Set([productName, simplifyShoppingQuery(productName)].filter(Boolean)));
  const results = await Promise.allSettled(queries.map((query) => fetchNaverShoppingSignals(query, headers)));
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchNaverShoppingSignals(keyword: string, headers: NaverSearchHeaders): Promise<NaverShoppingSignal[]> {
  const url = new URL(NAVER_SHOPPING_SEARCH_URL);
  url.searchParams.set("query", keyword);
  url.searchParams.set("display", "10");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 }, signal: AbortSignal.timeout(NAVER_FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Naver Shopping Enrichment failed: ${response.status}`);

  const payload = (await response.json()) as NaverShoppingSearchResponse;
  return (payload.items ?? []).map((item) => ({
    productName: normalizeProductTitle(stripHtml(item.title || "")),
    thumbnailUrl: item.image || "",
    price: item.lprice ? `${Number(item.lprice).toLocaleString("ko-KR")}원` : SOURCE_LIMITED_KO,
    seller: item.mallName || SOURCE_LIMITED_KO,
    sourceDescription: "네이버 쇼핑 검색에서 가격과 대표 이미지를 보강했습니다.",
  }));
}

function mapWebSearchItem(
  item: NonNullable<NaverWebSearchResponse["items"]>[number],
  keyword: string,
): NaverCoupangSearchProduct | null {
  const sourceUrl = item.link || "";
  const productUrl = normalizeCoupangProductUrl(sourceUrl);
  if (!productUrl) return null;

  const title = stripHtml(item.title || "");
  const description = stripHtml(item.description || "");

  return {
    productName: normalizeProductTitle(title),
    productUrl,
    sourceUrl,
    thumbnailUrl: "",
    price: SOURCE_LIMITED_KO,
    reviewCount: parseReviewCount(description),
    rating: parseRating(description),
    seller: SOURCE_LIMITED_KO,
    shippingInfo: SOURCE_LIMITED_KO,
    rocketDelivery: SOURCE_LIMITED_KO,
    sourceQuery: `${keyword} 쿠팡`,
    sourceDescription: description,
    sourceType: "Naver Web Search",
  };
}

function mapShoppingSearchItem(
  item: NonNullable<NaverShoppingSearchResponse["items"]>[number],
  keyword: string,
): NaverCoupangSearchProduct | null {
  if (item.mallName && item.mallName !== "쿠팡") return null;

  const sourceUrl = item.link || "";
  const productUrl = normalizeCoupangProductUrl(sourceUrl);
  if (!productUrl) return null;

  return {
    productName: normalizeProductTitle(stripHtml(item.title || "")),
    productUrl,
    sourceUrl,
    thumbnailUrl: item.image || "",
    price: item.lprice ? `${Number(item.lprice).toLocaleString("ko-KR")}원` : SOURCE_LIMITED_KO,
    reviewCount: SOURCE_LIMITED_KO,
    rating: SOURCE_LIMITED_KO,
    seller: item.mallName || "쿠팡",
    shippingInfo: SOURCE_LIMITED_KO,
    rocketDelivery: SOURCE_LIMITED_KO,
    sourceQuery: `${keyword} 쿠팡`,
    sourceDescription: "네이버 쇼핑 검색에서 쿠팡 상품 링크, 가격, 대표 이미지를 확인했습니다.",
    sourceType: "Naver Shopping Search",
  };
}

function findBestProductMatch<T extends { productName: string }>(productName: string, products: T[]) {
  const scored = products
    .map((product) => ({ product, score: calculateNameSimilarity(productName, product.productName) }))
    .filter((item) => item.score >= 0.45)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.product ?? null;
}

function normalizeCoupangProductUrl(value: string) {
  if (!value.includes("coupang.com")) return "";

  const directMatch = value.match(/https?:\/\/(?:www\.)?coupang\.com\/vp\/products\/(\d+)/);
  if (directMatch?.[1]) return `https://www.coupang.com/vp/products/${directMatch[1]}`;

  try {
    const url = new URL(value);
    const pageKey = url.searchParams.get("pageKey") || url.searchParams.get("ctag");
    if (pageKey && /^\d+$/.test(pageKey)) return `https://www.coupang.com/vp/products/${pageKey}`;
  } catch {
    return "";
  }

  return "";
}

function parseRating(value: string) {
  return value.match(/별점\s*([0-9.]+)\s*점/)?.[1] || SOURCE_LIMITED_KO;
}

function parseReviewCount(value: string) {
  return value.match(/리뷰\s*([0-9,]+)\s*개/)?.[1] || SOURCE_LIMITED_KO;
}

function normalizeProductTitle(value: string) {
  return value.replace(/\s+-\s+바지$/, "").replace(/\s+/g, " ").trim();
}

function simplifyShoppingQuery(value: string) {
  return normalizeProductTitle(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b[A-Z]{1,6}\d{2,}\b/gi, " ")
    .replace(/\b\d{2,}\b/g, " ")
    .replace(/[~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim();
}

function hasUsableValue(value: string) {
  return Boolean(value.trim()) && value !== SOURCE_LIMITED_KO && value !== "-";
}

function getReviewVolumeScore(product: NaverCoupangSearchProduct) {
  const reviewCount = Number(product.reviewCount.replace(/[^0-9]/g, ""));
  return Number.isFinite(reviewCount) ? reviewCount : 0;
}

function calculateNameSimilarity(a: string, b: string) {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  if (!aTokens.length || !bTokens.length) return 0;

  const intersection = aTokens.filter((token) => bTokens.includes(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union ? intersection / union : 0;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^0-9a-z가-힣\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !["여름", "여성", "쿠팡", "바지"].includes(token));
}
