import { and, asc, desc, eq, inArray } from "drizzle-orm";
import db from "../../database";
import {
  apikeyTable,
  userTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";

async function listServiceAccounts(ids?: string[]) {
  const accounts = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      createdAt: userTable.createdAt,
      banned: userTable.banned,
    })
    .from(userTable)
    .where(
      and(
        eq(userTable.isServiceAccount, true),
        ids ? inArray(userTable.id, ids) : undefined,
      ),
    )
    .orderBy(desc(userTable.createdAt), desc(userTable.id));
  if (accounts.length === 0) return [];

  const accountIds = accounts.map((account) => account.id);
  const [keys, memberships] = await Promise.all([
    db
      .select({
        id: apikeyTable.id,
        referenceId: apikeyTable.referenceId,
        name: apikeyTable.name,
        start: apikeyTable.start,
        createdAt: apikeyTable.createdAt,
        expiresAt: apikeyTable.expiresAt,
        lastRequest: apikeyTable.lastRequest,
      })
      .from(apikeyTable)
      .where(inArray(apikeyTable.referenceId, accountIds))
      .orderBy(desc(apikeyTable.createdAt)),
    db
      .select({
        userId: workspaceUserTable.userId,
        id: workspaceTable.id,
        name: workspaceTable.name,
        role: workspaceUserTable.role,
      })
      .from(workspaceUserTable)
      .innerJoin(
        workspaceTable,
        eq(workspaceUserTable.workspaceId, workspaceTable.id),
      )
      .where(inArray(workspaceUserTable.userId, accountIds))
      .orderBy(asc(workspaceTable.name)),
  ]);

  return accounts.map((account) => ({
    ...account,
    banned: account.banned ?? false,
    keys: keys
      .filter((key) => key.referenceId === account.id)
      .map(({ referenceId: _, ...key }) => key),
    workspaces: memberships
      .filter((membership) => membership.userId === account.id)
      .map(({ userId: _, ...membership }) => membership),
  }));
}

export default listServiceAccounts;
