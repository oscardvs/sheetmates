/**
 * Bootstrap the first admin (or promote any user) from the command line.
 *
 * Usage:
 *   1. Provide credentials via GOOGLE_APPLICATION_CREDENTIALS (service account
 *      JSON) or run inside an authenticated `firebase` / gcloud environment.
 *   2. From the functions/ directory:
 *        npm run set-admin -- you@example.com
 *
 * This sets the `admin` custom claim and the `users/{uid}.role` field that the
 * Firestore rules check. After the first admin exists, use the `grantAdmin`
 * callable from the app instead.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run set-admin -- <email>");
    process.exit(1);
  }

  initializeApp({ credential: applicationDefault() });
  const auth = getAuth();
  const db = getFirestore();

  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  await db.collection("users").doc(user.uid).set(
    { role: "admin", updatedAt: Timestamp.now() },
    { merge: true }
  );

  console.log(`✓ ${email} (${user.uid}) is now an admin.`);
  console.log("Note: the user must sign out and back in to refresh their token.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
