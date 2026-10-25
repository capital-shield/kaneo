function stringOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function mapCustomOAuthProfileToUser(
  profile: Record<string, unknown>,
  options: { trustEmail?: boolean } = {},
) {
  const email = stringOrEmpty(profile.email);
  const nameFromParts = [
    stringOrEmpty(profile.given_name),
    stringOrEmpty(profile.family_name),
  ]
    .filter(Boolean)
    .join(" ");

  const fallbackName = [
    stringOrEmpty(profile.name),
    nameFromParts,
    stringOrEmpty(profile.preferred_username),
    email ? email.split("@")[0] : "",
  ].find(Boolean);

  return {
    ...(fallbackName ? { name: fallbackName } : {}),
    // Some providers, such as Microsoft Entra ID, never send `email_verified`.
    // Operators who control their provider can opt in to vouch for its email.
    ...(options.trustEmail ? { emailVerified: true } : {}),
  };
}
