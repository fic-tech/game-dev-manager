"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace-provider";
import { createUser } from "@/lib/actions/users";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Plus, UserPlus } from "lucide-react";
import type { Discipline, Role } from "@/lib/types";
import { DISCIPLINE_LABEL, PHASE_LABEL, ROLE_LABEL } from "@/lib/labels";
import { toast } from "sonner";

export default function MembersPage() {
  const { users, phases, productions, machines } = useWorkspace();

  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">メンバー</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} 名 · ロール・担当領域・担当工程を管理
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          メンバーを追加
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => {
          const myPhases = phases.filter((p) => p.assigneeId === u.id);
          const open = myPhases.filter(
            (p) =>
              p.state === "todo" ||
              p.state === "in_progress" ||
              p.state === "review"
          );
          const done = myPhases.filter((p) => p.state === "done");
          const total = myPhases.length;
          const pct = total === 0 ? 0 : Math.round((done.length / total) * 100);

          // 関与している機種 (担当工程の演出から逆引き)
          const machineIds = new Set<string>(
            myPhases
              .map((p) => productions.find((x) => x.id === p.productionId))
              .filter((p): p is NonNullable<typeof p> => Boolean(p))
              .map((p) => p.machineId)
          );
          const userMachines = machines.filter((m) => machineIds.has(m.id));

          // 工程種別の集計
          const typeCounts = new Map<string, number>();
          for (const p of open) {
            typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
          }

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
                    {ROLE_LABEL[u.role]}
                  </span>
                </div>
                {u.discipline && (
                  <div className="text-[11px] text-muted-foreground">
                    担当領域:{" "}
                    <span className="text-foreground">
                      {DISCIPLINE_LABEL[u.discipline]}
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>工程完了率</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {pct}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Stat label="進行中" value={open.length} />
                  <Stat label="完了" value={done.length} accent="text-emerald-400" />
                  <Stat label="機種" value={userMachines.length} />
                </div>
                {typeCounts.size > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(typeCounts.entries()).map(([t, n]) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {PHASE_LABEL[t as keyof typeof PHASE_LABEL]} {n}
                      </span>
                    ))}
                  </div>
                )}
                {userMachines.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {userMachines.map((m) => (
                      <Link
                        key={m.id}
                        href={`/machines/${m.code}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: m.color }}
                        />
                        {m.code}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={(input) => {
          void createUser(input).then(() => {
            toast.success(`「${input.name}」を追加しました`);
          });
          setDialogOpen(false);
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

function CreateMemberDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: {
    name: string;
    email: string;
    role: Role;
    discipline?: Discipline;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [discipline, setDiscipline] = useState<Discipline | "none">("none");

  const reset = () => {
    setName("");
    setEmail("");
    setRole("developer");
    setDiscipline("none");
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("有効なメールアドレスを入力してください");
      return;
    }
    onCreate({
      name: name.trim(),
      email: email.trim(),
      role,
      discipline: discipline === "none" ? undefined : discipline,
    });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <UserPlus className="size-4" />
            メンバーを追加
          </DialogTitle>
          <DialogDescription>
            名前・メール・ロール・担当領域を入力します。追加後は機種詳細から
            機種にアサインできます。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="member-name" className="text-xs">
              名前 <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田 太郎"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email" className="text-xs">
              メール <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yamada@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">ロール</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">担当領域</Label>
              <Select
                value={discipline}
                onValueChange={(v) => setDiscipline(v as Discipline | "none")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未設定</SelectItem>
                  {Object.entries(DISCIPLINE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button size="sm" onClick={submit}>
            <UserPlus className="size-4" />
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
