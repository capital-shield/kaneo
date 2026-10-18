// `.invalid` is reserved (RFC 2606), so no mailbox can ever receive a sign-in
// link or code for this address, and no identity provider can assert it.
export const SERVICE_ACCOUNT_EMAIL_DOMAIN = "service-account.invalid";

export function serviceAccountEmail(name: string, id: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "service"}-${id.toLowerCase()}@${SERVICE_ACCOUNT_EMAIL_DOMAIN}`;
}
