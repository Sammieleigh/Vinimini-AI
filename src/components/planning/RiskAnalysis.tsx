import type { CoupangOpportunity, RiskLevel } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

const riskLabels: Record<RiskLevel, string> = {
  Low: "낮음",
  Medium: "보통",
  High: "높음",
};

export function RiskAnalysis({ product }: { product: CoupangOpportunity }) {
  return (
    <SectionCard eyebrow="Risk Analysis" title="위험 분석">
      <p className="mt-5 text-3xl font-semibold">{riskLabels[product.risk.level]}</p>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-[#6F6A63]">
        {product.risk.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="mt-6 rounded-sm border border-[#E5DED5] p-4">
        <p className="text-sm font-medium">AI 신뢰도 {product.confidence.percent}%</p>
        <p className="mt-2 text-sm leading-6 text-[#6F6A63]">{product.confidence.evidence.join(" · ")}</p>
      </div>
    </SectionCard>
  );
}
