import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading } from "./PlanningPrimitives";

export function ActionPlan({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="실행 계획" title="AI 우선 실행안" text="이 컴포넌트는 다음 흐름을 위해 유지합니다. 최종 결정은 CEO 실행 제안 탭에서 다룹니다." />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {product.actionPlan.map((step, index) => (
          <article key={step} className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
            <p className="text-sm font-semibold">
              {index + 1}. {step}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
