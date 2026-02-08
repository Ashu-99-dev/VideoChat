import express from "express";
import { login, logout, onboard, signup, verifyEmail, resendVerificationEmail } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

router.post("/onboarding", protectRoute, onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;