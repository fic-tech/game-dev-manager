"use client";

import { createContext, useContext } from "react";
import type { WorkspaceData } from "@/lib/queries/workspace";
import type { SessionUser } from "@/lib/auth/session";

interface WorkspaceContextValue extends WorkspaceData {
  currentUser: SessionUser;
  currentUserId: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  data,
  currentUser,
  children,
}: {
  data: WorkspaceData;
  currentUser: SessionUser;
  children: React.ReactNode;
}) {
  const value: WorkspaceContextValue = {
    ...data,
    currentUser,
    currentUserId: currentUser.id,
  };
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
