import type { PropsWithChildren } from "react";
import { AppHeader } from "./AppHeader";

export function WorkflowShell({ children }: PropsWithChildren) {
  return (
    <div>
      <AppHeader />
      <main className="page-container">{children}</main>
    </div>
  );
}
