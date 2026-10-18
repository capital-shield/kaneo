import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createServiceAccount } from "@/fetchers/admin/create-service-account";
import { toast } from "@/lib/toast";
import { syncServiceAccount } from "./sync-service-account";

function useCreateServiceAccount() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceAccount,
    onSuccess: (account) => {
      toast.success(t("settings:adminServiceAccounts.toast.created"));
      syncServiceAccount(queryClient, account);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("settings:adminServiceAccounts.toast.createError"),
      );
    },
  });
}

export default useCreateServiceAccount;
