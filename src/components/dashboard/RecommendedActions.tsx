import Link from "next/link";
import { SectionCard } from "@/components/ui/SectionCard";

const actions = [
  "상세페이지 첫 화면에 핏, 원단, 실측표를 배치합니다.",
  "허리와 기장 불만을 반품 예방 문구로 전환합니다.",
  "상세페이지 수정 후 썸네일 A/B 테스트를 생성합니다.",
];

export function RecommendedActions() {
  return (
    <SectionCard eyebrow="Recommended Actions" title="AI 추천 실행 전략">
      <div className="mt-5 space-y-3">
        {actions.map((action, index) => (
          <div key={action} className="flex gap-4 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
            <span className="text-sm font-semibold text-[#111111]">{index + 1}</span>
            <p className="text-sm leading-6 text-[#6F6A63]">{action}</p>
          </div>
        ))}
      </div>
      <Link
        href="/planning/wide-slacks"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm bg-[#111111] px-5 text-sm font-semibold text-[#F6F2EC]"
      >
        상품기획 회의 시작
      </Link>
    </SectionCard>
  );
}
