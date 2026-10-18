import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";
import type { ServiceAccountKeyTarget } from "./service-account-types";

export async function revokeServiceAccountKey({
  userId,
  keyId,
}: ServiceAccountKeyTarget) {
  const response = await client.admin["service-accounts"][":userId"].keys[
    ":keyId"
  ].$delete({
    param: { userId, keyId },
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}
