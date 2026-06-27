import type { CoupangSearchProduct } from "./types";

const COUPANG_ORIGIN = "https://www.coupang.com";

export async function fetchCoupangSearch(keyword: string): Promise<CoupangSearchProduct[]> {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return [];
  }

  const url = `${COUPANG_ORIGIN}/np/search?q=${encodeURIComponent(normalizedKeyword)}&channel=user`;
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Coupang search failed: ${response.status}`);
  }

  const html = await response.text();
  return parseCoupangSearchHtml(html, normalizedKeyword).slice(0, 10);
}

export function parseCoupangSearchHtml(html: string, keyword: string): CoupangSearchProduct[] {
  const blocks = html.match(/<li[^>]*class="[^"]*search-product[^"]*"[\s\S]*?<\/li>/g) ?? [];

  return blocks
    .map((block, index) => parseProductBlock(block, keyword, index))
    .filter((product): product is CoupangSearchProduct => product !== null);
}

function parseProductBlock(block: string, keyword: string, index: number): CoupangSearchProduct | null {
  const productName = cleanText(matchFirst(block, /<div[^>]*class="[^"]*\bname\b[^"]*"[^>]*>([\s\S]*?)<\/div>/));
  const price = cleanText(matchFirst(block, /<strong[^>]*class="[^"]*\bprice-value\b[^"]*"[^>]*>([\s\S]*?)<\/strong>/));
  const productUrl = normalizeUrl(
    cleanText(matchFirst(block, /<a[^>]*class="[^"]*search-product-link[^"]*"[^>]*href="([^"]+)"/)),
  );

  if (!productName || !productUrl) {
    return null;
  }

  const reviewCount = cleanText(matchFirst(block, /<span[^>]*class="[^"]*\brating-total-count\b[^"]*"[^>]*>([\s\S]*?)<\/span>/))
    .replace(/[()]/g, "")
    .trim();
  const rating = cleanText(matchFirst(block, /<em[^>]*class="[^"]*\brating\b[^"]*"[^>]*>([\s\S]*?)<\/em>/));
  const thumbnail = normalizeImageUrl(
    cleanText(matchFirst(block, /<img[^>]*(?:data-img-src|src)="([^"]+)"/)),
  );
  const isRocket = /rocket/i.test(block) || /로켓배송/.test(block);
  const isRocketGrowth = /로켓그로스|rocket-growth|rocketmerchant/i.test(block);
  const isAd = /ad-badge|search-product__ad-badge|광고/.test(block);
  const reviewNumber = parseNumber(reviewCount);
  const opportunityScore = scoreOpportunity(index, reviewNumber, isAd);
  const competitionLevel = getCompetitionLevel(index, reviewNumber, isAd);
  const estimatedMargin = estimateMargin(price, isRocket, isAd);
  const entryDifficulty = competitionLevel === "낮음" ? "쉬움" : competitionLevel === "보통" ? "보통" : "어려움";

  return {
    id: createProductId(productUrl, productName, index),
    productName,
    price: formatWon(price),
    reviewCount: reviewCount || "0",
    rating: rating || "-",
    thumbnail,
    productUrl,
    sellerName: "쿠팡 검색 결과",
    category: inferFashionCategory(keyword, productName),
    isRocket,
    isRocketGrowth,
    isAd,
    opportunityScore,
    estimatedMargin,
    competitionLevel,
    reviewStrength: reviewNumber >= 1000 ? "강함" : reviewNumber >= 200 ? "보통" : "낮음",
    entryDifficulty,
    recommendation: createRecommendation(opportunityScore, competitionLevel, estimatedMargin),
  };
}

export function toAbsoluteCoupangUrl(url: string) {
  return normalizeUrl(url);
}

function matchFirst(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1] ?? "";
}

function cleanText(value: string) {
  return decodeHtml(stripTags(value)).replace(/\s+/g, " ").trim();
}

function stripTags(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${COUPANG_ORIGIN}${url}`;
  return url;
}

function normalizeImageUrl(url: string) {
  const normalized = normalizeUrl(url);
  return normalized || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85";
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWon(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return value || "-";
  return `${Number(digits).toLocaleString("ko-KR")}원`;
}

function scoreOpportunity(index: number, reviewCount: number, isAd: boolean) {
  const reviewPenalty = reviewCount > 5000 ? 8 : reviewCount > 1000 ? 4 : 0;
  const adPenalty = isAd ? 4 : 0;
  return Math.max(60, 96 - index * 3 - reviewPenalty - adPenalty);
}

function getCompetitionLevel(index: number, reviewCount: number, isAd: boolean) {
  if (isAd || reviewCount > 5000 || index < 2) return "높음";
  if (reviewCount > 1000 || index < 6) return "보통";
  return "낮음";
}

function estimateMargin(price: string, isRocket: boolean, isAd: boolean) {
  const amount = parseNumber(price);
  if (amount >= 40000 && !isAd) return "높음";
  if (amount >= 25000 || isRocket) return "보통";
  return "낮음";
}

function inferFashionCategory(keyword: string, productName: string) {
  const text = `${keyword} ${productName}`;
  if (/스커트|치마/.test(text)) return "스커트";
  if (/셋업/.test(text)) return "셋업";
  if (/원피스/.test(text)) return "원피스";
  if (/슬랙스|팬츠|바지/.test(text)) return "팬츠";
  if (/블라우스|티셔츠|니트|상의/.test(text)) return "상의";
  return "여성패션";
}

function createRecommendation(score: number, competitionLevel: string, estimatedMargin: string) {
  if (score >= 88 && competitionLevel !== "높음") {
    return `진입 후보입니다. 예상 마진은 ${estimatedMargin}이고 경쟁 강도는 ${competitionLevel}입니다.`;
  }
  if (competitionLevel === "높음") {
    return "상위 경쟁이 강합니다. 리뷰 불만을 먼저 분석한 뒤 진입하세요.";
  }
  return "테스트 진입이 가능합니다. 썸네일과 상세페이지 차별화가 필요합니다.";
}

function createProductId(productUrl: string, productName: string, index: number) {
  const productId = productUrl.match(/products\/(\d+)/)?.[1];
  if (productId) return `coupang-${productId}`;
  return `coupang-${index}-${productName.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").slice(0, 40)}`;
}
