"use client";

import { useActionState, useState } from "react";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { ROLE_LABEL } from "@/lib/labels";
import {
  changePasswordAction,
  logoutAction,
  type ChangePasswordState,
} from "@/lib/actions/auth";
import { toast } from "sonner";

const initialPwState: ChangePasswordState = {};

export default function SettingsPage() {
  const { currentUser, users, machines, productions, phases, assets } =
    useWorkspace();

  const me = users.find((u) => u.id === currentUser.id) ?? users[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground">
          ログイン中のアカウントとワークスペース情報
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>ログイン中のアカウント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={me} size="md" />
            <div>
              <div className="font-medium">{me?.name}</div>
              <div className="text-xs text-muted-foreground">
                {me?.email} · {me ? ROLE_LABEL[me.role] : ""}
              </div>
            </div>
          </div>
          <form
            action={async () => {
              await logoutAction();
            }}
          >
            <Button type="submit" variant="outline">
              ログアウト
            </Button>
          </form>
        </CardContent>
      </Card>

      <ChangePasswordCard />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>ワークスペース統計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="機種数" value={machines.length} />
          <Row label="演出数" value={productions.length} />
          <Row label="工程数" value={phases.length} />
          <Row label="素材数" value={assets.length} />
          <Row label="メンバー" value={users.length} />
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordCard() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialPwState
  );
  const [key, setKey] = useState(0);

  if (state.success) {
    toast.success("パスワードを変更しました");
    state.success = false;
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>パスワード変更</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          key={key}
          action={async (fd) => {
            formAction(fd);
            setKey((k) => k + 1);
          }}
          className="space-y-3 max-w-sm"
        >
          <div className="space-y-1">
            <Label htmlFor="current">現在のパスワード</Label>
            <Input
              id="current"
              name="current"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="next">新しいパスワード</Label>
            <Input
              id="next"
              name="next"
              type="password"
              autoComplete="new-password"
              minLength={4}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">新しいパスワード (確認)</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={4}
              required
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "変更中…" : "パスワードを変更"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
