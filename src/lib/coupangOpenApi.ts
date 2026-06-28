import { createHmac } from "crypto";
import type { CoupangSearchProduct } from "./types";

const OPEN_API_ORIGIN = "https://api-gateway.coupang.com";
const DEFAULT_SELLER_PRODUCTS_PATH = "/v2/providers/seller_api/apis/api/v1/marketplace/seller-products";

type CoupangOpenApiItem = {
  sellerProductId?: number | string;
  sellerProductName?: string;
  displayCategoryCode?: number | string;
  categoryName?: string;
  salePrice?: number;
  maximumBuyCount?: number;
  brand?: string;
  brandName?: string;
  vendorItemName?: string;
  vendorName?: string;
  images?: Array<{ cdnPath?: string; vendorPath?: string }>;
  items?: Array<{
    itemName?: string;
    salePrice?: number;
    images?: Array<{ cdnPath?: string; vendorPath?: string }>;
  }>;
};

type CoupangOpenApiResponse = {
  data?: CoupangOpenApiItem[] | { content?: CoupangOpenApiItem[] };
};

export function hasCoupangOpenApiCredentials() {
  return Boolean(process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY);
}

export async function fetchCoupangOpenApiProducts(keyword: string): Promise<CoupangSearchProduct[]> {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("Coupang OpenAPI credentials are not configured.");
  }

  const path = process.env.COUPANG_OPEN_API_PRODUCTS_PATH || DEFAULT_SELLER_PRODUCTS_PATH;
  const query = buildQuery({
    keyword,
    maxPerPage: "20",
    ...(process.env.COUPANG_VENDOR_ID ? { vendorId: process.env.COUPANG_VENDOR_ID } : {}),
  });
  const authorization = createCoupangAuthorization("GET", path, query, accessKey, secretKey);

  const response = await fetch(`${OPEN_API_ORIGIN}${path}?${query}`, {
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json;charset=UTF-8",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Coupang OpenAPI failed: ${response.status}`);
  }

  const payload = (await response.json()) as CoupangOpenApiResponse;
  const rows = Array.isArray(payload.data) ? payload.data : payload.data?.content ?? [];

  return rows
    .filter((item) => getName(item).includes(keyword.trim()) || keyword.trim().length === 0)
    .map((item, index) => mapOpenApiItem(item, keyword, index))
    .slice(0, 10);
}

function createCoupangAuthorization(method: string, path: string, query: string, accessKey: string, secretKey: string) {
  const signedDate = createCoupangSignedDate(new Date());
  const message = `${signedDate}${method}${path}${query}`;
  const signature = createHmac("sha256", secretKey).update(message).digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

function createCoupangSignedDate(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return [
    date.getUTCFullYear().toString().slice(-2),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function buildQuery(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

function mapOpenApiItem(item: CoupangOpenApiItem, keyword: string, index: number): CoupangSearchProduct {
  const price = item.salePrice ?? item.items?.[0]?.salePrice ?? 0;
  const productName = getName(item);
  const category = item.categoryName || inferFashionCategory(keyword, productName);
  const productUrl = item.sellerProductId ? `https://wing.coupang.com/tenants/seller-web/seller-products/${item.sellerProductId}` : "";
  const opportunityScore = Math.max(62, 92 - index * 3);
  const competitionLevel = index < 3 ? "보통" : "낮음";
  const estimatedMargin = price >= 40000 ? "높음" : price >= 25000 ? "보통" : "낮음";

  return {
    id: `openapi-${item.sellerProductId ?? index}`,
    productName,
    price: price ? `${price.toLocaleString("ko-KR")}원` : "-",
    reviewCount: "공식 API 미제공",
    rating: "공식 API 미제공",
    thumbnail: normalizeImageUrl(item.images?.[0]?.cdnPath || item.images?.[0]?.vendorPath || item.items?.[0]?.images?.[0]?.cdnPath || ""),
    productUrl,
    sellerName: item.vendorName || item.brandName || item.brand || "쿠팡 WING",
    category,
    isRocket: false,
    isRocketGrowth: false,
    isAd: false,
    opportunityScore,
    estimatedMargin,
    competitionLevel,
    reviewStrength: "공식 API 미제공",
    entryDifficulty: competitionLevel === "낮음" ? "쉬움" : "보통",
    recommendation: `공식 OpenAPI 상품 데이터입니다. ${productName}은 여성패션 상품기획 후보로 검토할 수 있습니다.`,
  };
}

function getName(item: CoupangOpenApiItem) {
  return item.sellerProductName || item.vendorItemName || item.items?.[0]?.itemName || "상품명 미제공";
}

function normalizeImageUrl(url: string) {
  if (!url) return "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http")) return url;
  return `https:${url}`;
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
