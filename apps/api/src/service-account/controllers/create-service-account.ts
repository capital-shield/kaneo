import { createId } from "@paralleldrive/cuid2";
import db from "../../database";
import { userTable } from "../../database/schema";
import { serviceAccountEmail } from "../service-account-email";
import getServiceAccount from "./get-service-account";

// Inserted directly rather than through Better Auth: the account has no
// credential to register, and the sign-up policy hooks are meant for people.
async function createServiceAccount({ name }: { name: string }) {
  const id = createId();
  await db.insert(userTable).values({
    id,
    name,
    email: serviceAccountEmail(name, id),
    emailVerified: false,
    role: "user",
    isServiceAccount: true,
  });
  return getServiceAccount(id);
}

export default createServiceAccount;
