import request from "supertest";
import express from "express";
import {
  createCryptoWallet,
  getBalance,
  getUserWallet,
  getPaymentAddress,
  verifyPayment,
  processApplePayPayment,
  createApplePaySession,
  createPaymentIntent,
  processStripePayment,
} from "../../controllers/payment.controller";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: "mock-user-id", role: "user" };
  next();
});

app.post("/payments/create-intent", createPaymentIntent);
app.post("/payments/confirm", verifyPayment);

describe("Payment Controller", () => {
  describe("POST /payments/create-intent", () => {
    it("should create payment intent", async () => {
      const paymentData = {
        amount: 1000,
        currency: "USD",
        orderId: "mock-order-id",
      };

      const response = await request(app)
        .post("/payments/create-intent")
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBeDefined();
    });
  });

  describe("POST /payments/confirm", () => {
    it("should confirm payment", async () => {
      const confirmData = {
        paymentIntentId: "pi_mock_intent",
        orderId: "mock-order-id",
      };

      const response = await request(app)
        .post("/payments/confirm")
        .send(confirmData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /payments", () => {
    it("should get user payments", async () => {
      const response = await request(app).get("/payments").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
    });
  });
});
