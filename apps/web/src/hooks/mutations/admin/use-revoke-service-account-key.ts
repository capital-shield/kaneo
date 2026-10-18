import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { revokeServiceAccountKey } from "@/fetchers/admin/revoke-service-account-key";
import { toast } from "@/lib/toast";
import { syncServiceAccount } from "./sync-service-account";

function useRevokeServiceAccountKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeServiceAccountKey,
    onSuccess: (account) => {
      toast.success(t("settings:adminServiceAccounts.toast.keyRevoked"), {
        icon: Trash2Icon,
      });
      syncServiceAccount(queryClient, account);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("settings:adminServiceAccounts.toast.keyRevokeError"),
      );
    },
  });
}

export default useRevokeServiceAccountKey;
