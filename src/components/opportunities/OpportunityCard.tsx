import Link from "next/link";
import type { CoupangOpportunity } from "@/lib/types";

export function OpportunityCard({ item, index }: { item: CoupangOpportunity; index: number }) {
  const sourceBadges =
    item.dataSource === "coupang"
      ? ["COUPANG PUBLIC WEB", "VERIFIED INFORMATION", "AI ANALYSIS"]
      : ["COUPANG PUBLIC WEB", "COUPANG ADS TREND INSIGHTS", "OPENAI MARKET RESEARCH", "SOURCE LIMITED"];

  return (
    <Link
      href={`/planning/${item.id}`}
      className="grid gap-5 border border-[#D9D0C4] bg-white p-5 transition hover:border-[#111111] lg:grid-cols-[72px_1fr_260px]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#111111] text-sm font-semibold">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8A8277]">부서 브리핑</p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-normal">{item.productName}</h2>
          {item.strongBuy ? <span className="rounded-full border border-[#111111] px-3 py-1 text-xs font-medium">적극 추천</span> : null}
          {sourceBadges.map((badge) => (
            <span
              key={`${item.id}-${badge}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                badge === "COUPANG PUBLIC WEB" ? "border-[#111111] bg-[#111111] text-[#F6F2EC]" : "border-[#D9D0C4] text-[#625B53]"
              }`}
            >
              {badge}
            </span>
          ))}
          {item.isRocket ? <span className="rounded-full border border-[#D9D0C4] px-3 py-1 text-xs text-[#625B53]">로켓 신호</span> : null}
          {item.isAd ? <span className="rounded-full border border-[#D9D0C4] px-3 py-1 text-xs text-[#625B53]">광고 신호</span> : null}
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625B53]">
          <span className="font-semibold text-[#111111]">지금 추천하는 이유:</span> {item.whyNow}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DecisionLine label="쿠팡 리서치 우선순위" value="쿠팡 공개 상품 페이지와 쿠팡 Ads Trend Insights를 먼저 확인합니다." />
          <DecisionLine label="경쟁 강도" value={`${item.lowCompetition} · 경쟁 후보 ${item.competitorCount}개`} />
          <DecisionLine label="CEO 실행 제안" value={item.actionPlan[0] ?? item.recommendation} />
          <DecisionLine label="신뢰도" value={`${item.confidence.percent}% · ${item.confidence.evidence[0] ?? "추가 근거 필요"}`} />
        </div>

        <p className="mt-3 text-sm font-medium text-[#111111]">경영진 근거: {item.reasons.slice(0, 3).join(" · ")}</p>
        <p className="mt-2 text-xs text-[#625B53]">
          Planning Room에서 OpenAI Market Research Engine이 쿠팡 공개 정보를 우선 조사하고, 필요한 경우 다른 공개 소스로 분석 품질을 보강합니다.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm lg:grid-cols-1">
        <Metric label="기회 점수" value={`${item.opportunityScore}`} />
        <Metric label="진입 난이도" value={item.entryDifficulty} />
        <Metric label="예상 마진" value={item.expectedMargin} />
      </div>
    </Link>
  );
}

function DecisionLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-[#D9D0C4] pl-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8277]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#625B53]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#D9D0C4] bg-[#FBFAF7] p-3">
      <p className="text-[11px] text-[#625B53]">{label}</p>
      <p className="mt-1 font-semibold text-[#111111]">{value}</p>
    </div>
  );
}
