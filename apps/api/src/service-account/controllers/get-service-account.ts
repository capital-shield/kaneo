import { HTTPException } from "hono/http-exception";
import listServiceAccounts from "./list-service-accounts";

async function getServiceAccount(userId: string) {
  const [account] = await listServiceAccounts([userId]);
  if (!account) {
    throw new HTTPException(404, { message: "Service account not found" });
  }
  return account;
}

export default getServiceAccount;
