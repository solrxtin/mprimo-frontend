import transporter from "../config/nodemailer.config";
import { VENDOR_PRODUCT_REJECTION_EMAIL_TEMPLATE } from "../template/product-rejection-template";
import { LoggerService } from "../services/logger.service";

import dotenv from "dotenv";


dotenv.config();

const logger = LoggerService.getInstance();

const sendItemRejectionEmail = async (
  userEmail: string,
  businessName: string,
  explanation: string,
  reason: string,
  orderId: string,
  productId: string
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: reason,
      html: VENDOR_PRODUCT_REJECTION_EMAIL_TEMPLATE.replace(
        "{businessName}",
        businessName
      )
        .replace("{reason}", reason)
        .replace("{explanation}", explanation)
        .replace("{orderId}", orderId)
        .replace("{productId}", productId)
    });

    logger.info("Email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export default sendItemRejectionEmail;