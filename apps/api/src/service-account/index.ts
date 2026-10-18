import {
  apiRouter,
  createRoute,
  errorResponse,
  jsonResponse,
} from "../openapi";
import { requireInstanceAdmin } from "../utils/require-instance-admin";
import { requireUserSession } from "../utils/require-user-session";
import createServiceAccount from "./controllers/create-service-account";
import createServiceAccountKey from "./controllers/create-service-account-key";
import listServiceAccounts from "./controllers/list-service-accounts";
import revokeServiceAccountKey from "./controllers/revoke-service-account-key";
import {
  createdServiceAccountKeySchema,
  serviceAccountListSchema,
  serviceAccountSchema,
} from "./response";
import {
  createServiceAccountBody,
  createServiceAccountKeyBody,
  serviceAccountKeyParam,
  serviceAccountParam,
} from "./schema";

const forbidden = errorResponse(
  "The caller is not an instance administrator or is authenticated with an API key",
);

const listServiceAccountsRoute = createRoute({
  method: "get",
  operationId: "listServiceAccounts",
  path: "/",
  tags: ["Admin"],
  summary: "List service accounts",
  description:
    "List every service account with its API keys and workspace memberships. Service accounts are non-human users for integrations: they sign in only with API keys and never hold a session.",
  middleware: [requireUserSession, requireInstanceAdmin] as const,
  responses: {
    200: jsonResponse("Service accounts", serviceAccountListSchema),
    403: forbidden,
  },
});

const createServiceAccountRoute = createRoute({
  method: "post",
  operationId: "createServiceAccount",
  path: "/",
  tags: ["Admin"],
  summary: "Create a service account",
  description:
    "Create a service account. It belongs to no workspace until an administrator adds it to one, and it can act only through API keys created for it.",
  middleware: [requireUserSession, requireInstanceAdmin] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: createServiceAccountBody } },
    },
  },
  responses: {
    201: jsonResponse("The new service account", serviceAccountSchema),
    400: errorResponse("Invalid name"),
    403: forbidden,
  },
});

const createServiceAccountKeyRoute = createRoute({
  method: "post",
  operationId: "createServiceAccountKey",
  path: "/{userId}/keys",
  tags: ["Admin"],
  summary: "Create a service account API key",
  description:
    "Create an API key for a service account. The full key is returned only in this response.",
  middleware: [requireUserSession, requireInstanceAdmin] as const,
  request: {
    params: serviceAccountParam,
    body: {
      required: true,
      content: { "application/json": { schema: createServiceAccountKeyBody } },
    },
  },
  responses: {
    201: jsonResponse("The new key", createdServiceAccountKeySchema),
    400: errorResponse("Invalid name or expiry"),
    403: forbidden,
    404: errorResponse("Service account not found"),
  },
});

const revokeServiceAccountKeyRoute = createRoute({
  method: "delete",
  operationId: "revokeServiceAccountKey",
  path: "/{userId}/keys/{keyId}",
  tags: ["Admin"],
  summary: "Revoke a service account API key",
  description:
    "Delete a service account's API key. Requests using it fail immediately. Returns the updated service account.",
  middleware: [requireUserSession, requireInstanceAdmin] as const,
  request: { params: serviceAccountKeyParam },
  responses: {
    200: jsonResponse("Updated service account", serviceAccountSchema),
    403: forbidden,
    404: errorResponse("Service account or key not found"),
  },
});

const serviceAccounts = apiRouter()
  .openapi(listServiceAccountsRoute, async (c) =>
    c.json(await listServiceAccounts(), 200),
  )
  .openapi(createServiceAccountRoute, async (c) =>
    c.json(await createServiceAccount(c.req.valid("json")), 201),
  )
  .openapi(createServiceAccountKeyRoute, async (c) =>
    c.json(
      await createServiceAccountKey({
        userId: c.req.valid("param").userId,
        ...c.req.valid("json"),
      }),
      201,
    ),
  )
  .openapi(revokeServiceAccountKeyRoute, async (c) =>
    c.json(await revokeServiceAccountKey(c.req.valid("param")), 200),
  );

export default serviceAccounts;
