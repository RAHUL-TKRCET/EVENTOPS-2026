import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticateJWT } from "../../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/register", AuthController.register);
authRouter.get("/me", authenticateJWT, AuthController.getMe);
authRouter.post("/switch-role", authenticateJWT, AuthController.switchRole);
authRouter.post("/invite/verify", AuthController.verifyInvite);
