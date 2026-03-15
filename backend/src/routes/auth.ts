import type { Request, Response, Router } from "express";
import { register, login, getAuthUserById } from "../services/authService";

export function registerAuthRoutes(router: Router): void {
  router.post("/auth/register", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    try {
      const user = await register(String(email ?? ""), String(password ?? ""));
      (req.session as any) = (req.session as any) || {};
      (req.session as any).userId = user.id;
      return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (e: any) {
      if (e.message === "USER_EXISTS") {
        return res.status(409).json({ error: "User with this email already exists", code: "user_exists" });
      }
      if (e.message === "EMAIL_REQUIRED") {
        return res.status(400).json({ error: "Email is required", code: "email_required" });
      }
      if (e.message === "PASSWORD_TOO_SHORT") {
        return res.status(400).json({ error: "Password must be at least 6 characters", code: "password_short" });
      }
      console.error("Register error:", e);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  router.post("/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    const user = await login(String(email ?? ""), String(password ?? ""));
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password", code: "invalid_credentials" });
    }
    (req.session as any) = (req.session as any) || {};
    (req.session as any).userId = user.id;
    return res.json({ user: { id: user.id, email: user.email, role: user.role } });
  });

  router.post("/auth/logout", (req: Request, res: Response) => {
    req.session = undefined as any;
    res.json({ ok: true });
  });

  router.get("/auth/me", (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not logged in", code: "auth_required" });
    }
    const user = getAuthUserById(userId);
    if (!user) {
      req.session = undefined as any;
      return res.status(401).json({ error: "Not logged in", code: "auth_required" });
    }
    return res.json({ user: { id: user.id, email: user.email, role: user.role } });
  });
}
