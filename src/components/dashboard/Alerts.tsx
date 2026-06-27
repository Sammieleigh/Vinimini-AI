import { SectionCard } from "@/components/ui/SectionCard";

export function Alerts() {
  return (
    <SectionCard eyebrow="AI 알림" title="오늘 놓치면 안 되는 신호">
      <div className="mt-5 grid gap-3">
        {["광고 집행 전 썸네일 A/B 테스트를 먼저 생성하세요.", "상위 경쟁상품 리뷰에서 허리와 기장 불만이 반복됩니다.", "쿠팡 등록 전 실측표 위치를 상세페이지 상단으로 올리세요."].map((alert) => (
          <p key={alert} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4 text-sm leading-6 text-[#6F6A63]">
            {alert}
          </p>
        ))}
      </div>
    </SectionCard>
  );
}
