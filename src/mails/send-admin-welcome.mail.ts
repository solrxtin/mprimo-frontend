import transporter from "../config/nodemailer.config";
import { LoggerService } from "../services/logger.service";
import dotenv from "dotenv";

dotenv.config();
const logger = LoggerService.getInstance();

const ADMIN_WELCOME_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MPRIMO Admin</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MPRIMO Admin</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your admin account has been created</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello {name},</h2>
        
        <p>Your admin account has been successfully created for the MPRIMO platform. Below are your login credentials:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">Login Credentials</h3>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Password:</strong> <code style="background: #f4f4f4; padding: 2px 6px; border-radius: 4px;">{password}</code></p>
            <p><strong>Role:</strong> {role}</p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Important Security Notice:</strong></p>
            <p style="margin: 5px 0 0 0; color: #856404;">Please change your password immediately after your first login for security purposes.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/admin/login" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Login to Admin Panel
            </a>
        </div>
        
        <p>If you have any questions or need assistance, please contact the system administrator.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
            This is an automated message from MPRIMO Admin System.<br>
            Please do not reply to this email.
        </p>
    </div>
</body>
</html>
`;

function replacePlaceholders(template: string, values: Record<string, string>) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
}

const sendAdminWelcomeEmail = async (
    userEmail: string,
    name: string,
    password: string,
    role: string
) => {
    if (!userEmail || !name || !password || !role) {
        throw new Error("Missing required parameters for admin welcome email");
    }

    const emailContent = replacePlaceholders(ADMIN_WELCOME_TEMPLATE, {
        name,
        email: userEmail,
        password,
        role,
    });

    try {
        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: userEmail,
            subject: "Welcome to MPRIMO Admin - Your Account Details",
            html: emailContent,
        });

        logger.info("Admin welcome email sent", { 
            messageId: info.messageId,
            recipient: userEmail,
            role 
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to send admin welcome email", { error: message, recipient: userEmail });
        throw new Error(`Failed to send welcome email: ${message}`);
    }
};

export default sendAdminWelcomeEmail;