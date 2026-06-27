import type { CoupangOpportunity } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

export function ActionPlan({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="Action Plan" title="실행 계획">
      <div className="mt-5 space-y-3">
        {product.actionPlan.map((step, index) => (
          <label key={step} className="flex items-center gap-3 text-sm text-[#6F6A63]">
            <input type="checkbox" className="h-4 w-4 accent-[#111111]" />
            <span>
              Step {index + 1}. {step}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-6 space-y-3 text-sm leading-6 text-[#6F6A63]">
        <p>썸네일 개선: {product.planningActions.thumbnail}</p>
        <p>상세페이지 개선: {product.planningActions.detailPage}</p>
        <p>카피 문구 개선: {product.planningActions.copy}</p>
        <p>실측표 위치: {product.planningActions.sizeChart}</p>
        <p>신규 이미지 생성: {product.planningActions.newImage}</p>
        <p>반품률 감소 전략: {product.planningActions.returnReduction}</p>
      </div>
    </SectionCard>
  );
}
