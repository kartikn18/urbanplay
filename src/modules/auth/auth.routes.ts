import { Router } from "express";
import { signup, login, forgotpasswords, verifyotps ,rotatoken, resetpasswords} from "./auth.controllers";
import { validateRequest } from "../../middlewares/validate";
import { userSignupSchema, userLoginSchema } from "./auth.types";
const router = Router();

router.post("/signup",validateRequest(userSignupSchema), signup);
router.post("/login", validateRequest(userLoginSchema), login);
router.post("/forgot-password", forgotpasswords);
router.post("/verify-otp", verifyotps);
router.post("/reset-password", resetpasswords);
router.post("/rotate-token", rotatoken);

export default router;