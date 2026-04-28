"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserStack } from "@/components/user-avatar";
import { phaseProgress } from "@/components/phase-chip";
import { CalendarRange, Cpu, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function MachinesPage() {
  const machines = useStore((s) => s.machines);
  const productions = useStore((s) => s.productions);
  const phases = useStore((s) => s.phases);
  const users = useStore((s) => s.users);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">機種</h1>
          <p className="text-sm text-muted-foreground">
            開発中の遊技機タイトルと、その演出制作の全体像を把握します
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {machines.map((m) => {
          const myProductions = productions.filter((p) => p.machineId === m.id);
          const myPhases = phases.filter((ph) =>
            myProductions.some((p) => p.id === ph.productionId)
          );
          const overallPct = phaseProgress(myPhases);
          const completedCount = myProductions.filter(
            (p) => p.state === "completed"
          ).length;
          const members = users.filter((u) => m.memberIds.includes(u.id));
          return (
            <Link key={m.id} href={`/machines/${m.code}`}>
              <Card className="group relative h-full overflow-hidden border-border/60 transition hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: m.color }}
                />
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <Cpu className="size-3" /> {m.code}
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-balance group-hover:text-primary">
                        {m.name}
                      </h3>
                      <div className="text-[11px] text-muted-foreground">
                        {m.series}
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {m.description}
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>制作進捗</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {overallPct}%
                      </span>
                    </div>
                    <Progress value={overallPct} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <Stat label="演出数" value={myProductions.length} />
                    <Stat
                      label="完成"
                      value={completedCount}
                      accent="text-emerald-400"
                    />
                    <Stat
                      label="進行中"
                      value={
                        myProductions.filter((p) => p.state === "in_progress")
                          .length
                      }
                      accent="text-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <UserStack users={members} size="xs" />
                    {m.releaseTarget && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarRange className="size-3" />
                        {m.releaseTarget} 投入
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-2 text-center">
      <div className={`text-base font-semibold tabular-nums ${accent ?? ""}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
