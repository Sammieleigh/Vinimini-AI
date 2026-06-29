import type { CoupangOpportunity } from "@/lib/types";
import { SectionHeading } from "./PlanningPrimitives";

export function MeetingHistory({ product }: { product: CoupangOpportunity }) {
  const meeting = [
    { time: "00:00", department: "마켓 디렉터 AI", summary: `${product.category} 후보를 기회 검토 안건으로 올렸습니다.` },
    { time: "00:10", department: "트렌드 AI", summary: "실행 전 네이버 데이터랩과 트렌드 데이터로 수요를 확인해야 합니다." },
    { time: "00:20", department: "OpenAI 분석", summary: "비용 절감을 위해 모든 후보를 배치 방식의 경영진 분석으로 함께 검토합니다." },
    { time: "00:30", department: "마케팅 디렉터 AI", summary: "광고 경쟁과 클릭 가능성을 논의했습니다." },
    { time: "00:40", department: "크리에이티브 디렉터 AI", summary: "썸네일과 상세페이지 개선 가능성을 평가했습니다." },
    { time: "00:50", department: "가격 전략 디렉터 AI", summary: "마진, 권장 판매가, 진입 난이도를 보수적으로 검토했습니다." },
    { time: "01:00", department: "CEO 비서 AI 요약", summary: product.recommendation },
  ];

  return (
    <div>
      <SectionHeading eyebrow="자정 전략 회의실" title="회의 기록" text="대표님은 이 회의에 참석하지 않습니다. AI 경영진이 아침 전에 먼저 준비합니다." />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {meeting.map((step) => (
          <article key={`${step.time}-${step.department}`} className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
            <p className="text-xs font-semibold text-[#8A8277]">{step.time}</p>
            <h3 className="mt-2 text-base font-semibold">{step.department}</h3>
            <p className="mt-2 text-sm leading-6 text-[#625B53]">{step.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
