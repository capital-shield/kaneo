import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createServiceAccountKey } from "@/fetchers/admin/create-service-account-key";
import { SERVICE_ACCOUNTS_QUERY_KEY } from "@/hooks/queries/admin/use-service-accounts";
import { toast } from "@/lib/toast";

function useCreateServiceAccountKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceAccountKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_ACCOUNTS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("settings:adminServiceAccounts.toast.keyCreateError"),
      );
    },
  });
}

export default useCreateServiceAccountKey;
