import type { CoupangOpportunity } from "@/lib/types";

export function ExecutiveSummary({ product }: { product: CoupangOpportunity }) {
  return (
    <section className="rounded-sm border border-[#111111] bg-[#111111] p-7 text-[#F6F2EC]">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#C9BDAF]">AI 경영진 30초 요약</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <p className="text-6xl font-semibold">{product.opportunityScore}</p>
          <p className="mt-2 text-sm text-[#E8DED1]">추천도 / 100</p>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">{product.productName}</h1>
          <p className="mt-4 text-sm leading-7 text-[#E8DED1]">{product.whyNow}</p>
          <div className="mt-5 grid gap-3 text-sm text-[#E8DED1] sm:grid-cols-3">
            <p>CTR {product.expectedResult.ctr}</p>
            <p>구매전환율 {product.expectedResult.conversion}</p>
            <p>반품률 {product.expectedResult.returnRate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
