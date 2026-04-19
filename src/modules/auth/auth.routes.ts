import { Router } from "express";
import { signup, login, forgotpasswords, verifyotps ,rotatoken, resetpasswords} from "./auth.controllers";
import { validateRequest } from "../../middlewares/validate";
import { otpAttemptLimit,otprequest } from "../../middlewares/otprequest";
import { userSignupSchema, userLoginSchema } from "./auth.types";
import { passwordAttemptLimit } from "../../middlewares/passwords";
const router = Router();

router.post("/signup",validateRequest(userSignupSchema), signup);
router.post("/login", validateRequest(userLoginSchema), passwordAttemptLimit, login);
router.post("/forgot-password", otprequest, forgotpasswords);
router.post("/verify-otp",otpAttemptLimit, verifyotps);
router.post("/reset-password", resetpasswords);
router.post("/rotate-token", rotatoken);

export default router;