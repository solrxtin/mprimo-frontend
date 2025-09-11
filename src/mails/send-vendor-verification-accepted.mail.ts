import transporter from "../config/nodemailer.config";
import { LoggerService } from "../services/logger.service";
import dotenv from "dotenv";

dotenv.config();

const logger = LoggerService.getInstance();

const VENDOR_VERIFICATION_ACCEPTED_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .success { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verification Approved!</h1>
        </div>
        <div class="content">
            <h2>Hello {businessName},</h2>
            <p class="success">Congratulations! Your vendor verification has been approved.</p>
            <p>Your account is now <strong>verified</strong> and you can start selling on our platform.</p>
            <p>You now have access to:</p>
            <ul>
                <li>Full vendor dashboard</li>
                <li>Product listing capabilities</li>
                <li>Order management</li>
                <li>Payment processing</li>
            </ul>
            <p>Thank you for choosing Mprimo!</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Mprimo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const sendVendorVerificationAcceptedEmail = async (
  userEmail: string,
  businessName: string
) => {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: userEmail,
      subject: "Vendor Verification Approved - Welcome to Mprimo!",
      html: VENDOR_VERIFICATION_ACCEPTED_TEMPLATE.replace(
        "{businessName}",
        businessName
      ),
    });

    logger.info("Verification accepted email sent: %s", { messageId: info.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(message);
  }
};

export default sendVendorVerificationAcceptedEmail;