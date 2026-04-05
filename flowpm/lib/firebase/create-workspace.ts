import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { slugify } from "@/lib/slug";

export async function createWorkspaceForNewUser(input: {
  uid: string;
  email: string;
  displayName: string;
  orgName: string;
}): Promise<string> {
  const db = getFirebaseDb();
  const orgRef = doc(collection(db, "organizations"));
  const userRef = doc(db, "users", input.uid);
  const memberRef = doc(db, "organizations", orgRef.id, "members", input.uid);
  const slug = `${slugify(input.orgName)}-${Math.random().toString(36).slice(2, 8)}`;

  await runTransaction(db, async (transaction) => {
    transaction.set(orgRef, {
      name: input.orgName,
      slug,
      ownerId: input.uid,
      plan: "free",
      createdAt: serverTimestamp(),
    });
    // Owner member before user doc so rules can relate member create to org create in the same transaction (getAfter).
    transaction.set(memberRef, {
      role: "owner",
      email: input.email,
      name: input.displayName,
      joinedAt: serverTimestamp(),
    });
    transaction.set(userRef, {
      email: input.email,
      name: input.displayName,
      currentOrgId: orgRef.id,
      createdAt: serverTimestamp(),
    });
  });

  return orgRef.id;
}
