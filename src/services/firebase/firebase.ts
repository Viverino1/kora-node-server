// filepath: c:\Users\vivek\Documents\Kora3\kora-node-server\src\services\firebase.ts
import admin from "firebase-admin";
import serviceAccount from "./cert.json";
import { Request } from "express";

// Initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any), // Or use cert() with your service account
  });
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    return null;
  }
}

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const user = (req as any).firebaseUser ?? null;
  return user?.uid ?? null;
}
