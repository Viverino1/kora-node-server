import { Clerk, verifyToken } from "@clerk/clerk-sdk-node";
import { Request } from "express";
import { clerkIssuer, clerkSecretKey } from "../server.js";

export default class ClerkService {
  private static _clerk: ReturnType<typeof Clerk> | null = null;

  public static get secretKey() {
    return clerkSecretKey;
  }

  public static get issuer() {
    return clerkIssuer;
  }

  public static get clerk(): ReturnType<typeof Clerk> {
    if (!this._clerk) {
      this._clerk = Clerk({ secretKey: this.secretKey });
    }
    return this._clerk;
  }

  public static async getUserFromRequest(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    try {
      const { sub: userId } = await verifyToken(token, {
        secretKey: this.secretKey,
        issuer: this.issuer!,
      });

      return userId;
    } catch (error) {
      return null;
    }
  }
}
