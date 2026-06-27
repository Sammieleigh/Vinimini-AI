import { NextResponse } from "next/server";
import { fetchCoupangSearch } from "@/lib/coupang";
import { mapCoupangProductToOpportunity } from "@/lib/opportunityMapper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") ?? "와이드 슬랙스";

  try {
    const products = await fetchCoupangSearch(keyword);
    const opportunities = products.map(mapCoupangProductToOpportunity);

    return NextResponse.json({
      ok: true,
      keyword,
      source: "coupang",
      count: opportunities.length,
      products,
      opportunities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        keyword,
        source: "coupang",
        error: error instanceof Error ? error.message : "Unknown Coupang search error",
        products: [],
        opportunities: [],
      },
      { status: 502 },
    );
  }
}
