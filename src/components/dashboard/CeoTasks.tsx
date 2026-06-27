"use client";

import { useMemo, useState } from "react";
import type { CeoTask, Priority, TaskStatus } from "@/lib/types";
import { SectionCard } from "@/components/ui/SectionCard";

const priorityLabels: Record<Priority, string> = {
  High: "높음",
  Medium: "보통",
  Low: "낮음",
};

const statusLabels: Record<TaskStatus, string> = {
  Todo: "대기",
  "In Progress": "진행 중",
  Done: "완료",
};

export function CeoTasks({ initialTasks }: { initialTasks: CeoTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const progress = Math.round((completedTasks / tasks.length) * 100);
  const focusScore = useMemo(() => Math.min(100, 82 + completedTasks * 4), [completedTasks]);

  const toggleTask = (index: number) => {
    setTasks((current) =>
      current.map((task, taskIndex) =>
        taskIndex === index ? { ...task, status: task.status === "Done" ? "Todo" : "Done" } : task,
      ),
    );
  };

  return (
    <SectionCard eyebrow="오늘의 CEO 업무" title="우선순위 업무">
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[#6F6A63]">오늘의 진행률</p>
          <p className="mt-1 text-xl font-semibold">
            {completedTasks} / {tasks.length} Tasks
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#6F6A63]">CEO Focus Score</p>
          <p className="mt-1 text-2xl font-semibold">{focusScore} / 100</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EEE7DE]">
        <div className="h-full rounded-full bg-[#111111] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-6 space-y-3">
        {tasks.map((task, index) => (
          <label
            key={task.title}
            className="flex cursor-pointer items-start gap-4 rounded-sm border border-[#E5DED5] p-4 transition hover:border-[#111111]"
          >
            <input
              type="checkbox"
              checked={task.status === "Done"}
              onChange={() => toggleTask(index)}
              className="mt-1 h-4 w-4 accent-[#111111]"
            />
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{task.title}</span>
                <span className="rounded-full border border-[#E5DED5] px-2 py-1 text-xs text-[#6F6A63]">
                  {priorityLabels[task.priority]}
                </span>
                <span className="rounded-full border border-[#E5DED5] px-2 py-1 text-xs text-[#6F6A63]">
                  {statusLabels[task.status]}
                </span>
              </span>
              <span className="mt-2 block text-sm text-[#6F6A63]">
                예상 {task.estimatedTime} · 예상 효과: {task.businessImpact}
              </span>
            </span>
          </label>
        ))}
      </div>
    </SectionCard>
  );
}
