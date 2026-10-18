import type { getServiceAccounts } from "./get-service-accounts";

export type ServiceAccount = Awaited<
  ReturnType<typeof getServiceAccounts>
>[number];

export type ServiceAccountKey = ServiceAccount["keys"][number];

export type ServiceAccountKeyTarget = {
  userId: string;
  keyId: string;
};

export type CreateServiceAccountKeyRequest = {
  userId: string;
  name: string;
  expiresIn: number | null;
};
