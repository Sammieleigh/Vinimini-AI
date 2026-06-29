export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8277]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal">{title}</h2>
      {text ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625B53]">{text}</p> : null}
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

export function BriefBox({ title, text }: { title: string; text: string }) {
  return (
    <article className="border border-[#D9D0C4] bg-[#FBFAF7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8277]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#625B53]">{text}</p>
    </article>
  );
}

export function SourceLimitedNotice() {
  return (
    <div className="border border-[#111111] bg-[#111111] p-4 text-sm leading-6 text-[#F4EFE7]">
      출처 제한: OpenAI는 연결된 근거를 분석, 점수화, 요약, 추천할 수 있습니다. 하지만 존재하지 않는 쿠팡 상품 정보, 리뷰 수, 가격,
      판매량, 실시간 랭킹을 만들어내면 안 됩니다. 실행 전 검증된 추가 데이터가 필요합니다.
    </div>
  );
}
