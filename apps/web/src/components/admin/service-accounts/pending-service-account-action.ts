import type {
  ServiceAccount,
  ServiceAccountKey,
} from "@/hooks/queries/admin/use-service-accounts";

export type PendingServiceAccountAction =
  | { type: "revoke-key"; account: ServiceAccount; key: ServiceAccountKey }
  | { type: "delete-account"; account: ServiceAccount };
