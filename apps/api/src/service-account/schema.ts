import { z } from "../openapi";

const DAY_SECONDS = 86_400;

export const serviceAccountParam = z.object({ userId: z.string() });

export const serviceAccountKeyParam = z.object({
  userId: z.string(),
  keyId: z.string(),
});

export const createServiceAccountBody = z.object({
  name: z.string().trim().min(1).max(100).openapi({
    description:
      "Display name shown on everything the account creates, e.g. Sync tool.",
  }),
});

export const createServiceAccountKeyBody = z.object({
  name: z.string().trim().min(1).max(32).openapi({
    description: "Label for the key, e.g. where it is deployed.",
  }),
  expiresIn: z
    .number()
    .int()
    .min(DAY_SECONDS)
    .max(365 * DAY_SECONDS)
    .nullable()
    .openapi({
      description:
        "Seconds until the key expires, from one day to one year. Null never expires.",
    }),
});
