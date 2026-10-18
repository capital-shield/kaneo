import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deleteAdminUser } from "@/fetchers/admin/delete-admin-user";
import { ADMIN_USERS_QUERY_KEY } from "@/hooks/queries/admin/use-admin-users";
import { ADMIN_WORKSPACES_QUERY_KEY } from "@/hooks/queries/admin/use-admin-workspaces";
import {
  SERVICE_ACCOUNTS_QUERY_KEY,
  type ServiceAccount,
} from "@/hooks/queries/admin/use-service-accounts";
import { toast } from "@/lib/toast";

// Deletion reuses the instance admin user removal, which already cleans up
// the account's memberships and keys.
function useDeleteServiceAccount() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: (_data, userId) => {
      toast.success(t("settings:adminServiceAccounts.toast.deleted"), {
        icon: Trash2Icon,
      });
      queryClient.setQueryData<ServiceAccount[]>(
        SERVICE_ACCOUNTS_QUERY_KEY,
        (accounts) => accounts?.filter((account) => account.id !== userId),
      );
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_WORKSPACES_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("settings:adminServiceAccounts.toast.deleteError"),
      );
    },
  });
}

export default useDeleteServiceAccount;
