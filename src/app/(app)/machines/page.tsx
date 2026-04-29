"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { createMachine } from "@/lib/actions/machines";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UserStack } from "@/components/user-avatar";
import { phaseProgress } from "@/components/phase-chip";
import { ArrowUpRight, CalendarRange, Cpu, Plus } from "lucide-react";
import { MachineDialog } from "@/components/machine-dialog";
import { toast } from "sonner";

export default function MachinesPage() {
  const { machines, productions, phases, users } = useWorkspace();

  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">機種</h1>
          <p className="text-sm text-muted-foreground">
            {machines.length} 機種 · 開発中の遊技機タイトルと、その演出制作の
            全体像を把握します
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          機種を追加
        </Button>
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
        {machines.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-16 text-center">
            <Cpu className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              まだ機種が登録されていません
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              最初の機種を追加
            </Button>
          </div>
        )}
      </div>

      <MachineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        existingCodes={machines.map((m) => m.code)}
        onSubmit={(values) => {
          startTransition(async () => {
            try {
              await createMachine({
                code: values.code,
                name: values.name,
                series: values.series,
                description: values.description,
                color: values.color,
                releaseTarget: values.releaseTarget || undefined,
              });
              toast.success(`機種「${values.name}」を追加しました`);
              setCreateOpen(false);
              router.push(`/machines/${values.code}`);
            } catch (e) {
              toast.error("機種の追加に失敗しました");
              console.error(e);
            }
          });
        }}
      />
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
