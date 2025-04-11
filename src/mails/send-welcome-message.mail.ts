import {WELCOME_EMAIL_TEMPLATE} from "../template/welcome-email.template"
import transporter from "../config/nodemailer.config";
import { LoggerService } from "../services/logger.service";
import dotenv from "dotenv";

dotenv.config();
const logger = LoggerService.getInstance();

function replacePlaceholders(template: string, values: Record<string, string>) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
}

const sendWelcomeEmail = async(userEmail: string, name: string) => {
    if (!userEmail) {
        console.error("Error: No recipient email address provided.");
        throw new Error("No recipient email address provided.");
    }

    if (!name) {
        console.error("Error: No recipient name provided.");
        throw new Error("No recipient name provided.");
    }

    const emailContent = replacePlaceholders(WELCOME_EMAIL_TEMPLATE, { name });
    
    try {
        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: userEmail,
            subject: 'Welcome',
            html: emailContent,
        });
    
        logger.info('Email sent: %s', {messageId: info.messageId});
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(message);
    }
}

export default sendWelcomeEmail
