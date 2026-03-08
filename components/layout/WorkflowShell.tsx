import type { PropsWithChildren } from "react";
import { AppHeader } from "./AppHeader";

type WorkflowShellProps = PropsWithChildren<{
  hideHeader?: boolean;
}>;

export function WorkflowShell({ children, hideHeader = false }: WorkflowShellProps) {
  return (
    <div>
      {hideHeader ? null : <AppHeader />}
      <main className="page-container">{children}</main>
    </div>
  );
}
