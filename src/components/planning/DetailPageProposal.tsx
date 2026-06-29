import type { CoupangOpportunity } from "@/lib/types";
import { BriefBox, SectionHeading } from "./PlanningPrimitives";

export function DetailPageProposal({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="크리에이티브 디렉터 AI" title="상세페이지 제안" text="광고비를 쓰기 전에 상세페이지 첫 화면이 구매 결정을 더 쉽게 만들어야 합니다." />
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <BriefBox title="첫 화면" text={product.planningActions.detailPage} />
        <BriefBox title="문구" text={product.planningActions.copy} />
        <BriefBox title="사이즈 안내" text={product.planningActions.sizeChart} />
        <BriefBox title="신규 이미지" text={product.planningActions.newImage} />
        <BriefBox title="반품 감소" text={product.planningActions.returnReduction} />
        <BriefBox title="출처 원칙" text="모든 주장은 검증된 상품 데이터로 뒷받침되어야 합니다. 부족하면 출처 제한으로 표시합니다." />
      </div>
    </div>
  );
}
