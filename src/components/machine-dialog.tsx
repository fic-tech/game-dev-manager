"use client";

import { useEffect, useState } from "react";
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
import { Cpu, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Machine } from "@/lib/types";
import { toast } from "sonner";

const COLOR_PRESETS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#84cc16", // lime
  "#f97316", // orange
  "#64748b", // slate
];

export type MachineDialogMode = "create" | "edit";

export interface MachineFormValues {
  code: string;
  name: string;
  series: string;
  description: string;
  color: string;
  releaseTarget: string;
}

interface MachineDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: MachineDialogMode;
  /** 編集モード時の初期値 (= 既存 Machine) */
  initial?: Machine;
  /** 既存の code 一覧。重複バリデーションに使う (編集時は自分の code を除く) */
  existingCodes: string[];
  onSubmit: (values: MachineFormValues) => void;
}

const EMPTY: MachineFormValues = {
  code: "",
  name: "",
  series: "",
  description: "",
  color: COLOR_PRESETS[0],
  releaseTarget: "",
};

const fromMachine = (m: Machine): MachineFormValues => ({
  code: m.code,
  name: m.name,
  series: m.series,
  description: m.description,
  color: m.color,
  releaseTarget: m.releaseTarget ?? "",
});

export function MachineDialog({
  open,
  onOpenChange,
  mode,
  initial,
  existingCodes,
  onSubmit,
}: MachineDialogProps) {
  const [values, setValues] = useState<MachineFormValues>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setValues(initial ? fromMachine(initial) : EMPTY);
  }, [open, initial]);

  const update = <K extends keyof MachineFormValues>(
    key: K,
    v: MachineFormValues[K]
  ) => setValues((prev) => ({ ...prev, [key]: v }));

  const submit = () => {
    const code = values.code.trim();
    const name = values.name.trim();
    if (!code) {
      toast.error("機種コードを入力してください (例: P-NCM)");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      toast.error("機種コードは英数字・ハイフン・アンダースコアのみ使えます");
      return;
    }
    if (!name) {
      toast.error("機種名を入力してください");
      return;
    }
    const others =
      mode === "edit" && initial
        ? existingCodes.filter((c) => c !== initial.code)
        : existingCodes;
    if (others.includes(code)) {
      toast.error(`機種コード「${code}」は既に使用されています`);
      return;
    }
    if (
      values.releaseTarget &&
      !/^\d{4}-\d{2}$/.test(values.releaseTarget.trim())
    ) {
      toast.error("投入予定は YYYY-MM 形式で入力してください (例: 2027-06)");
      return;
    }
    onSubmit({
      code,
      name,
      series: values.series.trim(),
      description: values.description.trim(),
      color: values.color,
      releaseTarget: values.releaseTarget.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            {mode === "create" ? (
              <>
                <Plus className="size-4" /> 機種を追加
              </>
            ) : (
              <>
                <Pencil className="size-4" /> 機種を編集
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "新しい遊技機タイトルを登録します。コードと名前は必須です。"
              : "機種情報を更新します。"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="machine-code" className="text-xs">
                コード <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="machine-code"
                value={values.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="P-NCM"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="machine-name" className="text-xs">
                機種名 <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="machine-name"
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="例: Pネオ・コスモス〜銀河の覇者〜"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="machine-series" className="text-xs">
              シリーズ
            </Label>
            <Input
              id="machine-series"
              value={values.series}
              onChange={(e) => update("series", e.target.value)}
              placeholder="例: ネオ・コスモスシリーズ"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="machine-desc" className="text-xs">
              説明
            </Label>
            <Textarea
              id="machine-desc"
              rows={3}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="演出のテーマ・新機構・コンセプト等"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="machine-release" className="text-xs">
                投入予定 (YYYY-MM)
              </Label>
              <Input
                id="machine-release"
                value={values.releaseTarget}
                onChange={(e) => update("releaseTarget", e.target.value)}
                placeholder="2027-06"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">テーマカラー</Label>
              <div className="flex items-center gap-2">
                <span
                  className="size-9 shrink-0 rounded-lg ring-1 ring-border/60"
                  style={{
                    background: `linear-gradient(135deg, ${values.color}, ${values.color}99)`,
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update("color", c)}
                      className={cn(
                        "size-5 rounded-full ring-2 transition",
                        values.color === c
                          ? "ring-foreground"
                          : "ring-transparent hover:ring-border"
                      )}
                      style={{ background: c }}
                      title={c}
                      aria-label={`カラー ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {mode === "create" && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
              <Cpu className="mr-1 inline size-3" />
              機種を追加するとサイドバーから即アクセスできます。メンバーアサ
              インや演出登録は、機種詳細ページから行います。
            </div>
          )}
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
            {mode === "create" ? (
              <>
                <Plus className="size-4" /> 作成
              </>
            ) : (
              <>
                <Pencil className="size-4" /> 保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
