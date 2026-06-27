import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function ReviewComplaints({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="Review Analysis" title="AI 리뷰 불만 TOP5">
      <ol className="mt-5 space-y-3">
        {product.reviewComplaints.map((complaint, index) => (
          <li key={complaint} className="flex gap-3 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-3 text-sm">
            <span className="font-semibold text-[#111111]">{index + 1}</span>
            <span className="leading-6 text-[#6F6A63]">{complaint}</span>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
