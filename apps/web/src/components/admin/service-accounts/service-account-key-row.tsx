import { KeyRoundIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getApiKeyExpiry } from "@/components/settings/api-keys/get-api-key-expiry";
import { RowActionsMenu } from "@/components/settings/row-actions-menu";
import { SettingsRow } from "@/components/settings/settings-row";
import { StatusBadge } from "@/components/settings/status-badge";
import type { ServiceAccountKey } from "@/hooks/queries/admin/use-service-accounts";
import { formatDateMedium } from "@/lib/format";

type ServiceAccountKeyRowProps = {
  apiKey: ServiceAccountKey;
  onRevoke: () => void;
};

export function ServiceAccountKeyRow({
  apiKey,
  onRevoke,
}: ServiceAccountKeyRowProps) {
  const { t } = useTranslation();
  const name = apiKey.name || t("settings:developerPage.unnamedKey");
  const expiry = getApiKeyExpiry(apiKey.expiresAt);
  const expired = expiry.status === "expired";
  const expiryText =
    expiry.status === "never"
      ? t("settings:apiKey.row.neverExpires")
      : t(
          expired
            ? "settings:apiKey.row.expired"
            : "settings:apiKey.row.expires",
          { date: formatDateMedium(expiry.date) },
        );
  const lastUsed = apiKey.lastRequest
    ? t("settings:adminServiceAccounts.lastUsed", {
        date: formatDateMedium(apiKey.lastRequest),
      })
    : t("settings:adminServiceAccounts.neverUsed");

  return (
    <SettingsRow
      className="ps-8"
      icon={<KeyRoundIcon className={expired ? "opacity-50" : undefined} />}
      title={name}
      titleClassName={expired ? "text-muted-foreground" : undefined}
      badge={
        expired ? (
          <StatusBadge tone="destructive">
            {t("settings:apiKey.row.expiredBadge")}
          </StatusBadge>
        ) : null
      }
      description={
        <span className="flex min-w-0 items-center gap-2">
          {apiKey.start ? (
            <span className="shrink-0 font-mono">{apiKey.start}…</span>
          ) : null}
          <span className="truncate">
            {expiryText} · {lastUsed}
          </span>
        </span>
      }
    >
      <RowActionsMenu
        label={t("settings:apiKey.row.actions", { name })}
        actions={[
          {
            id: "revoke",
            label: t("settings:adminServiceAccounts.revokeKey"),
            icon: Trash2Icon,
            destructive: true,
            onSelect: onRevoke,
          },
        ]}
      />
    </SettingsRow>
  );
}
