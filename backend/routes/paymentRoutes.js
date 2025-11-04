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
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Wallet routes
router.get("/wallet/balance", auth, getWalletBalance);
router.post("/wallet/top-up", auth, topUpWallet);
router.get("/wallet/transactions", auth, getWalletTransactions);

// Payment routes
router.post("/wallet/pay", auth, payWithWallet);
router.post("/stripe/create-intent", auth, createStripePayment);
router.post("/stripe/confirm", auth, confirmStripePayment);
router.get("/history", auth, getPaymentHistory);

export default router;
