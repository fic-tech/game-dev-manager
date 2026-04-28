"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatusBadge,
  TrackerBadge,
  PriorityIndicator,
} from "@/components/issue-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
  TRACKER_LABEL,
  TRACKER_ORDER,
} from "@/lib/labels";
import { formatDate, relativeTime } from "@/lib/format";
import {
  ArrowLeft,
  CalendarRange,
  Clock,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { IssuePriority, IssueStatus, IssueTracker } from "@/lib/types";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const allIssues = useStore((s) => s.issues);
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const allComments = useStore((s) => s.comments);
  const allChangelogs = useStore((s) => s.changelogs);
  const issue = allIssues.find((i) => i.id === params.id);
  const comments = allComments
    .filter((c) => c.issueId === params.id)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  const changelogs = allChangelogs
    .filter((c) => c.issueId === params.id)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  const updateIssue = useStore((s) => s.updateIssue);
  const deleteIssue = useStore((s) => s.deleteIssue);
  const addComment = useStore((s) => s.addComment);

  const [editing, setEditing] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [draftStart, setDraftStart] = useState("");
  const [draftEstimate, setDraftEstimate] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [comment, setComment] = useState("");

  if (!issue) {
    if (typeof window !== "undefined") notFound();
    return null;
  }
  const project = projects.find((p) => p.id === issue.projectId);
  const author = users.find((u) => u.id === issue.authorId);
  const assignee = users.find((u) => u.id === issue.assigneeId);

  const startEdit = () => {
    setDraftSubject(issue.subject);
    setDraftDescription(issue.description);
    setDraftDue(issue.dueDate ?? "");
    setDraftStart(issue.startDate ?? "");
    setDraftEstimate(issue.estimatedHours?.toString() ?? "");
    setDraftTags(issue.tags.join(", "));
    setEditing(true);
  };

  const saveEdit = () => {
    updateIssue(issue.id, {
      subject: draftSubject.trim() || issue.subject,
      description: draftDescription,
      startDate: draftStart || undefined,
      dueDate: draftDue || undefined,
      estimatedHours: draftEstimate ? Number(draftEstimate) : undefined,
      tags: draftTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setEditing(false);
    toast.success("チケットを更新しました");
  };

  const onSubmitComment = () => {
    const created = addComment(issue.id, comment);
    if (created) {
      setComment("");
      toast.success("コメントを投稿しました");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> 戻る
          </button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link
              href={`/projects/${project?.identifier}`}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: project?.color }}
              />
              {project?.identifier?.toUpperCase()} #{issue.number}
            </Link>
            <span>· {relativeTime(issue.updatedAt)}</span>
          </div>
          <div className="flex items-start gap-3">
            <TrackerBadge tracker={issue.tracker} />
            {editing ? (
              <Input
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                className="text-lg font-semibold"
              />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {issue.subject}
              </h1>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-4" /> キャンセル
              </Button>
              <Button onClick={saveEdit}>
                <Save className="size-4" /> 保存
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={startEdit}>
                <Pencil className="size-4" /> 編集
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("このチケットを削除しますか?")) {
                    deleteIssue(issue.id);
                    toast.success("チケットを削除しました");
                    router.push("/issues");
                  }
                }}
              >
                <Trash2 className="size-4" /> 削除
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">説明</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  rows={8}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="マークダウン記法で記述できます"
                />
              ) : (
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {issue.description || (
                    <span className="text-muted-foreground">
                      説明はまだありません。
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">履歴とコメント</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="comments">コメント</TabsTrigger>
                  <TabsTrigger value="history">変更履歴</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4 space-y-4">
                  {merge(comments, changelogs).map((entry) =>
                    entry.kind === "comment" ? (
                      <CommentItem
                        key={entry.id}
                        author={users.find((u) => u.id === entry.authorId)}
                        body={entry.body}
                        createdAt={entry.createdAt}
                      />
                    ) : (
                      <ChangeItem
                        key={entry.id}
                        actor={users.find((u) => u.id === entry.authorId)}
                        field={entry.field}
                        from={entry.from}
                        to={entry.to}
                        createdAt={entry.createdAt}
                      />
                    )
                  )}
                  {comments.length + changelogs.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      まだ何もありません。最初のコメントを投稿しましょう。
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="comments" className="mt-4 space-y-4">
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      コメントはまだありません
                    </p>
                  )}
                  {comments.map((c) => (
                    <CommentItem
                      key={c.id}
                      author={users.find((u) => u.id === c.authorId)}
                      body={c.body}
                      createdAt={c.createdAt}
                    />
                  ))}
                </TabsContent>
                <TabsContent value="history" className="mt-4 space-y-3">
                  {changelogs.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      変更履歴はありません
                    </p>
                  )}
                  {changelogs.map((c) => (
                    <ChangeItem
                      key={c.id}
                      actor={users.find((u) => u.id === c.authorId)}
                      field={c.field}
                      from={c.from}
                      to={c.to}
                      createdAt={c.createdAt}
                    />
                  ))}
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-2">
                <Label className="text-xs">コメントを追加</Label>
                <Textarea
                  rows={3}
                  placeholder="進捗やフィードバックを共有"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      (e.metaKey || e.ctrlKey) &&
                      e.key === "Enter" &&
                      comment.trim()
                    ) {
                      onSubmitComment();
                    }
                  }}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>⌘ + Enter で送信</span>
                  <Button
                    size="sm"
                    onClick={onSubmitComment}
                    disabled={!comment.trim()}
                  >
                    投稿する
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5 text-sm">
              <SidebarRow label="ステータス">
                <Select
                  value={issue.status}
                  onValueChange={(v) =>
                    updateIssue(issue.id, { status: v as IssueStatus })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SidebarRow>
              <SidebarRow label="優先度">
                <Select
                  value={issue.priority}
                  onValueChange={(v) =>
                    updateIssue(issue.id, { priority: v as IssuePriority })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SidebarRow>
              <SidebarRow label="種別">
                <Select
                  value={issue.tracker}
                  onValueChange={(v) =>
                    updateIssue(issue.id, { tracker: v as IssueTracker })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKER_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TRACKER_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SidebarRow>
              <SidebarRow label="担当者">
                <Select
                  value={issue.assigneeId ?? "none"}
                  onValueChange={(v) =>
                    updateIssue(issue.id, {
                      assigneeId: v === "none" ? null : v,
                    })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未割当</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SidebarRow>

              <div className="grid gap-3 border-t border-border/60 pt-4">
                <SidebarRow label="開始">
                  {editing ? (
                    <Input
                      type="date"
                      value={draftStart}
                      onChange={(e) => setDraftStart(e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <span>{formatDate(issue.startDate)}</span>
                  )}
                </SidebarRow>
                <SidebarRow label="期限">
                  {editing ? (
                    <Input
                      type="date"
                      value={draftDue}
                      onChange={(e) => setDraftDue(e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <span>{formatDate(issue.dueDate)}</span>
                  )}
                </SidebarRow>
                <SidebarRow label="見積 (h)">
                  {editing ? (
                    <Input
                      type="number"
                      value={draftEstimate}
                      onChange={(e) => setDraftEstimate(e.target.value)}
                      className="h-8"
                    />
                  ) : (
                    <span>
                      {issue.estimatedHours ? `${issue.estimatedHours}h` : "—"}
                    </span>
                  )}
                </SidebarRow>
                <SidebarRow label="タグ">
                  {editing ? (
                    <Input
                      value={draftTags}
                      onChange={(e) => setDraftTags(e.target.value)}
                      placeholder="ui, frontend"
                      className="h-8"
                    />
                  ) : issue.tags.length > 0 ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {issue.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </SidebarRow>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>進捗</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {issue.doneRatio}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={issue.doneRatio}
                  onChange={(e) =>
                    updateIssue(issue.id, {
                      doneRatio: Number(e.target.value),
                    })
                  }
                  className="w-full accent-primary"
                />
                <Progress value={issue.doneRatio} className="h-1.5" />
              </div>

              <div className="space-y-2 border-t border-border/60 pt-4 text-xs">
                <div className="flex items-center gap-2">
                  <UserAvatar user={author} size="xs" />
                  <span className="text-muted-foreground">起票者</span>
                  <span className="ml-auto">{author?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserAvatar user={assignee} size="xs" />
                  <span className="text-muted-foreground">担当</span>
                  <span className="ml-auto">{assignee?.name ?? "未割当"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3" />
                  作成 {relativeTime(issue.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarRange className="size-3" />
                  更新 {relativeTime(issue.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SidebarRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

interface MergedComment {
  kind: "comment";
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}
interface MergedChange {
  kind: "change";
  id: string;
  authorId: string;
  field: string;
  from: string | null;
  to: string | null;
  createdAt: string;
}

function merge(
  comments: { id: string; authorId: string; body: string; createdAt: string }[],
  changelogs: {
    id: string;
    authorId: string;
    field: string;
    from: string | null;
    to: string | null;
    createdAt: string;
  }[]
): (MergedComment | MergedChange)[] {
  const merged: (MergedComment | MergedChange)[] = [
    ...comments.map<MergedComment>((c) => ({ kind: "comment", ...c })),
    ...changelogs.map<MergedChange>((c) => ({ kind: "change", ...c })),
  ];
  merged.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  return merged;
}

function CommentItem({
  author,
  body,
  createdAt,
}: {
  author: ReturnType<typeof useStore.getState>["users"][number] | undefined;
  body: string;
  createdAt: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs">
        <UserAvatar user={author} size="xs" />
        <span className="font-medium">{author?.name ?? "—"}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{relativeTime(createdAt)}</span>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {body}
      </div>
    </div>
  );
}

function ChangeItem({
  actor,
  field,
  from,
  to,
  createdAt,
}: {
  actor: ReturnType<typeof useStore.getState>["users"][number] | undefined;
  field: string;
  from: string | null;
  to: string | null;
  createdAt: string;
}) {
  const fieldLabel: Record<string, string> = {
    status: "ステータス",
    priority: "優先度",
    assigneeId: "担当者",
    doneRatio: "進捗",
    tracker: "種別",
    subject: "件名",
    dueDate: "期限",
    startDate: "開始",
  };
  const renderStatus = (v: string | null) => {
    if (!v) return "未設定";
    if (field === "status" && (v as IssueStatus) in STATUS_LABEL)
      return STATUS_LABEL[v as IssueStatus];
    if (field === "priority" && (v as IssuePriority) in PRIORITY_LABEL)
      return PRIORITY_LABEL[v as IssuePriority];
    if (field === "tracker" && (v as IssueTracker) in TRACKER_LABEL)
      return TRACKER_LABEL[v as IssueTracker];
    return v;
  };
  return (
    <div className="flex items-start gap-3 text-xs text-muted-foreground">
      <UserAvatar user={actor} size="xs" />
      <div>
        <span className="text-foreground">{actor?.name}</span> が{" "}
        <span className="font-medium text-foreground">
          {fieldLabel[field] ?? field}
        </span>{" "}
        を {renderStatus(from)} → {renderStatus(to)} に変更
        <span className="ml-2">{relativeTime(createdAt)}</span>
      </div>
    </div>
  );
}
