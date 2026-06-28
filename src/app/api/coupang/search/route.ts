import { NextResponse } from "next/server";
import { fetchCoupangSearch } from "@/lib/coupang";
import { fetchCoupangOpenApiProducts, hasCoupangOpenApiCredentials } from "@/lib/coupangOpenApi";
import { mapCoupangProductToOpportunity } from "@/lib/opportunityMapper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") ?? "와이드 슬랙스";
  const hasOpenApiKeys = hasCoupangOpenApiCredentials();
  const source = hasOpenApiKeys ? "coupang-open-api" : "coupang-html";

  try {
    const products = source === "coupang-open-api" ? await fetchCoupangOpenApiProducts(keyword) : await fetchCoupangSearch(keyword);
    const opportunities = products.map(mapCoupangProductToOpportunity);

    return NextResponse.json({
      ok: true,
      keyword,
      source,
      dataStatus: "live-coupang-data",
      message: source === "coupang-open-api" ? "LIVE COUPANG DATA: WING OpenAPI 상품 목록 데이터를 연결했습니다." : "LIVE COUPANG DATA: 쿠팡 검색 HTML 데이터를 연결했습니다.",
      count: opportunities.length,
      products,
      opportunities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        keyword,
        source,
        dataStatus: getCoupangFailureStatus(error, hasOpenApiKeys),
        error: error instanceof Error ? error.message : "Unknown Coupang search error",
        message: getCoupangFailureMessage(error, hasOpenApiKeys),
        products: [],
        opportunities: [],
      },
      { status: 502 },
    );
  }
}

function getCoupangFailureStatus(error: unknown, hasOpenApiKeys: boolean) {
  const message = error instanceof Error ? error.message : "";

  if (!hasOpenApiKeys && message.includes("403")) return "coupang-html-403-blocked";
  if (!hasOpenApiKeys) return "official-api-keys-missing";
  if (/401|403|credentials|signature|unauthorized/i.test(message)) return "official-api-auth-failed";
  return "coupang-live-unavailable";
}

function getCoupangFailureMessage(error: unknown, hasOpenApiKeys: boolean) {
  const message = error instanceof Error ? error.message : "";

  if (!hasOpenApiKeys && message.includes("403")) {
    return "쿠팡 검색 HTML 요청이 403으로 차단되어 COUPANG API NOT CONNECTED 상태로 표시합니다.";
  }

  if (!hasOpenApiKeys) {
    return "공식 WING OpenAPI 키가 없어 COUPANG API NOT CONNECTED 상태로 표시합니다.";
  }

  if (/401|403|credentials|signature|unauthorized/i.test(message)) {
    return "공식 WING OpenAPI 인증에 실패해 COUPANG API NOT CONNECTED 상태로 표시합니다.";
  }

  return "쿠팡 LIVE DATA 연결에 실패해 SOURCE LIMITED 상태로 표시합니다.";
}
