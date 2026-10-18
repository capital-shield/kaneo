import { useQuery } from "@tanstack/react-query";
import { getServiceAccounts } from "@/fetchers/admin/get-service-accounts";

export type {
  ServiceAccount,
  ServiceAccountKey,
} from "@/fetchers/admin/service-account-types";

export const SERVICE_ACCOUNTS_QUERY_KEY = [
  "admin",
  "service-accounts",
] as const;

function useServiceAccounts() {
  return useQuery({
    queryKey: SERVICE_ACCOUNTS_QUERY_KEY,
    queryFn: getServiceAccounts,
  });
}

export default useServiceAccounts;
