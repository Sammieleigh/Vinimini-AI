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
      <div className="mt-5 space-y-4">
        {members.map((member) => (
          <div key={member.role} className="flex items-start justify-between gap-4 border-b border-[#EFE8DE] pb-4 last:border-0 last:pb-0">
            <div>
              <p className="font-medium">{member.role}</p>
              <p className="mt-1 text-sm leading-6 text-[#6F6A63]">{member.briefing}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[#E5DED5] px-3 py-1 text-xs text-[#6F6A63]">
              {statusLabels[member.status]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-sm border border-[#111111] bg-[#111111] p-5 text-[#F6F2EC]">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#C9BDAF]">Executive Consensus</p>
        <p className="mt-3 text-sm leading-7 text-[#E8DED1]">
          오늘의 합의는 명확합니다. 와이드 슬랙스 상세페이지를 먼저 완성하고, 썸네일 A/B 테스트는 그 다음에 실행하세요.
        </p>
      </div>
    </SectionCard>
  );
}
