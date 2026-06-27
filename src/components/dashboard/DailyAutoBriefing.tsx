import { dailyAutoBriefing, dailyBriefingStatus } from "@/lib/dailyBriefing";
import { SectionCard } from "@/components/ui/SectionCard";

const briefingBlocks = [
  {
    title: "오늘 급상승 여성패션 키워드 TOP10",
    items: dailyAutoBriefing.risingKeywords,
  },
  {
    title: "오늘 진입 추천 상품 TOP10",
    items: dailyAutoBriefing.recommendedProducts,
  },
  {
    title: "경쟁이 심해진 상품",
    items: dailyAutoBriefing.crowdedProducts,
  },
];

export function DailyAutoBriefing() {
  return (
    <SectionCard eyebrow="Daily Auto Briefing" title="AI가 먼저 정리한 오늘의 쿠팡 여성패션 브리핑">
      <div className="mt-5 rounded-sm border border-[#111111] bg-[#111111] p-5 text-[#F6F2EC]">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#C9BDAF]">{dailyBriefingStatus.label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-normal">이번 주 가장 먼저 등록해야 할 상품</p>
        <p className="mt-2 text-lg text-[#F6F2EC]">{dailyAutoBriefing.firstToLaunch}</p>
        <p className="mt-3 text-sm leading-6 text-[#C9BDAF]">{dailyBriefingStatus.detail}</p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {briefingBlocks.map((block) => (
          <article key={block.title} className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
            <h3 className="text-sm font-semibold text-[#111111]">{block.title}</h3>
            <ol className="mt-3 grid gap-2">
              {block.items.map((item, index) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#6F6A63]">
                  <span className="text-xs font-semibold text-[#111111]">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
