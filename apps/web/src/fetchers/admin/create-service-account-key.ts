import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";
import type { CreateServiceAccountKeyRequest } from "./service-account-types";

export async function createServiceAccountKey({
  userId,
  name,
  expiresIn,
}: CreateServiceAccountKeyRequest) {
  const response = await client.admin["service-accounts"][":userId"].keys.$post(
    {
      param: { userId },
      json: { name, expiresIn },
    },
  );

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}
