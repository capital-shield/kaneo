import { eq } from "drizzle-orm";
import db from "../database";
import { userTable } from "../database/schema";

export async function isServiceAccount(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isServiceAccount: userTable.isServiceAccount })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return row?.isServiceAccount === true;
}
