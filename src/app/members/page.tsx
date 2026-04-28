"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/user-avatar";
import { Mail } from "lucide-react";

const roleLabels: Record<string, string> = {
  manager: "マネージャ",
  developer: "開発",
  reporter: "報告者",
  viewer: "閲覧者",
};

export default function MembersPage() {
  const users = useStore((s) => s.users);
  const issues = useStore((s) => s.issues);
  const projects = useStore((s) => s.projects);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">メンバー</h1>
        <p className="text-sm text-muted-foreground">
          チーム全員のロール・担当チケットを把握できます
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => {
          const open = issues.filter(
            (i) =>
              i.assigneeId === u.id &&
              i.status !== "closed" &&
              i.status !== "rejected"
          );
          const done = issues.filter(
            (i) =>
              i.assigneeId === u.id &&
              (i.status === "closed" || i.status === "resolved")
          );
          const total = open.length + done.length;
          const pct = total === 0 ? 0 : Math.round((done.length / total) * 100);
          const userProjects = projects.filter((p) =>
            p.memberIds.includes(u.id)
          );
          return (
            <Card
              key={u.id}
              id={u.id}
              className="relative border-border/60 overflow-hidden"
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: `hsl(${u.avatarHue} 70% 55%)` }}
              />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} size="lg" />
                  <div className="min-w-0">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Mail className="size-3" /> {u.email}
                    </div>
                  </div>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>完了率</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {pct}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Stat label="進行中" value={open.length} />
                  <Stat label="完了" value={done.length} accent="text-emerald-400" />
                  <Stat label="プロジェクト" value={userProjects.length} />
                </div>
                {userProjects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {userProjects.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        {p.name.split("—")[0].trim()}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
