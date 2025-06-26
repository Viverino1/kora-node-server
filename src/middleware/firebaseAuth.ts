// filepath: c:\Users\vivek\Documents\Kora3\kora-node-server\src\middleware\firebaseAuth.ts
import { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../services/firebase/firebase.js";

export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  const decoded = await verifyFirebaseToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired Firebase token" });
  }
  (req as any).firebaseUser = decoded;
  next();
}
