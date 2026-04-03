import { Router } from "express";
import { createorder, verifypayments } from "./payments.controllers";
import { authenticateToken } from "../middlewares/authentication";
const router = Router();

router.post("/turf/:turfId/slots/:slotId/orders", authenticateToken, createorder);
router.post("/payments/verify", authenticateToken, verifypayments);

export default router;