"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { BookText } from "lucide-react";
import { relativeTime } from "@/lib/format";

export default function WikiIndexPage() {
  const allProjects = useStore((s) => s.projects);
  const projects = allProjects.filter((p) => !p.archived);
  const wikiPages = useStore((s) => s.wikiPages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wiki</h1>
        <p className="text-sm text-muted-foreground">
          プロジェクトごとのドキュメントを管理します
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const pages = wikiPages.filter((w) => w.projectId === p.id);
          return (
            <Card key={p.id} className="border-border/60">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="text-sm font-semibold">{p.name}</span>
                </div>
                <div className="space-y-2">
                  {pages.length === 0 ? (
                    <Link
                      href={`/projects/${p.identifier}/wiki/home`}
                      className="block rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      最初のページを作成
                    </Link>
                  ) : (
                    pages.map((w) => (
                      <Link
                        key={w.id}
                        href={`/projects/${p.identifier}/wiki/${w.slug}`}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-xs transition hover:border-primary/40"
                      >
                        <BookText className="size-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{w.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {relativeTime(w.updatedAt)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
