import transporter from "../config/nodemailer.config";
import { VENDOR_WARNING_EMAIL_TEMPLATE } from "../template/vendor_warning_template";
import { LoggerService } from "../services/logger.service";

import dotenv from "dotenv";

dotenv.config();

const logger = LoggerService.getInstance();

const sendWarningEmail = async (
  userEmail: string,
  businessName: string,
  message: string
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: "Compliance Warning Notification",
      html: VENDOR_WARNING_EMAIL_TEMPLATE.replace(
        "{businessName}",
        businessName
      ).replace("{message}", message),
    });

    logger.info("Email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export default sendWarningEmail;
