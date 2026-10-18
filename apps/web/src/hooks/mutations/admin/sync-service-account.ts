import type { QueryClient } from "@tanstack/react-query";
import type { ServiceAccount } from "@/fetchers/admin/service-account-types";
import { ADMIN_USERS_QUERY_KEY } from "@/hooks/queries/admin/use-admin-users";
import { SERVICE_ACCOUNTS_QUERY_KEY } from "@/hooks/queries/admin/use-service-accounts";

export function syncServiceAccount(
  queryClient: QueryClient,
  account: ServiceAccount,
) {
  queryClient.setQueryData<ServiceAccount[]>(
    SERVICE_ACCOUNTS_QUERY_KEY,
    (accounts) =>
      accounts?.some((entry) => entry.id === account.id)
        ? accounts.map((entry) => (entry.id === account.id ? account : entry))
        : [account, ...(accounts ?? [])],
  );
  queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
}
