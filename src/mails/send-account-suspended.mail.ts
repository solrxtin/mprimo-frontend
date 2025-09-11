import transporter from "../config/nodemailer.config";
import { VENDOR_SUSPENSION_EMAIL_TEMPLATE, VENDOR_UNSUSPENSION_EMAIL_TEMPLATE } from "../template/account-suspension-template";
import { LoggerService } from "../services/logger.service";

import dotenv from "dotenv";

dotenv.config();

const logger = LoggerService.getInstance();

const sendSuspensionEmail = async (
  userEmail: string,
  businessName: string,
  explanation: string,
  reason: string,
  duration: string
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: reason,
      html: VENDOR_SUSPENSION_EMAIL_TEMPLATE.replace(
        "{businessName}",
        businessName
      )
        .replace("{reason}", reason)
        .replace("{explanation}", explanation)
        .replace("{duration}", duration),
    });

    logger.info("Email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export const sendUnsuspensionEmail = async (
  userEmail: string,
  businessName: string,
  explanation: string,
  reason: string,
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: reason,
      html: VENDOR_UNSUSPENSION_EMAIL_TEMPLATE.replace(
        "{businessName}",
        businessName
      )
        .replace("{reason}", reason)
        .replace("{explanation}", explanation)
    });

    logger.info("Email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export default sendSuspensionEmail;
