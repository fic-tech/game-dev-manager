"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  TRACKER_LABEL,
  TRACKER_ORDER,
} from "@/lib/labels";
import type { IssuePriority, IssueTracker } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultProjectId?: string;
}

export function CreateIssueDialog({ open, onOpenChange, defaultProjectId }: Props) {
  const router = useRouter();
  const allProjects = useStore((s) => s.projects);
  const projects = allProjects.filter((p) => !p.archived);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const createIssue = useStore((s) => s.createIssue);

  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tracker, setTracker] = useState<IssueTracker>("feature");
  const [priority, setPriority] = useState<IssuePriority>("normal");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [dueDate, setDueDate] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
    setSubject("");
    setDescription("");
    setTracker("feature");
    setPriority("normal");
    setAssigneeId("none");
    setDueDate("");
    setTagsInput("");
  }, [open, defaultProjectId, projects]);

  const submit = () => {
    if (!subject.trim() || !projectId) {
      toast.error("件名とプロジェクトを入力してください");
      return;
    }
    const issue = createIssue({
      projectId,
      subject: subject.trim(),
      description: description.trim(),
      tracker,
      status: "new",
      priority,
      authorId: currentUserId,
      assigneeId: assigneeId === "none" ? null : assigneeId,
      parentId: null,
      dueDate: dueDate || undefined,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    toast.success("チケットを作成しました", {
      description: issue.subject,
      action: {
        label: "開く",
        onClick: () => router.push(`/issues/${issue.id}`),
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新規チケット</DialogTitle>
          <DialogDescription>
            タスク・バグ・要望を素早く起票します。あとから編集できます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="subject">件名</Label>
            <Input
              id="subject"
              placeholder="例) ログイン後のリダイレクトが効かない"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>プロジェクト</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: p.color }}
                        />
                        {p.name.split("—")[0].trim()}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>担当者</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="未割当" />
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
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>種別</Label>
              <Select
                value={tracker}
                onValueChange={(v) => setTracker(v as IssueTracker)}
              >
                <SelectTrigger>
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
            </div>
            <div className="grid gap-2">
              <Label>優先度</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as IssuePriority)}
              >
                <SelectTrigger>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due">期限</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">タグ (カンマ区切り)</Label>
            <Input
              id="tags"
              placeholder="ui, frontend"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">説明</Label>
            <Textarea
              id="desc"
              rows={5}
              placeholder="再現手順、期待する挙動などを記述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={submit}>作成する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
