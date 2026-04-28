"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/user-avatar";
import { PhaseDot, phaseProgress } from "@/components/phase-chip";
import {
  PHASE_DOT,
  PHASE_LABEL,
  PHASE_ORDER,
  PRODUCTION_CATEGORY_LABEL,
  PRODUCTION_STATE_COLOR,
  PRODUCTION_STATE_LABEL,
} from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { Search } from "lucide-react";

type StateFilter = "all" | "active" | "completed";

export default function ProductionsPage() {
  const machines = useStore((s) => s.machines);
  const productions = useStore((s) => s.productions);
  const phases = useStore((s) => s.phases);
  const users = useStore((s) => s.users);

  const [q, setQ] = useState("");
  const [machineId, setMachineId] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("active");
  const [phaseHighlight, setPhaseHighlight] = useState<string>("all");

  const filtered = useMemo(() => {
    return productions
      .filter((p) =>
        machineId === "all" ? true : p.machineId === machineId
      )
      .filter((p) => (category === "all" ? true : p.category === category))
      .filter((p) => {
        if (stateFilter === "active")
          return p.state === "in_progress" || p.state === "review" || p.state === "draft";
        if (stateFilter === "completed") return p.state === "completed";
        return true;
      })
      .filter((p) => {
        if (q.trim() === "") return true;
        const ql = q.toLowerCase();
        return (
          p.name.toLowerCase().includes(ql) ||
          p.code.toLowerCase().includes(ql) ||
          p.description.toLowerCase().includes(ql)
        );
      })
      .filter((p) => {
        if (phaseHighlight === "all") return true;
        const myPhases = phases.filter((ph) => ph.productionId === p.id);
        const target = myPhases.find((ph) => ph.type === phaseHighlight);
        return target && (target.state === "in_progress" || target.state === "todo");
      })
      .sort(
        (a, b) =>
          new Date(a.targetDate ?? "9999").getTime() -
          new Date(b.targetDate ?? "9999").getTime()
      );
  }, [productions, machineId, category, stateFilter, q, phaseHighlight, phases]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">演出</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} 件の演出を表示中
          </p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="演出名・コード・概要から検索"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs
              value={stateFilter}
              onValueChange={(v) => setStateFilter(v as StateFilter)}
            >
              <TabsList>
                <TabsTrigger value="active">制作中</TabsTrigger>
                <TabsTrigger value="completed">完成</TabsTrigger>
                <TabsTrigger value="all">すべて</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <FilterRow
              label="機種"
              value={machineId}
              onChange={setMachineId}
              options={[
                { value: "all", label: "すべて" },
                ...machines.map((m) => ({ value: m.id, label: m.code })),
              ]}
            />
            <FilterRow
              label="カテゴリ"
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "すべて" },
                ...Object.entries(PRODUCTION_CATEGORY_LABEL).map(([k, v]) => ({
                  value: k,
                  label: v,
                })),
              ]}
            />
            <FilterRow
              label="工程"
              value={phaseHighlight}
              onChange={setPhaseHighlight}
              options={[
                { value: "all", label: "すべて" },
                ...PHASE_ORDER.map((t) => ({
                  value: t,
                  label: `${PHASE_LABEL[t]} (進行中)`,
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((p) => {
          const machine = machines.find((m) => m.id === p.machineId);
          const myPhases = phases.filter((ph) => ph.productionId === p.id);
          const owner = users.find((u) => u.id === p.ownerId);
          const pct = phaseProgress(myPhases);
          return (
            <Link key={p.id} href={`/productions/${p.id}`}>
              <Card className="group h-full border-border/60 transition hover:border-primary/40">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: machine?.color }}
                        />
                        {p.code} · {machine?.code}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-primary">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{PRODUCTION_CATEGORY_LABEL[p.category]}</span>
                        <span>·</span>
                        <span className="tabular-nums">{p.durationSec}秒</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        PRODUCTION_STATE_COLOR[p.state]
                      }`}
                    >
                      {PRODUCTION_STATE_LABEL[p.state]}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>パイプライン進捗</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {pct}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-1" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {PHASE_ORDER.map((t) => {
                        const ph = myPhases.find((p) => p.type === t);
                        return (
                          <PhaseDot
                            key={t}
                            type={t}
                            state={ph?.state ?? "blocked"}
                            size={10}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <UserAvatar user={owner} size="xs" />
                      {p.targetDate && (
                        <span>〆 {formatDate(p.targetDate, "MM/dd")}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
            該当する演出はありません
          </p>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
