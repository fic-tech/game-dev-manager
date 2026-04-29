"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search,
  Hash,
  Users,
  Cpu,
  Sparkles,
  Boxes,
} from "lucide-react";
import { useWorkspace } from "@/components/workspace-provider";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "機種" | "演出" | "素材" | "メンバー" | "移動";
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { users, machines, productions, assets: assetsAll } = useWorkspace();
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActiveIdx(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const navItems: Item[] = [
      { id: "n-dash", label: "ダッシュボード", href: "/", icon: Hash, group: "移動" },
      { id: "n-machines", label: "機種", href: "/machines", icon: Hash, group: "移動" },
      { id: "n-prod", label: "演出", href: "/productions", icon: Hash, group: "移動" },
      { id: "n-assets", label: "素材ライブラリ", href: "/assets", icon: Hash, group: "移動" },
      { id: "n-members", label: "メンバー", href: "/members", icon: Hash, group: "移動" },
      { id: "n-settings", label: "設定", href: "/settings", icon: Hash, group: "移動" },
    ];
    const all: Item[] = [
      ...machines.map<Item>((m) => ({
        id: m.id,
        label: m.name,
        hint: m.code,
        href: `/machines/${m.code}`,
        icon: Cpu,
        group: "機種",
      })),
      ...productions.slice(0, 200).map<Item>((p) => ({
        id: p.id,
        label: p.name,
        hint: p.code,
        href: `/productions/${p.id}`,
        icon: Sparkles,
        group: "演出",
      })),
      ...assetsAll.slice(0, 200).map<Item>((a) => ({
        id: a.id,
        label: a.name,
        hint: a.fileLabel,
        href: a.productionId ? `/productions/${a.productionId}` : "/assets",
        icon: Boxes,
        group: "素材",
      })),
      ...users.map<Item>((u) => ({
        id: u.id,
        label: u.name,
        hint: u.email,
        href: `/members#${u.id}`,
        icon: Users,
        group: "メンバー",
      })),
      ...navItems,
    ];
    if (!q.trim()) return all.slice(0, 50);
    const ql = q.toLowerCase();
    return all
      .filter(
        (it) =>
          it.label.toLowerCase().includes(ql) ||
          it.hint?.toLowerCase().includes(ql)
      )
      .slice(0, 50);
  }, [q, users, machines, productions, assetsAll]);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of items) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  const flat = items;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = flat[activeIdx];
                if (item) {
                  router.push(item.href);
                  onOpenChange(false);
                }
              }
            }}
            placeholder="機種・演出・素材・メンバーを検索…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
            ESC
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              該当する結果はありません
            </div>
          ) : (
            grouped.map(([group, list]) => (
              <div key={group} className="mb-2">
                <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group}
                </div>
                {list.map((item) => {
                  const idx = flat.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        router.push(item.href);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-sm transition",
                        idx === activeIdx
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/40"
                      )}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="truncate">{item.label}</span>
                      {item.hint && (
                        <span className="ml-auto truncate text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
