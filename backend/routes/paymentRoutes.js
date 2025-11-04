import express from "express";
import { 
  getWalletBalance,
  topUpWallet,
  payWithWallet,
  createStripePayment,
  confirmStripePayment,
  getPaymentHistory,
  getWalletTransactions
} from "../controllers/paymentController.js";
import { auth, requireRegistering } from "../middleware/auth.js";

const router = express.Router();

// Wallet routes - restricted to Student, Staff, TA, Professor
router.get("/wallet/balance", auth, requireRegistering, getWalletBalance);
router.post("/wallet/top-up", auth, requireRegistering, topUpWallet);
router.get("/wallet/transactions", auth, requireRegistering, getWalletTransactions);

// Payment routes - restricted to Student, Staff, TA, Professor
router.post("/wallet/pay", auth, requireRegistering, payWithWallet);
router.post("/stripe/create-intent", auth, requireRegistering, createStripePayment);
router.post("/stripe/confirm", auth, requireRegistering, confirmStripePayment);
router.get("/history", auth, requireRegistering, getPaymentHistory);

export default router;
