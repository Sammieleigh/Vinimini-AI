import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function ViniminiProposal({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="VINIMINI Proposal" title="VINIMINI 제안 A/B/C">
      <div className="mt-5 space-y-4">
        {product.viniminiConcepts.map((concept) => (
          <div key={concept.name} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{concept.name}안</p>
              <p className="text-sm text-[#6F6A63]">예상 클릭률 {concept.expectedCtr}</p>
            </div>
            <p className="mt-3 text-sm font-medium">{concept.thumbnailDirection}</p>
            <p className="mt-2 text-sm leading-6 text-[#6F6A63]">{concept.reason}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[#6F6A63]">{concept.purpose}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
