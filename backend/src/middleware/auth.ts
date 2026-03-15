import type { Request, Response, NextFunction } from "express";
import { getAuthUserById, type AuthUser } from "../services/authService";

declare global {
  namespace Express {
    interface Session{
      userId?: string;
    }
    interface Request{
      user ?: AuthUser;
    }
  }
}

export function requreAuth (req: Request, res: Response, next: NextFunction): void{
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json( { error: "Unauthorized", code: "auth_required"}); // 401 - неавторизированный UnAuthorized
    return;
  }
  const user = getAuthUserById(userId);
  if (!user) {
    req.session = undefined as any;
    res.status(401).json( {error: "Unathorized", code: "auth_required"});
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void{
  if (!req.user) {
    res.status(401).json({error: "Unathorized", code: "auth_required"});
    return;
  }
  if (req.user.role !== "admin"){
    res.status(403).json({error: "Forbidden", code: "admin_required"});
    return;
  }
  next();
}

