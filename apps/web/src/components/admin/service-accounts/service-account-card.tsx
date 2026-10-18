import { BotIcon, KeyRoundIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RowActionsMenu } from "@/components/settings/row-actions-menu";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsRow } from "@/components/settings/settings-row";
import { StatusBadge } from "@/components/settings/status-badge";
import type { ServiceAccount } from "@/hooks/queries/admin/use-service-accounts";
import type { PendingServiceAccountAction } from "./pending-service-account-action";
import { ServiceAccountKeyRow } from "./service-account-key-row";
import { ServiceAccountWorkspaces } from "./service-account-workspaces";

type ServiceAccountCardProps = {
  account: ServiceAccount;
  onCreateKey: () => void;
  onAction: (action: PendingServiceAccountAction) => void;
};

export function ServiceAccountCard({
  account,
  onCreateKey,
  onAction,
}: ServiceAccountCardProps) {
  const { t } = useTranslation();

  return (
    <SettingsCard>
      <SettingsRow
        icon={<BotIcon />}
        title={account.name}
        badge={
          account.banned ? (
            <StatusBadge tone="destructive">
              {t("settings:adminServiceAccounts.deactivated")}
            </StatusBadge>
          ) : null
        }
        description={<ServiceAccountWorkspaces account={account} />}
      >
        <RowActionsMenu
          label={t("settings:adminServiceAccounts.actions", {
            name: account.name,
          })}
          actions={[
            {
              id: "create-key",
              label: t("settings:adminServiceAccounts.newKey"),
              icon: KeyRoundIcon,
              onSelect: onCreateKey,
            },
            {
              id: "delete",
              label: t("common:actions.delete"),
              icon: Trash2Icon,
              destructive: true,
              onSelect: () => onAction({ type: "delete-account", account }),
            },
          ]}
        />
      </SettingsRow>
      {account.keys.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">
          {t("settings:adminServiceAccounts.noKeys")}
        </p>
      ) : (
        account.keys.map((key) => (
          <ServiceAccountKeyRow
            key={key.id}
            apiKey={key}
            onRevoke={() => onAction({ type: "revoke-key", account, key })}
          />
        ))
      )}
    </SettingsCard>
  );
}
