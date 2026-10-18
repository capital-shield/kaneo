import { auth } from "../../auth";
import getServiceAccount from "./get-service-account";

async function createServiceAccountKey(request: {
  userId: string;
  name: string;
  expiresIn: number | null;
}) {
  const account = await getServiceAccount(request.userId);

  // A server call without headers may name the key's owner; it still gets the
  // plugin's hashing, rate limit and expiry defaults.
  const created = await auth.api.createApiKey({
    body: {
      userId: account.id,
      name: request.name,
      expiresIn: request.expiresIn,
    },
  });

  return {
    key: created.key,
    apiKey: {
      id: created.id,
      name: created.name ?? null,
      start: created.start ?? null,
      createdAt: new Date(created.createdAt),
      expiresAt: created.expiresAt ? new Date(created.expiresAt) : null,
      lastRequest: null,
    },
  };
}

export default createServiceAccountKey;
