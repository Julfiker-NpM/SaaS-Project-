import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { createWorkspaceForNewUser } from "@/lib/firebase/create-workspace";

/**
 * If this Firebase user has no Firestore profile yet, create org + user + member (same as email sign-up).
 * Used after Google sign-in on the sign-up flow so the app can land on the real dashboard.
 */
export async function ensureWorkspaceForSignedInUser(user: User): Promise<void> {
  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email) {
    throw new Error("Your Google account has no email on file. Use a different Google account or sign up with email.");
  }
  const db = getFirebaseDb();
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (userSnap.exists()) return;

  const dn = user.displayName?.trim();
  const displayName =
    dn && dn.length >= 2 ? dn : email.split("@")[0]!.slice(0, 48) || "User";
  const orgName =
    dn && dn.length >= 2 ? `${dn}'s workspace` : `${displayName}'s workspace`;

  await createWorkspaceForNewUser({
    uid: user.uid,
    email,
    displayName,
    orgName: orgName.length >= 2 ? orgName : "My workspace",
  });
}
