import { BotIcon, LockIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DirectoryErrorRow } from "@/components/admin/directory/directory-error-row";
import { ApiKeyCreatedDialog } from "@/components/settings/api-keys/api-key-created-dialog";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsEmpty } from "@/components/settings/settings-empty";
import { SettingsNote } from "@/components/settings/settings-note";
import { SettingsPage } from "@/components/settings/settings-page";
import { SettingsRowsSkeleton } from "@/components/settings/settings-rows-skeleton";
import { Button } from "@/components/ui/button";
import useServiceAccounts, {
  type ServiceAccount,
} from "@/hooks/queries/admin/use-service-accounts";
import { CreateServiceAccountDialog } from "./create-service-account-dialog";
import { CreateServiceAccountKeyDialog } from "./create-service-account-key-dialog";
import type { PendingServiceAccountAction } from "./pending-service-account-action";
import { ServiceAccountCard } from "./service-account-card";
import { ServiceAccountConfirmDialog } from "./service-account-confirm-dialog";

function ServiceAccountsPanel() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useServiceAccounts();
  const accounts = data ?? [];
  const [createOpen, setCreateOpen] = useState(false);
  const [keyAccount, setKeyAccount] = useState<ServiceAccount | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingServiceAccountAction | null>(
    null,
  );

  const newAccountButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setCreateOpen(true)}
    >
      <PlusIcon aria-hidden="true" />
      {t("settings:adminServiceAccounts.newAccount")}
    </Button>
  );

  const renderAccounts = () => {
    if (isPending) {
      return (
        <SettingsCard>
          <SettingsRowsSkeleton rows={2} withDescription />
        </SettingsCard>
      );
    }
    if (isError) {
      return (
        <SettingsCard>
          <DirectoryErrorRow
            message={t("settings:adminServiceAccounts.loadError")}
            retryLabel={t("settings:adminServiceAccounts.retry")}
            onRetry={() => refetch()}
          />
        </SettingsCard>
      );
    }
    if (accounts.length === 0) {
      return (
        <SettingsCard>
          <SettingsEmpty
            icon={<BotIcon />}
            title={t("settings:adminServiceAccounts.emptyTitle")}
            description={t("settings:adminServiceAccounts.emptyDescription")}
            action={newAccountButton}
          />
        </SettingsCard>
      );
    }
    return accounts.map((account) => (
      <ServiceAccountCard
        key={account.id}
        account={account}
        onCreateKey={() => setKeyAccount(account)}
        onAction={setPending}
      />
    ));
  };

  return (
    <>
      <SettingsPage
        title={t("settings:adminServiceAccounts.title")}
        description={t("settings:adminServiceAccounts.subtitle")}
        actions={newAccountButton}
      >
        <div className="space-y-3">
          {renderAccounts()}
          <SettingsNote icon={LockIcon}>
            {t("settings:adminServiceAccounts.note")}
          </SettingsNote>
        </div>
      </SettingsPage>

      <CreateServiceAccountDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <CreateServiceAccountKeyDialog
        account={keyAccount}
        onClose={() => setKeyAccount(null)}
        onCreated={setCreatedKey}
      />
      {createdKey ? (
        <ApiKeyCreatedDialog
          apiKey={createdKey}
          open
          onClose={() => setCreatedKey(null)}
        />
      ) : null}
      <ServiceAccountConfirmDialog
        action={pending}
        onClose={() => setPending(null)}
      />
    </>
  );
}

export default ServiceAccountsPanel;
