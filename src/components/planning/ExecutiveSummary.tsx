import type { CoupangOpportunity } from "@/lib/types";
import { BriefBox, Metric, SectionHeading, SourceLimitedNotice } from "./PlanningPrimitives";

export function ExecutiveSummary({ product }: { product: CoupangOpportunity }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section>
        <SectionHeading
          eyebrow="30초 요약"
          title="경영진 요약"
          text="AI 경영진이 대표님이 가장 먼저 봐야 할 의사결정 신호만 압축했습니다."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="기회 점수" value={`${product.opportunityScore}/100`} />
          <Metric label="진입 난이도" value={product.entryDifficulty} />
          <Metric label="신뢰도" value={`${product.confidence.percent}%`} />
        </div>
        <p className="mt-5 text-sm leading-7 text-[#625B53]">{product.recommendation}</p>
      </section>
      <aside className="grid gap-3">
        <BriefBox title="지금 추천하는 이유" text={product.whyNow} />
        <BriefBox title="적극 추천 이유" text={product.reasons.slice(0, 3).join(" / ")} />
        <SourceLimitedNotice />
      </aside>
    </div>
  );
}
