import { nullableResponseTimestamp, responseTimestamp, z } from "../openapi";

export const serviceAccountKeySchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    start: z.string().nullable().openapi({
      description: "First characters of the key, to tell keys apart.",
    }),
    createdAt: responseTimestamp,
    expiresAt: nullableResponseTimestamp,
    lastRequest: nullableResponseTimestamp,
  })
  .openapi("ServiceAccountKey");

const serviceAccountWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});

export const serviceAccountSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    createdAt: responseTimestamp,
    banned: z.boolean(),
    keys: z.array(serviceAccountKeySchema),
    workspaces: z.array(serviceAccountWorkspaceSchema).openapi({
      description:
        "Workspaces the account belongs to. Its keys act with these roles.",
    }),
  })
  .openapi("ServiceAccount");

export const serviceAccountListSchema = z.array(serviceAccountSchema);

export const createdServiceAccountKeySchema = z
  .object({
    key: z.string().openapi({
      description:
        "The full key. It is shown only once and cannot be read back.",
    }),
    apiKey: serviceAccountKeySchema,
  })
  .openapi("CreatedServiceAccountKey");
