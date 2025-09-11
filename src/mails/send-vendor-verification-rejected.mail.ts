import transporter from "../config/nodemailer.config";
import { LoggerService } from "../services/logger.service";
import dotenv from "dotenv";

dotenv.config();

const logger = LoggerService.getInstance();

const VENDOR_VERIFICATION_REJECTED_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .error { color: #dc3545; font-weight: bold; }
        .reason { background: #fff; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verification Update</h1>
        </div>
        <div class="content">
            <h2>Hello {businessName},</h2>
            <p class="error">Unfortunately, your vendor verification has been rejected.</p>
            <div class="reason">
                <h3>Reason for Rejection:</h3>
                <p>{reason}</p>
            </div>
            <p>You can resubmit your verification documents after addressing the issues mentioned above.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thank you for your understanding.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Mprimo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const sendVendorVerificationRejectedEmail = async (
  userEmail: string,
  businessName: string,
  reason: string
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: "Vendor Verification Update - Action Required",
      html: VENDOR_VERIFICATION_REJECTED_TEMPLATE
        .replace("{businessName}", businessName)
        .replace("{reason}", reason),
    });

    logger.info("Verification rejected email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export default sendVendorVerificationRejectedEmail;