import { Alerts } from "./Alerts";
import { CeoTasks } from "./CeoTasks";
import { ExecutiveTeam } from "./ExecutiveTeam";
import { HeroSection } from "./HeroSection";
import { MorningBrief } from "./MorningBrief";
import { OneBigWin } from "./OneBigWin";
import { OpportunityTop10 } from "./OpportunityTop10";
import { RecommendedActions } from "./RecommendedActions";
import { ceoTasks, executiveTeam } from "@/lib/data";

export function DashboardHome() {
  return (
    <main className="min-h-screen bg-[#F6F2EC] text-[#111111]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <HeroSection />
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <MorningBrief />
          <OneBigWin />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <CeoTasks initialTasks={ceoTasks} />
          <div className="grid gap-5">
            <ExecutiveTeam members={executiveTeam} />
            <Alerts />
            <RecommendedActions />
          </div>
        </div>
        <OpportunityTop10 />
      </div>
    </main>
  );
}
