import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getWorkspaceData } from "@/lib/queries/workspace";
import { AppShell } from "@/components/app-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const data = await getWorkspaceData();

  return (
    <WorkspaceProvider data={data} currentUser={me}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
