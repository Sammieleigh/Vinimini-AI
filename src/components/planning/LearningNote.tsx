import type { CoupangOpportunity } from "@/lib/types";
import { BriefBox, SectionHeading } from "./PlanningPrimitives";

export function LearningNote({ product }: { product: CoupangOpportunity }) {
  return (
    <div>
      <SectionHeading eyebrow="학습 AI" title="AI 학습 노트" text="모든 회의는 다음 회의를 더 똑똑하고 더 비용 효율적으로 만들어야 합니다." />
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <BriefBox title="AI가 배운 점" text={product.learningNote} />
        <BriefBox title="다음 분석 개선점" text="광고 난이도, 리뷰 리스크, 크리에이티브 개선 가능성, 출처 품질의 가중치를 높입니다." />
        <BriefBox title="다음 회의 원칙" text="동일 입력은 캐시된 경영진 분석을 재사용합니다. 데이터 변경, 날짜 변경, 새로 분석 요청이 있을 때만 재분석합니다." />
      </div>
    </div>
  );
}
