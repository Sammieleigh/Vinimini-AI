import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading } from "./PlanningPrimitives";

const departments = [
  "마켓 디렉터 AI",
  "마케팅 디렉터 AI",
  "가격 전략 디렉터 AI",
  "크리에이티브 디렉터 AI",
  "고객 인사이트 디렉터 AI",
  "CEO 비서 AI",
];

export function AIDiscussion({ product }: { product: CoupangOpportunity }) {
  const discussion = [
    `마켓 디렉터: ${product.category} 후보는 검토 가치가 있지만 출처 품질은 아직 제한적입니다.`,
    `마케팅 디렉터: 경쟁 강도는 ${product.lowCompetition}입니다. 광고 진입은 작은 예산으로 검증해야 합니다.`,
    `가격 전략 디렉터: 예상 마진은 ${product.expectedMargin}입니다. 실제 원가와 광고 데이터 확인이 필요합니다.`,
    "크리에이티브 디렉터: 썸네일과 상세페이지 첫 화면 개선으로 구매 불안을 줄일 수 있습니다.",
    "고객 인사이트 디렉터: 리뷰 불만은 핏, 원단, 비침, 사이즈 안내 불안에 집중되어 있습니다.",
    "CEO 비서: 재고 확정이 아니라 상품기획 회의실 검토 대상으로 승인합니다.",
  ];

  return (
    <div>
      <SectionHeading
        eyebrow="경영진 분석 엔진"
        title="AI 회의록"
        text="OpenAI는 단순 LLM이 아니라 경영진 추론 레이어입니다. 연결된 네이버 데이터랩, 네이버 검색광고, 쿠팡 API, 윙 API, 구글 트렌드, 공개 데이터를 근거로 토론합니다."
      />
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {discussion.map((line, index) => (
          <article key={departments[index]} className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A8277]">{departments[index]}</p>
            <p className="mt-3 text-sm leading-6 text-[#625B53]">{line}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
