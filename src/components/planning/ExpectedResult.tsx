import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function ExpectedResult({ product }: { product: CoupangOpportunity }) {
  const rows = [
    ["예상 CTR", product.expectedResult.ctr],
    ["구매전환율", product.expectedResult.conversion],
    ["예상 마진", product.expectedResult.margin],
    ["예상 일판매량", product.expectedResult.dailySales],
    ["예상 반품률", product.expectedResult.returnRate],
    ["예상 점수 상승", product.expectedResult.scoreChange],
  ];

  return (
    <SectionCard eyebrow="Expected Result" title="예상 성과">
      <div className="mt-5 grid grid-cols-2 gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
            <p className="text-xs text-[#6F6A63]">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
