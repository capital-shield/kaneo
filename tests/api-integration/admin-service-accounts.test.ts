import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { auth } from "../../apps/api/src/auth";
import db, { schema } from "../../apps/api/src/database";
import { verifyApiKey } from "../../apps/api/src/utils/verify-api-key";
import { mockAuthenticatedSession } from "./helpers/auth";
import { createInstanceAdmin } from "./helpers/admin/create-instance-admin";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";
import { resetTestDatabase } from "./helpers/database";
import { projectAccessApi } from "./helpers/project-access/project-access-api";

beforeEach(resetTestDatabase);

type ServiceAccount = {
  id: string;
  name: string;
  email: string;
  keys: { id: string; name: string | null; start: string | null }[];
  workspaces: { id: string; role: string }[];
};

async function createRegularUser() {
  const id = `user-${randomUUID()}`;
  const [user] = await db
    .insert(schema.userTable)
    .values({ id, email: `${id}@example.com`, name: "Regular" })
    .returning();
  return user;
}

async function asAdmin() {
  mockAuthenticatedSession(await createInstanceAdmin());
  return projectAccessApi();
}

async function createAccount(
  request: ReturnType<typeof projectAccessApi>,
  name = "Sync tool",
) {
  const response = await request("/admin/service-accounts", {
    method: "POST",
    body: { name },
  });
  expect(response.status).toBe(201);
  return (await response.json()) as ServiceAccount;
}

async function createKey(
  request: ReturnType<typeof projectAccessApi>,
  userId: string,
  expiresIn: number | null = null,
) {
  const response = await request(`/admin/service-accounts/${userId}/keys`, {
    method: "POST",
    body: { name: "production", expiresIn },
  });
  expect(response.status).toBe(201);
  return (await response.json()) as {
    key: string;
    apiKey: { id: string; expiresAt: string | null };
  };
}

describe("instance admin service accounts", () => {
  it("is limited to instance administrators", async () => {
    mockAuthenticatedSession(await createRegularUser());
    const request = projectAccessApi();

    expect((await request("/admin/service-accounts")).status).toBe(403);
    expect(
      (
        await request("/admin/service-accounts", {
          method: "POST",
          body: { name: "Sync tool" },
        })
      ).status,
    ).toBe(403);
  });

  it("creates a flagged account with no credentials and an undeliverable email", async () => {
    const request = await asAdmin();
    const account = await createAccount(request);

    expect(account.name).toBe("Sync tool");
    expect(account.email).toMatch(/^sync-tool-.+@service-account\.invalid$/);
    const [row] = await db
      .select()
      .from(schema.userTable)
      .where(eq(schema.userTable.id, account.id));
    expect(row).toMatchObject({ isServiceAccount: true, role: "user" });
    const accounts = await db
      .select()
      .from(schema.accountTable)
      .where(eq(schema.accountTable.userId, account.id));
    expect(accounts).toHaveLength(0);

    const list = (await (
      await request("/admin/service-accounts")
    ).json()) as ServiceAccount[];
    expect(list.map((entry) => entry.id)).toEqual([account.id]);
  });

  it("issues a key that authenticates as the account and lists without its secret", async () => {
    const request = await asAdmin();
    const account = await createAccount(request);
    const { key, apiKey } = await createKey(request, account.id);

    expect(apiKey.expiresAt).toBeNull();
    const verified = await verifyApiKey(key);
    expect(verified?.status).toBe("valid");
    expect(verified && "key" in verified && verified.key.userId).toBe(
      account.id,
    );

    const [listed] = (await (
      await request("/admin/service-accounts")
    ).json()) as ServiceAccount[];
    expect(listed?.keys).toEqual([
      expect.objectContaining({ id: apiKey.id, name: "production" }),
    ]);
    expect(JSON.stringify(listed)).not.toContain(key);
  });

  it("lets the key read a workspace only once the account is a member", async () => {
    const request = await asAdmin();
    const { workspace } = await createWorkspaceMember({ role: "owner" });
    await createProjectFixture({ workspaceId: workspace.id, name: "Alpha" });
    const account = await createAccount(request);
    const { key } = await createKey(request, account.id);
    const asKey = projectAccessApi({ "x-api-key": key });
    const listProjects = () => asKey(`/project?workspaceId=${workspace.id}`);

    expect((await listProjects()).ok).toBe(false);

    const added = await request(`/admin/workspaces/${workspace.id}/members`, {
      method: "POST",
      body: { userId: account.id, role: "member" },
    });
    expect(added.status).toBe(200);

    const response = await listProjects();
    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { name: string }[]).map((p) => p.name),
    ).toEqual(["Alpha"]);
    expect(
      (await asKey("/admin/service-accounts")).status,
      "a key must not reach admin routes",
    ).toBe(403);
  });

  it("applies the requested expiry", async () => {
    const request = await asAdmin();
    const account = await createAccount(request);
    const { apiKey } = await createKey(request, account.id, 86_400);

    const expiresAt = new Date(apiKey.expiresAt ?? 0).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now() + 86_000_000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + 86_400_000);
  });

  it("revokes a key so it stops authenticating", async () => {
    const request = await asAdmin();
    const account = await createAccount(request);
    const { key, apiKey } = await createKey(request, account.id);

    const response = await request(
      `/admin/service-accounts/${account.id}/keys/${apiKey.id}`,
      { method: "DELETE" },
    );

    expect(response.status).toBe(200);
    expect(((await response.json()) as ServiceAccount).keys).toEqual([]);
    expect(await verifyApiKey(key)).toBeNull();
  });

  it("does not manage keys of regular users", async () => {
    const request = await asAdmin();
    const user = await createRegularUser();
    const account = await createAccount(request);
    const userKey = await auth.api.createApiKey({
      body: { userId: user.id, name: "personal" },
    });

    expect(
      (
        await request(`/admin/service-accounts/${user.id}/keys`, {
          method: "POST",
          body: { name: "production", expiresIn: null },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(
          `/admin/service-accounts/${account.id}/keys/${userKey.id}`,
          { method: "DELETE" },
        )
      ).status,
    ).toBe(404);
    expect((await verifyApiKey(userKey.key))?.status).toBe("valid");
  });

  it("refuses to issue a session to a service account", async () => {
    const request = await asAdmin();
    const account = await createAccount(request);
    const user = await createRegularUser();
    const { internalAdapter } = await auth.$context;

    await expect(internalAdapter.createSession(account.id)).rejects.toThrow(
      /cannot sign in/i,
    );
    await expect(internalAdapter.createSession(user.id)).resolves.toBeTruthy();
    const sessions = await db
      .select()
      .from(schema.sessionTable)
      .where(eq(schema.sessionTable.userId, account.id));
    expect(sessions).toHaveLength(0);
  });
});
