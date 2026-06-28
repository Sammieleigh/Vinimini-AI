"use client";

import { useEffect, useMemo, useState } from "react";

type TrendPoint = {
  period: string;
  ratio: number;
};

type TrendResult = {
  source: string;
  status: "LIVE DATA" | "PARTIAL DATA" | "SOURCE LIMITED" | "API NOT CONNECTED" | "DISABLED";
  keyword: string;
  message: string;
  data: {
    keyword: string;
    trendPoints: TrendPoint[];
    growthRate: number;
    seasonality: string;
  } | null;
  fetchedAt: string | null;
};

type TrendResponse = {
  ok: boolean;
  status: TrendResult["status"];
  message: string;
  keywords: string[];
  results: TrendResult[];
};

const TEST_KEYWORDS = ["와이드슬랙스", "냉감팬츠", "여성반팔"];

export function NaverTrendPanel() {
  const [trendResponse, setTrendResponse] = useState<TrendResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const query = useMemo(() => TEST_KEYWORDS.join(","), []);

  useEffect(() => {
    let isMounted = true;

    async function loadTrends() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/naver/datalab/trends?keywords=${encodeURIComponent(query)}`);
        const data = (await response.json()) as TrendResponse;

        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        if (isMounted) setTrendResponse(data);
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : "네이버 트렌드 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTrends();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const status = trendResponse?.status ?? "PARTIAL DATA";

  return (
    <section className="rounded-sm border border-[#111111] bg-white p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#9B948B]">Naver DataLab</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal">네이버 검색어 트렌드 실시간 확인</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6F6A63]">
            테스트 키워드 와이드슬랙스, 냉감팬츠, 여성반팔의 최근 90일 주간 검색 트렌드를 네이버 데이터랩 API로 확인합니다.
          </p>
        </div>
        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
            status === "LIVE DATA" ? "border-[#111111] bg-[#111111] text-[#F6F2EC]" : "border-[#E5DED5] bg-[#FBFAF7] text-[#6F6A63]"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {isLoading
          ? TEST_KEYWORDS.map((keyword) => <TrendLoadingCard key={keyword} keyword={keyword} />)
          : trendResponse?.results.map((result) => <TrendCard key={result.keyword} result={result} />)}
      </div>

      {error || trendResponse?.message ? (
        <p className="mt-4 rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-3 text-sm leading-6 text-[#6F6A63]">
          {error || trendResponse?.message}
        </p>
      ) : null}
    </section>
  );
}

function TrendCard({ result }: { result: TrendResult }) {
  const points = result.data?.trendPoints.slice(-10) ?? [];
  const latest = points[points.length - 1]?.ratio ?? 0;

  return (
    <article className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-normal text-[#111111]">{result.keyword}</h3>
          <p className="mt-1 text-xs font-semibold text-[#6F6A63]">{result.status}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#9B948B]">Latest</p>
          <p className="mt-1 text-xl font-semibold text-[#111111]">{latest.toFixed(1)}</p>
        </div>
      </div>

      {result.data ? (
        <>
          <div className="mt-4 flex h-24 items-end gap-1 border-b border-[#E5DED5] pb-2">
            {points.map((point) => (
              <div key={`${result.keyword}-${point.period}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t-sm bg-[#111111]"
                  style={{ height: `${Math.max(8, point.ratio)}%` }}
                  title={`${point.period}: ${point.ratio}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Metric label="성장률" value={`${result.data.growthRate}%`} />
            <Metric label="판단" value={result.data.seasonality} />
          </div>
        </>
      ) : (
        <p className="mt-4 min-h-24 rounded-sm border border-[#E5DED5] bg-white p-3 text-sm leading-6 text-[#6F6A63]">{result.message}</p>
      )}
    </article>
  );
}

function TrendLoadingCard({ keyword }: { keyword: string }) {
  return (
    <article className="rounded-sm border border-[#E5DED5] bg-[#FBFAF7] p-4">
      <h3 className="text-lg font-semibold tracking-normal text-[#111111]">{keyword}</h3>
      <p className="mt-4 text-sm text-[#6F6A63]">네이버 데이터랩을 확인하는 중입니다.</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[#E5DED5] bg-white p-3">
      <p className="text-[11px] text-[#6F6A63]">{label}</p>
      <p className="mt-1 font-semibold text-[#111111]">{value}</p>
    </div>
  );
}
