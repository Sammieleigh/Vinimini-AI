import type { CoupangOpportunity } from "@/lib/types";
import { Metric, SectionHeading, SourceLimitedNotice } from "./PlanningPrimitives";

export function Pricing({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="가격 전략 디렉터 AI" title="가격 전략" text="실제 원가, 광고비, 전환율 데이터가 연결되기 전까지 가격 판단은 보수적으로 표시합니다." />
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <Metric label="예상 마진" value={product.expectedMargin} />
        <Metric label="광고비" value="출처 제한" />
        <Metric label="손익분기점" value="추가 데이터 필요" />
        <Metric label="권장 판매가" value={product.recommendedPrice} />
        <Metric label="진입 난이도" value={product.entryDifficulty} />
      </div>
      <div className="mt-5">
        <SourceLimitedNotice />
      </div>
    </div>
  );
}
