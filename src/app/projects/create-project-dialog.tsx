"use client";

import { useState } from "react";
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
import { useStore } from "@/lib/store";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#10b981",
  "#06b6d4",
];

export function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const createProject = useStore((s) => s.createProject);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [endDate, setEndDate] = useState("");

  const submit = () => {
    if (!name.trim() || !identifier.trim()) {
      toast.error("プロジェクト名と識別子を入力してください");
      return;
    }
    const project = createProject({
      name: name.trim(),
      identifier: identifier.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: description.trim(),
      color,
      endDate: endDate || undefined,
    });
    toast.success("プロジェクトを作成しました", {
      action: {
        label: "開く",
        onClick: () => router.push(`/projects/${project.identifier}`),
      },
    });
    onOpenChange(false);
    setName("");
    setIdentifier("");
    setDescription("");
    setEndDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新規プロジェクト</DialogTitle>
          <DialogDescription>
            チームで共有するプロジェクトを作成します。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-[1fr_140px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="name">プロジェクト名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Atlas"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ident">識別子</Label>
              <Input
                id="ident"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="atlas"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">概要</Label>
            <Textarea
              id="desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="プロジェクトの目的・スコープを簡潔に"
            />
          </div>
          <div className="grid grid-cols-[1fr_180px] gap-3">
            <div className="grid gap-2">
              <Label>カラー</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-7 rounded-lg ring-2 transition ${
                      color === c ? "ring-foreground" : "ring-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">期限</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={submit}>作成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
