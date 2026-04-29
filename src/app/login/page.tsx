import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const me = await getCurrentUser();
  const { next } = await searchParams;

  if (me) {
    redirect(next && next.startsWith("/") ? next : "/");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Forge</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            遊技機 演出開発ワークスペース
          </p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
