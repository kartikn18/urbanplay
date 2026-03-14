import { Router } from "express";
import { signup, login, forgotpasswords, verifyotps, resetpassword ,rotatoken} from "./auth.controllers";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotpasswords);
router.post("/verify-otp", verifyotps);
router.post("/reset-password", resetpassword);
router.post("/rotate-token", rotatoken);

export default router;