"use client";

import {
  PHASE_DOT,
  PHASE_LABEL,
  PHASE_STATE_COLOR,
  PHASE_STATE_LABEL,
} from "@/lib/labels";
import type { Phase, PhaseState, PhaseType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PhaseChip({
  type,
  state,
  className,
}: {
  type: PhaseType;
  state: PhaseState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1",
        PHASE_STATE_COLOR[state],
        className
      )}
      title={`${PHASE_LABEL[type]} : ${PHASE_STATE_LABEL[state]}`}
    >
      <span className={cn("size-1.5 rounded-full", PHASE_DOT[type])} />
      {PHASE_LABEL[type]}
    </span>
  );
}

export function PhaseDot({
  type,
  state,
  size = 14,
}: {
  type: PhaseType;
  state: PhaseState;
  size?: number;
}) {
  const intensity =
    state === "done"
      ? "opacity-100 ring-2 ring-emerald-400/60"
      : state === "review"
        ? "opacity-90 ring-2 ring-violet-400/50"
        : state === "in_progress"
          ? "opacity-90 ring-2 ring-amber-400/50"
          : state === "todo"
            ? "opacity-50"
            : "opacity-25";
  return (
    <span
      className={cn(
        "inline-block rounded-full",
        PHASE_DOT[type],
        intensity
      )}
      style={{ width: size, height: size }}
      title={`${PHASE_LABEL[type]} : ${PHASE_STATE_LABEL[state]}`}
    />
  );
}

export function phaseProgress(phases: Phase[]): number {
  if (phases.length === 0) return 0;
  const map: Record<PhaseState, number> = {
    blocked: 0,
    todo: 0,
    in_progress: 0.5,
    review: 0.85,
    done: 1,
  };
  const sum = phases.reduce((s, p) => s + map[p.state], 0);
  return Math.round((sum / phases.length) * 100);
}
