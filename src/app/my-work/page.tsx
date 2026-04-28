"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import {
  DISCIPLINE_COLOR,
  DISCIPLINE_LABEL,
  PHASE_DISCIPLINE,
  PHASE_DOT,
  PHASE_LABEL,
  PHASE_ORDER,
  PHASE_STATE_COLOR,
  PHASE_STATE_LABEL,
} from "@/lib/labels";
import type { Discipline, Phase, PhaseState } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Inbox } from "lucide-react";

type StateFilter = "active" | "all" | "blocked" | "done";

export default function MyWorkPage() {
  const users = useStore((s) => s.users);
  const productions = useStore((s) => s.productions);
  const phases = useStore((s) => s.phases);
  const machines = useStore((s) => s.machines);
  const currentUserId = useStore((s) => s.currentUserId);
  const updatePhase = useStore((s) => s.updatePhase);

  const [userFilter, setUserFilter] = useState<string>(currentUserId);
  const [stateFilter, setStateFilter] = useState<StateFilter>("active");

  const me = users.find((u) => u.id === userFilter);
  const myDiscipline = me?.discipline;

  // 自分の Phase を抽出 (担当者一致 OR 自分の discipline が担当する phase)
  const myPhases = useMemo(() => {
    return phases
      .filter(
        (ph) =>
          ph.assigneeId === userFilter ||
          (myDiscipline && PHASE_DISCIPLINE[ph.type] === myDiscipline)
      )
      .filter((ph) => {
        if (stateFilter === "active")
          return ph.state === "in_progress" || ph.state === "todo" || ph.state === "review";
        if (stateFilter === "blocked") return ph.state === "blocked";
        if (stateFilter === "done") return ph.state === "done";
        return true;
      });
  }, [phases, userFilter, myDiscipline, stateFilter]);

  // discipline ごとにグルーピング
  const grouped = useMemo(() => {
    const map = new Map<Discipline, Phase[]>();
    for (const p of myPhases) {
      const d = PHASE_DISCIPLINE[p.type];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(p);
    }
    return Array.from(map.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );
  }, [myPhases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">マイ・ワーク</h1>
          <p className="text-sm text-muted-foreground">
            自分の専門領域 ({me?.discipline ? DISCIPLINE_LABEL[me.discipline] : "—"}) の進行中タスクを集約
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">表示ユーザ</span>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="h-9 min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users
                .filter((u) => u.discipline)
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} · {DISCIPLINE_LABEL[u.discipline!]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Tabs
            value={stateFilter}
            onValueChange={(v) => setStateFilter(v as StateFilter)}
          >
            <TabsList>
              <TabsTrigger value="active">対応中</TabsTrigger>
              <TabsTrigger value="blocked">待機</TabsTrigger>
              <TabsTrigger value="done">完了</TabsTrigger>
              <TabsTrigger value="all">すべて</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {me && (
        <Card className="border-border/60">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <UserAvatar user={me} size="lg" />
            <div className="flex-1">
              <div className="font-semibold">{me.name}</div>
              <div className="text-xs text-muted-foreground">{me.email}</div>
            </div>
            {me.discipline && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${DISCIPLINE_COLOR[me.discipline]}`}
              >
                {DISCIPLINE_LABEL[me.discipline]}
              </span>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                対応中:{" "}
                <strong className="text-foreground tabular-nums">
                  {phases.filter(
                    (p) =>
                      (p.assigneeId === me.id ||
                        (me.discipline &&
                          PHASE_DISCIPLINE[p.type] === me.discipline)) &&
                      (p.state === "in_progress" || p.state === "todo")
                  ).length}
                </strong>
              </span>
              <span>
                完了:{" "}
                <strong className="text-emerald-400 tabular-nums">
                  {phases.filter(
                    (p) =>
                      (p.assigneeId === me.id ||
                        (me.discipline &&
                          PHASE_DISCIPLINE[p.type] === me.discipline)) &&
                      p.state === "done"
                  ).length}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {grouped.length === 0 && (
        <Card className="border-border/60">
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3">対応するタスクはありません</p>
          </CardContent>
        </Card>
      )}

      {grouped.map(([discipline, list]) => (
        <Card key={discipline} className="border-border/60">
          <CardHeader className="flex flex-row items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${DISCIPLINE_COLOR[discipline]}`}
            >
              {DISCIPLINE_LABEL[discipline]}
            </span>
            <CardTitle className="text-sm">{list.length} 件のタスク</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {list.map((ph) => {
                const prod = productions.find((p) => p.id === ph.productionId);
                if (!prod) return null;
                const machine = machines.find((m) => m.id === prod.machineId);
                const assignee = users.find((u) => u.id === ph.assigneeId);
                return (
                  <li key={ph.id}>
                    <Link
                      href={`/productions/${prod.id}`}
                      className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 transition hover:bg-accent/30"
                    >
                      <span
                        className={`grid size-8 place-items-center rounded-lg ring-1 ring-border/60 ${PHASE_DOT[ph.type]}/20`}
                      >
                        <span
                          className={`size-2 rounded-full ${PHASE_DOT[ph.type]}`}
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: machine?.color }}
                          />
                          {machine?.code} · {prod.code}
                          <span>·</span>
                          <span>{PHASE_LABEL[ph.type]}</span>
                        </div>
                        <div className="truncate text-sm font-medium">
                          {prod.name}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${PHASE_STATE_COLOR[ph.state]}`}
                      >
                        {PHASE_STATE_LABEL[ph.state]}
                      </span>
                      <span className="hidden text-[11px] text-muted-foreground tabular-nums md:inline">
                        {ph.dueDate ? formatDate(ph.dueDate, "MM/dd") : "—"}
                      </span>
                      <UserAvatar user={assignee} size="xs" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
