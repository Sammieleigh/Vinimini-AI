import type { CoupangOpportunity } from "@/lib/types";
import { Metric, SectionHeading } from "./PlanningPrimitives";

export function ExpectedResult({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="데이터 디렉터 AI" title="예상 결과" text="예상 결과는 기획 추정치이며, 쿠팡 실시간 성과 데이터가 아닙니다." />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="클릭률" value={product.expectedResult.ctr} />
        <Metric label="구매전환율" value={product.expectedResult.conversion} />
        <Metric label="마진" value={product.expectedResult.margin} />
        <Metric label="일 판매량" value={product.expectedResult.dailySales} />
        <Metric label="반품률" value={product.expectedResult.returnRate} />
        <Metric label="점수 변화" value={product.expectedResult.scoreChange} />
      </div>
    </div>
  );
}
