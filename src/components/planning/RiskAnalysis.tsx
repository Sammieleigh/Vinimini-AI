import type { CoupangOpportunity } from "@/lib/types";
import { Metric, SectionHeading } from "./PlanningPrimitives";

export function RiskAnalysis({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="리스크 디렉터 AI" title="리스크" text="대표님이 명확하게 결정할 수 있도록 실행 전에 리스크를 먼저 보여드립니다." />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="리스크 수준" value={product.risk.level === "Low" ? "낮음" : product.risk.level === "High" ? "높음" : "보통"} />
        <Metric label="리뷰 리스크" value="출처 제한" />
        <Metric label="경쟁 강도" value={product.lowCompetition} />
      </div>
      <div className="mt-5 grid gap-3">
        {product.risk.reasons.map((reason) => (
          <article key={reason} className="border border-[#D9D0C4] bg-[#FBFAF7] p-4 text-sm leading-6 text-[#625B53]">
            {reason}
          </article>
        ))}
      </div>
    </div>
  );
}
