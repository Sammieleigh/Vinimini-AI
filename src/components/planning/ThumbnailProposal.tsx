import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading } from "./PlanningPrimitives";

export function ThumbnailProposal({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="크리에이티브 디렉터 AI" title="썸네일 제안" text="A/B/C 제안은 검증되지 않은 상품 주장을 만들지 않고 클릭 판단을 명확하게 만드는 데 집중합니다." />
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {product.viniminiConcepts.map((concept) => (
          <article key={concept.name} className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A8277]">{concept.name}안</p>
            <h3 className="mt-3 text-lg font-semibold">{concept.thumbnailDirection}</h3>
            <p className="mt-3 text-sm leading-6 text-[#625B53]">{concept.reason}</p>
            <p className="mt-3 text-sm font-semibold">예상 클릭률 {concept.expectedCtr}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
