import { SectionCard } from "@/components/ui/SectionCard";

export function MorningBrief() {
  return (
    <SectionCard eyebrow="AI 아침 브리핑" title="오늘 할 일은 이미 정해졌습니다.">
      <p className="mt-4 text-base leading-8 text-[#6F6A63]">
        오늘은 와이드 슬랙스 상세페이지를 완성하세요. 신규 상품을 더 찾는 것보다, 이미 기회 점수가 높은 상품의 구매
        장벽을 낮추는 일이 더 빠른 성과로 이어집니다.
      </p>
    </SectionCard>
  );
}
