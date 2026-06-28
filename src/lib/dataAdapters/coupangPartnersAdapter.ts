import { createHmac } from "crypto";
import type { AdapterResult, PartnerProduct } from "./types";

const COUPANG_PARTNERS_ORIGIN = "https://api-gateway.coupang.com";
const PRODUCT_SEARCH_PATH = "/v2/providers/affiliate_open_api/apis/openapi/products/search";

type CoupangPartnersProduct = {
  productName?: string;
  productPrice?: number;
  productImage?: string;
  productUrl?: string;
  categoryName?: string;
  brand?: string;
  brandName?: string;
};

type CoupangPartnersResponse = {
  data?: {
    productData?: CoupangPartnersProduct[];
  };
};

export async function fetchCoupangPartnersProducts(keyword: string): Promise<AdapterResult<PartnerProduct[]>> {
  const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY;
  const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY;
  const normalizedKeyword = keyword.trim();

  if (!accessKey || !secretKey) {
    return {
      source: "Coupang Partners API",
      status: "API NOT CONNECTED",
      keyword: normalizedKeyword,
      message: "쿠팡 파트너스 키가 없어 COUPANG API NOT CONNECTED 상태로 표시합니다.",
      data: [],
      fetchedAt: null,
    };
  }

  const query = buildQuery({ keyword: normalizedKeyword, limit: "10" });
  const authorization = createCoupangAuthorization("GET", PRODUCT_SEARCH_PATH, query, accessKey, secretKey);

  try {
    const response = await fetch(`${COUPANG_PARTNERS_ORIGIN}${PRODUCT_SEARCH_PATH}?${query}`, {
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json;charset=UTF-8",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Coupang Partners API failed: ${response.status}`);
    }

    const payload = (await response.json()) as CoupangPartnersResponse;
    const products = payload.data?.productData ?? [];

    return {
      source: "Coupang Partners API",
      status: products.length ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: products.length
        ? "쿠팡 파트너스 상품 후보를 연결했습니다."
        : "쿠팡 파트너스 응답은 성공했지만 상품 후보가 비어 있습니다.",
      data: products.map(mapProduct),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Coupang Partners API",
      status: "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: `쿠팡 파트너스 호출에 실패해 SOURCE LIMITED 상태로 표시합니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}

function createCoupangAuthorization(method: string, path: string, query: string, accessKey: string, secretKey: string) {
  const signedDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const message = `${signedDate}${method}${path}${query}`;
  const signature = createHmac("sha256", secretKey).update(message).digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

function buildQuery(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

function mapProduct(product: CoupangPartnersProduct): PartnerProduct {
  return {
    productName: product.productName || "상품명 미제공",
    price: typeof product.productPrice === "number" ? `${product.productPrice.toLocaleString("ko-KR")}원` : "-",
    image: product.productImage || "",
    productUrl: product.productUrl || "",
    category: product.categoryName || "여성패션 후보",
    brand: product.brandName || product.brand || "브랜드 미제공",
  };
}
