"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ASSET_CATEGORY_LABEL,
  ASSET_DISCIPLINE,
  ASSET_STATE_COLOR,
  ASSET_STATE_LABEL,
  DISCIPLINE_LABEL,
} from "@/lib/labels";
import type { AssetState, AssetCategory } from "@/lib/types";
import { Search } from "lucide-react";
import { relativeTime } from "@/lib/format";

export default function AssetsPage() {
  const assets = useStore((s) => s.assets);
  const machines = useStore((s) => s.machines);
  const productions = useStore((s) => s.productions);
  const users = useStore((s) => s.users);
  const updateAsset = useStore((s) => s.updateAsset);

  const [q, setQ] = useState("");
  const [machineId, setMachineId] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [state, setState] = useState<"all" | AssetState>("all");

  const filtered = useMemo(() => {
    return assets
      .filter((a) =>
        machineId === "all" ? true : a.machineId === machineId
      )
      .filter((a) =>
        category === "all" ? true : a.category === category
      )
      .filter((a) => (state === "all" ? true : a.state === state))
      .filter((a) =>
        q.trim() === ""
          ? true
          : (a.name + a.fileLabel).toLowerCase().includes(q.toLowerCase())
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [assets, machineId, category, state, q]);

  // カテゴリでグルーピング
  const grouped = useMemo(() => {
    const map = new Map<AssetCategory, typeof filtered>();
    for (const a of filtered) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">素材ライブラリ</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} 件の素材 · {machines.length} 機種を横断検索
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="名前・ファイル名から検索"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs
              value={state}
              onValueChange={(v) => setState(v as "all" | AssetState)}
            >
              <TabsList>
                <TabsTrigger value="all">すべて</TabsTrigger>
                <TabsTrigger value="wip">作業中</TabsTrigger>
                <TabsTrigger value="review">レビュー中</TabsTrigger>
                <TabsTrigger value="approved">承認済</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <FilterRow
              label="機種"
              value={machineId}
              onChange={setMachineId}
              options={[
                { value: "all", label: "すべて" },
                ...machines.map((m) => ({ value: m.id, label: m.code })),
              ]}
            />
            <FilterRow
              label="カテゴリ"
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "すべて" },
                ...Object.entries(ASSET_CATEGORY_LABEL).map(([k, v]) => ({
                  value: k,
                  label: v,
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {grouped.map(([cat, list]) => (
          <section key={cat} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold">
                {ASSET_CATEGORY_LABEL[cat]}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {DISCIPLINE_LABEL[ASSET_DISCIPLINE[cat]]}
              </span>
              <span className="text-xs text-muted-foreground">
                {list.length} 件
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((a) => {
                const author = users.find((u) => u.id === a.authorId);
                const machine = machines.find((m) => m.id === a.machineId);
                const prod = productions.find((p) => p.id === a.productionId);
                return (
                  <Card
                    key={a.id}
                    className="border-border/60 transition hover:border-primary/30"
                  >
                    <CardContent className="space-y-3 p-3">
                      <div
                        className="relative h-24 overflow-hidden rounded-lg ring-1 ring-border/60"
                        style={{
                          background: `linear-gradient(135deg, hsl(${a.thumbHue} 70% 55%), hsl(${(a.thumbHue + 80) % 360} 70% 30%))`,
                        }}
                      >
                        <div className="absolute inset-0 grid place-items-center text-xs font-bold uppercase tracking-widest text-white/80">
                          {ASSET_CATEGORY_LABEL[a.category]}
                        </div>
                        <span
                          className={`absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ASSET_STATE_COLOR[a.state]}`}
                        >
                          {ASSET_STATE_LABEL[a.state]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{a.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {a.fileLabel} · v{a.version}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <Link
                          href={
                            prod
                              ? `/productions/${prod.id}`
                              : machine
                                ? `/machines/${machine.code}`
                                : "/machines"
                          }
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: machine?.color }}
                          />
                          {machine?.code} {prod ? `· ${prod.code}` : ""}
                        </Link>
                        <span>{relativeTime(a.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={author} size="xs" />
                        <span className="text-[11px] text-muted-foreground">
                          {author?.name}
                        </span>
                        <Select
                          value={a.state}
                          onValueChange={(v) =>
                            updateAsset(a.id, { state: v as AssetState })
                          }
                        >
                          <SelectTrigger className="ml-auto h-7 min-w-[100px] text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ASSET_STATE_LABEL).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            該当する素材はありません
          </p>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
