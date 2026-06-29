import type { CoupangOpportunity } from "@/lib/types";
import { BriefBox, SectionHeading } from "./PlanningPrimitives";

export function CEORecommendation({ product }: { product: CoupangOpportunity }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section>
        <SectionHeading eyebrow="CEO 비서 AI" title="CEO 실행 제안" text="CEO 비서 AI가 각 디렉터의 의견을 모아 대표님이 바로 결정할 수 있는 제안으로 정리했습니다." />
        <p className="mt-5 text-lg leading-8 text-[#3E3832]">{product.recommendation}</p>
      </section>
      <aside className="grid gap-3">
        <BriefBox title="결정 방향" text={product.strongBuy ? "기획을 시작하되 확장 전 출처 데이터를 검증하세요." : "더 강한 출처 데이터가 연결된 뒤 다시 검토하세요."} />
        <BriefBox title="첫 실행" text={product.actionPlan[0]} />
        <BriefBox title="실행 원칙" text="출처 제한 근거만으로 재고나 광고비를 확정하지 마세요." />
      </aside>
    </div>
  );
}
