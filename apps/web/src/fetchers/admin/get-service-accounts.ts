import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

export async function getServiceAccounts() {
  const response = await client.admin["service-accounts"].$get();

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}
