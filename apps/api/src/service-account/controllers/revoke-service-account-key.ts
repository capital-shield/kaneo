import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { apikeyTable } from "../../database/schema";
import getServiceAccount from "./get-service-account";

async function revokeServiceAccountKey({
  userId,
  keyId,
}: {
  userId: string;
  keyId: string;
}) {
  const account = await getServiceAccount(userId);
  const [deleted] = await db
    .delete(apikeyTable)
    .where(
      and(eq(apikeyTable.id, keyId), eq(apikeyTable.referenceId, account.id)),
    )
    .returning({ id: apikeyTable.id });
  if (!deleted) {
    throw new HTTPException(404, { message: "API key not found" });
  }
  return getServiceAccount(account.id);
}

export default revokeServiceAccountKey;
