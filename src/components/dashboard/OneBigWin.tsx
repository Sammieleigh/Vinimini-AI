import Link from "next/link";

export function OneBigWin() {
  return (
    <section className="rounded-sm border border-[#111111] bg-[#111111] p-8 text-[#F6F2EC]">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#C9BDAF]">오늘 가장 중요한 목표</p>
      <h2 className="mt-8 text-3xl font-semibold leading-tight">와이드 슬랙스 상세페이지 완성</h2>
      <p className="mt-5 text-sm leading-7 text-[#E8DED1]">
        오늘은 이 일 하나만 끝내도 충분합니다. 실측표, 기장 안내, 원단 설명을 첫 화면에 고정하세요.
      </p>
      <Link
        href="/planning/wide-slacks"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-sm bg-[#F6F2EC] px-5 text-sm font-semibold text-[#111111]"
      >
        회의 시작
      </Link>
    </section>
  );
}
