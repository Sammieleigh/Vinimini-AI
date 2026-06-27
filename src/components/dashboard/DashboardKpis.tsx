const kpis = [
  {
    label: "오늘 가장 중요한 일",
    value: "상세페이지 완성",
    detail: "와이드 슬랙스 첫 화면 고정",
  },
  {
    label: "오늘 놓치면 안 되는 위험",
    value: "반품률",
    detail: "허리, 기장, 원단 설명 부족",
  },
  {
    label: "AI 경영진 합의",
    value: "전환율 우선",
    detail: "신규 탐색보다 상세페이지 개선",
  },
  {
    label: "오늘 매출 목표",
    value: "720,000원",
    detail: "예상 18개 판매 기준",
  },
  {
    label: "오늘 광고비",
    value: "30,000원",
    detail: "A/B 테스트 검증 예산",
  },
  {
    label: "오늘 예상 판매량",
    value: "18개",
    detail: "상세페이지 개선 후 기준",
  },
  {
    label: "이번주 집중 상품",
    value: "와이드 슬랙스",
    detail: "여성패션 팬츠 카테고리",
  },
];

export function DashboardKpis() {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="CEO Dashboard KPI">
      {kpis.map((kpi, index) => (
        <article
          key={kpi.label}
          className={`rounded-sm border p-5 transition ${
            index === 0
              ? "border-[#111111] bg-[#111111] text-[#F6F2EC] xl:col-span-2"
              : "border-[#E5DED5] bg-white text-[#111111] hover:border-[#111111]"
          }`}
        >
          <p className={`text-xs font-medium uppercase tracking-[0.2em] ${index === 0 ? "text-[#C9BDAF]" : "text-[#6F6A63]"}`}>
            {kpi.label}
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-normal">{kpi.value}</p>
          <p className={`mt-2 text-sm leading-6 ${index === 0 ? "text-[#E8DED1]" : "text-[#6F6A63]"}`}>{kpi.detail}</p>
        </article>
      ))}
    </section>
  );
}
