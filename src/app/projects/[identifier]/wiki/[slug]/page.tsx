"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { relativeTime } from "@/lib/format";

function renderMarkdown(src: string): string {
  const escaped = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/^### (.*)$/gm, '<h3 class="mt-4 text-base font-semibold">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="mt-6 text-lg font-semibold">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="mt-8 text-2xl font-semibold">$1</h1>')
    .replace(/^&gt; (.*)$/gm, '<blockquote class="my-2 border-l-2 border-border pl-3 text-muted-foreground">$1</blockquote>')
    .replace(/^- (.*)$/gm, '<li class="ml-5 list-disc">$1</li>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[12px]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<p class="my-2"></p>')
    .replace(/\n/g, "<br/>");
}

export default function WikiPage() {
  const params = useParams<{ identifier: string; slug: string }>();
  const router = useRouter();
  const allProjects = useStore((s) => s.projects);
  const allWikiPages = useStore((s) => s.wikiPages);
  const users = useStore((s) => s.users);
  const upsert = useStore((s) => s.upsertWikiPage);
  const currentUserId = useStore((s) => s.currentUserId);
  const project = allProjects.find((p) => p.identifier === params.identifier);
  const page = allWikiPages.find(
    (w) => w.projectId === project?.id && w.slug === params.slug
  );
  const author = page ? users.find((u) => u.id === page.authorId) : undefined;
  const allPages = allWikiPages.filter((w) => w.projectId === project?.id);

  const [editing, setEditing] = useState(!page);
  const [title, setTitle] = useState(page?.title ?? params.slug ?? "新しいページ");
  const [body, setBody] = useState(page?.body ?? "");

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setBody(page.body);
    } else {
      setTitle(params.slug ?? "新しいページ");
      setBody("");
      setEditing(true);
    }
  }, [page, params.slug]);

  if (!project) {
    if (typeof window !== "undefined") notFound();
    return null;
  }

  const save = () => {
    upsert({
      projectId: project.id,
      slug: params.slug ?? "home",
      title,
      body,
      authorId: currentUserId,
    });
    toast.success("Wikiを保存しました");
    setEditing(false);
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={`/projects/${project.identifier}`}
              className="hover:text-foreground"
            >
              {project.name}
            </Link>
            <span>/ Wiki / {params.slug}</span>
          </div>
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          )}
          {page && !editing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserAvatar user={author} size="xs" />
              <span>{author?.name}</span>
              <span>·</span>
              <span>更新 {relativeTime(page.updatedAt)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-4" /> キャンセル
              </Button>
              <Button onClick={save}>
                <Save className="size-4" /> 保存
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> 編集
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <Card className="border-border/60">
          <CardContent className="p-6">
            {editing ? (
              <Textarea
                rows={20}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="# タイトル\n\n本文を記述します..."
                className="font-mono text-sm"
              />
            ) : (
              <article
                className="prose prose-invert max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
              />
            )}
          </CardContent>
        </Card>

        <aside className="space-y-3">
          <Card className="border-border/60">
            <CardContent className="space-y-3 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                ページ
              </div>
              <ul className="space-y-1 text-sm">
                {allPages.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/projects/${project.identifier}/wiki/${w.slug}`}
                      className={`block truncate rounded-md px-2 py-1 transition hover:bg-accent ${
                        w.slug === params.slug
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {w.title}
                    </Link>
                  </li>
                ))}
                {allPages.length === 0 && (
                  <li className="text-xs text-muted-foreground">ページなし</li>
                )}
              </ul>
              <div className="border-t border-border/60 pt-3">
                <NewWikiInput projectIdentifier={project.identifier} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function NewWikiInput({ projectIdentifier }: { projectIdentifier: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
        if (!s) return;
        router.push(`/projects/${projectIdentifier}/wiki/${s}`);
        setSlug("");
      }}
      className="flex gap-1"
    >
      <Input
        placeholder="新規ページ slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="h-8 text-xs"
      />
      <Button type="submit" size="sm">
        作成
      </Button>
    </form>
  );
}
