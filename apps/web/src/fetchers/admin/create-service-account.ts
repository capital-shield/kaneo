import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

export async function createServiceAccount(name: string) {
  const response = await client.admin["service-accounts"].$post({
    json: { name },
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}
