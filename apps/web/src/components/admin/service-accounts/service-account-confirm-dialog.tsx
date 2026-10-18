import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import useDeleteServiceAccount from "@/hooks/mutations/admin/use-delete-service-account";
import useRevokeServiceAccountKey from "@/hooks/mutations/admin/use-revoke-service-account-key";
import type { PendingServiceAccountAction } from "./pending-service-account-action";

type ServiceAccountConfirmDialogProps = {
  action: PendingServiceAccountAction | null;
  onClose: () => void;
};

export function ServiceAccountConfirmDialog({
  action,
  onClose,
}: ServiceAccountConfirmDialogProps) {
  const { t } = useTranslation();
  const revokeKey = useRevokeServiceAccountKey();
  const deleteAccount = useDeleteServiceAccount();
  const pending = revokeKey.isPending || deleteAccount.isPending;

  const handleConfirm = async () => {
    if (!action) return;
    try {
      if (action.type === "revoke-key") {
        await revokeKey.mutateAsync({
          userId: action.account.id,
          keyId: action.key.id,
        });
      } else {
        await deleteAccount.mutateAsync(action.account.id);
      }
      onClose();
    } catch {
      // The mutation's onError already reported it; keep the dialog open.
    }
  };

  const copy =
    action?.type === "revoke-key"
      ? {
          title: t("settings:adminServiceAccounts.confirm.revoke.title", {
            name: action.key.name || t("settings:developerPage.unnamedKey"),
          }),
          description: t(
            "settings:adminServiceAccounts.confirm.revoke.description",
            { name: action.account.name },
          ),
          action: t("settings:adminServiceAccounts.revokeKey"),
        }
      : {
          title: t("settings:adminServiceAccounts.confirm.delete.title", {
            name: action?.account.name ?? "",
          }),
          description: t(
            "settings:adminServiceAccounts.confirm.delete.description",
          ),
          action: t("settings:adminServiceAccounts.confirm.delete.action"),
        };

  return (
    <ConfirmDialog
      open={action !== null}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.action}
      pendingLabel={t("settings:adminServiceAccounts.confirm.working")}
      pending={pending}
      onConfirm={handleConfirm}
    />
  );
}
