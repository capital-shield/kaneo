import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ServiceAccount } from "@/hooks/queries/admin/use-service-accounts";

type ServiceAccountWorkspacesProps = {
  account: ServiceAccount;
};

export function ServiceAccountWorkspaces({
  account,
}: ServiceAccountWorkspacesProps) {
  const { t } = useTranslation();

  if (account.workspaces.length === 0) {
    return (
      <span>
        {t("settings:adminServiceAccounts.noWorkspaces")}{" "}
        <Link
          to="/dashboard/settings/admin/workspaces"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("settings:adminServiceAccounts.addToWorkspace")}
        </Link>
      </span>
    );
  }

  return (
    <span className="block truncate">
      {account.workspaces
        .map((workspace) =>
          t("settings:adminServiceAccounts.workspaceRole", {
            workspace: workspace.name,
            role: workspace.role,
          }),
        )
        .join(", ")}
    </span>
  );
}
