import type { CoupangOpportunity } from "@/lib/types";
import { BriefBox, SectionHeading } from "./PlanningPrimitives";

export function ReviewComplaints({ product }: { product: CoupangOpportunity }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section>
        <SectionHeading eyebrow="고객 인사이트 디렉터 AI" title="리뷰 불만 TOP5" text="검증된 리뷰 데이터가 연결되기 전까지 불만 항목은 기획 리스크로 다룹니다." />
        <ol className="mt-5 grid gap-3">
          {product.reviewComplaints.map((complaint, index) => (
            <li key={complaint} className="flex gap-3 border border-[#D9D0C4] bg-[#FBFAF7] p-3 text-sm">
              <span className="font-semibold">{index + 1}</span>
              <span className="leading-6 text-[#625B53]">{complaint}</span>
            </li>
          ))}
        </ol>
      </section>
      <aside className="grid gap-3">
        <BriefBox title="반품 원인" text={product.risk.reasons.join(" / ")} />
        <BriefBox title="고객 요구사항" text="구매자는 결제 전 핏, 원단, 비침 여부, 사이즈에 대한 근거가 필요합니다." />
        <BriefBox title="개선 우선순위" text="상세페이지 첫 화면에서 구매 불안을 먼저 제거하세요." />
      </aside>
    </div>
  );
}
