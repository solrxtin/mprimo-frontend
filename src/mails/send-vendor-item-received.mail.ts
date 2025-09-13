import transporter from "../config/nodemailer.config";
import { VENDOR_PRODUCT_REJECTION_EMAIL_TEMPLATE } from "../template/product-rejection-template";
import { LoggerService } from "../services/logger.service";

import dotenv from "dotenv";


dotenv.config();

const logger = LoggerService.getInstance();

const sendItemReceivedEmail = async (
  userEmail: string,
  businessName: string,
  receivedDate: string,
  productName: string,
  orderId: string,
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: `Item Received Confirmation - Order #${orderId}`,
      html: VENDOR_PRODUCT_REJECTION_EMAIL_TEMPLATE.replace(
        "{businessName}",
        businessName
      )
        .replace("{receivedDate}", receivedDate)
        .replace("{orderId}", orderId)
        .replace("{productName}", productName)
    });

    logger.info("Email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export default sendItemReceivedEmail;