import type { ExecutiveMember, ExecutiveStatus } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

const statusLabels: Record<ExecutiveStatus, string> = {
  Ready: "준비 완료",
  Warning: "주의",
  Critical: "긴급",
};

export function ExecutiveTeam({ members }: { members: ExecutiveMember[] }) {
  return (
    <SectionCard eyebrow="AI 경영진 브리핑" title="5명의 AI가 한 줄로 보고합니다.">
      <div className="mt-5 grid gap-3">
        {members.map((member) => (
          <div key={member.role} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium">{member.role}</p>
              <span className="shrink-0 rounded-full border border-[#E5DED5] bg-white px-3 py-1 text-xs text-[#6F6A63]">
                {statusLabels[member.status]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6F6A63]">{member.briefing}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-sm border border-[#111111] bg-[#111111] p-5 text-[#F6F2EC]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#C9BDAF]">AI 경영진 합의</p>
            <p className="mt-3 text-sm leading-7 text-[#E8DED1]">
              오늘의 합의는 명확합니다. 와이드 슬랙스 상세페이지를 먼저 완성하고, 썸네일 A/B 테스트는 그 다음에 실행하세요.
            </p>
          </div>
          <span className="rounded-full border border-[#C9BDAF] px-3 py-1 text-xs text-[#E8DED1]">오늘 실행</span>
        </div>
      </div>
    </SectionCard>
  );
}
