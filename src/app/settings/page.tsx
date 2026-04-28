"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SettingsPage() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const resetData = useStore((s) => s.resetData);
  const projects = useStore((s) => s.projects);
  const issues = useStore((s) => s.issues);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground">
          ワークスペース全体の動作を調整します
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>表示ユーザ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            アプリ内の「自分」として扱うアカウントを切り替えます。
          </p>
          <div className="flex items-center gap-3">
            <UserAvatar
              user={users.find((u) => u.id === currentUserId)}
              size="md"
            />
            <Select value={currentUserId} onValueChange={setCurrentUser}>
              <SelectTrigger className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} · {u.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>ワークスペース</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="プロジェクト数" value={projects.length} />
          <Row label="チケット総数" value={issues.length} />
          <Row label="メンバー" value={users.length} />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">データリセット</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            ローカルに保存された全データを破棄し、初期状態に戻します。
          </p>
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm("本当にすべてのデータを初期状態に戻しますか?")) {
                resetData();
                toast.success("データを初期状態にリセットしました");
              }
            }}
          >
            初期データに戻す
          </Button>
        </CardContent>
      </Card>
    </div>
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
