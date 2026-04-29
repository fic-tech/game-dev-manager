"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  Search,
  Sun,
  Moon,
  Cpu,
  Sparkles,
  Boxes,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/command-palette";
import { avatarColor, initials } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/workspace-provider";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/machines", label: "機種", icon: Cpu },
  { href: "/productions", label: "演出", icon: Sparkles },
  { href: "/assets", label: "素材ライブラリ", icon: Boxes },
  { href: "/members", label: "メンバー", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useWorkspace();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      window.localStorage.getItem("forge-theme")) as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("forge-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <div className="grid-bg min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar/70 backdrop-blur sticky top-0 h-screen">
          <SidebarContent isActive={isActive} />
        </aside>

        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent
              isActive={isActive}
              onNavigate={() => setMobileNav(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 glass border-b border-border/60">
            <div className="flex h-14 items-center gap-3 px-4 md:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileNav(true)}
              >
                <span className="sr-only">メニューを開く</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
              <button
                onClick={() => setPaletteOpen(true)}
                className="group relative flex flex-1 max-w-md items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3.5 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <Search className="size-4" />
                <span>機種・演出・素材を検索 ...</span>
                <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline">
                  ⌘K
                </kbd>
              </button>
              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTheme((t) => (t === "dark" ? "light" : "dark"))
                      }
                    >
                      {theme === "dark" ? (
                        <Sun className="size-4" />
                      ) : (
                        <Moon className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>テーマ切り替え</TooltipContent>
                </Tooltip>
                <UserMenu me={currentUser} />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function NavSection({
  items,
  isActive,
  onNavigate,
}: {
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  isActive: (h: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarContent({
  isActive,
  onNavigate,
}: {
  isActive: (h: string) => boolean;
  onNavigate?: () => void;
}) {
  const { machines } = useWorkspace();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border/60 px-5">
        <div className="grid place-items-center size-8 rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg shadow-primary/30">
          <span className="text-sm font-bold">F</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold tracking-tight">Forge</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Pachinko Production Suite
          </span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        <NavSection items={NAV} isActive={isActive} onNavigate={onNavigate} />

        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            開発中の機種
          </div>
          <ul className="space-y-0.5">
            {machines.map((m) => {
              const href = `/machines/${m.code}`;
              const active = isActive(href);
              return (
                <li key={m.id}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ background: m.color }}
                    />
                    <span className="truncate">{m.code}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div className="border-t border-border/60 p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <Settings className="size-4" />
          設定
        </Link>
      </div>
    </div>
  );
}

function UserMenu({
  me,
}: {
  me: { id: string; name: string; avatarHue: number; role: string };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-2 py-1 transition hover:border-primary/40"
      >
        <Avatar className="size-7">
          <AvatarFallback
            style={{ background: avatarColor(me.avatarHue), color: "#fff" }}
            className="text-xs font-semibold"
          >
            {initials(me.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-xs font-medium">{me.name}</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border/70 bg-popover p-2 shadow-2xl shadow-black/20">
            <div className="px-2 py-2">
              <div className="text-sm font-medium">{me.name}</div>
              <div className="text-xs text-muted-foreground">
                {ROLE_LABEL[me.role as keyof typeof ROLE_LABEL] ?? me.role}
              </div>
            </div>
            <div className="my-1 h-px bg-border/60" />
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-accent/60"
            >
              <Settings className="size-4" />
              設定
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await logoutAction();
                })
              }
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              {pending ? "ログアウト中…" : "ログアウト"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
