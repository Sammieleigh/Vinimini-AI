import type { AdapterResult, NaverShoppingProduct } from "./types";

const NAVER_SHOPPING_SEARCH_URL = "https://openapi.naver.com/v1/search/shop.json";

type NaverShoppingSearchResponse = {
  items?: Array<{
    title?: string;
    link?: string;
    image?: string;
    lprice?: string;
    mallName?: string;
    brand?: string;
    category1?: string;
    category2?: string;
    category3?: string;
    category4?: string;
  }>;
};

export async function fetchNaverShoppingProducts(keyword: string): Promise<AdapterResult<NaverShoppingProduct[]>> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const normalizedKeyword = keyword.trim();

  if (!clientId || !clientSecret) {
    return {
      source: "Naver Shopping Search API",
      status: "API NOT CONNECTED",
      keyword: normalizedKeyword,
      message: "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없어 네이버 쇼핑 검색 API를 호출하지 않았습니다.",
      data: [],
      fetchedAt: null,
    };
  }

  try {
    const url = new URL(NAVER_SHOPPING_SEARCH_URL);
    url.searchParams.set("query", normalizedKeyword);
    url.searchParams.set("display", "10");
    url.searchParams.set("start", "1");
    url.searchParams.set("sort", "sim");

    const response = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Naver Shopping Search failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as NaverShoppingSearchResponse;
    const products = payload.items ?? [];

    return {
      source: "Naver Shopping Search API",
      status: products.length ? "LIVE DATA" : "PARTIAL DATA",
      keyword: normalizedKeyword,
      message: products.length
        ? "네이버 쇼핑 검색 API에서 상품명, 가격, 쇼핑몰명, 브랜드, 링크를 확인했습니다."
        : "네이버 쇼핑 검색 API 응답은 성공했지만 상품 데이터가 비어 있습니다.",
      data: products.map(mapShoppingProduct),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "Naver Shopping Search API",
      status: "SOURCE LIMITED",
      keyword: normalizedKeyword,
      message: `네이버 쇼핑 검색 API 호출에 실패했습니다. ${error instanceof Error ? error.message : ""}`.trim(),
      data: [],
      fetchedAt: new Date().toISOString(),
    };
  }
}

function mapShoppingProduct(product: NonNullable<NaverShoppingSearchResponse["items"]>[number]): NaverShoppingProduct {
  return {
    productName: stripHtml(product.title || "상품명 미제공"),
    price: product.lprice ? `${Number(product.lprice).toLocaleString("ko-KR")}원` : "-",
    image: product.image || "",
    productUrl: product.link || "",
    mallName: product.mallName || "쇼핑몰명 미제공",
    brand: product.brand || "브랜드 미제공",
    category: [product.category1, product.category2, product.category3, product.category4].filter(Boolean).join(" > ") || "카테고리 미제공",
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}
