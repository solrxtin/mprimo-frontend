import transporter from "../config/nodemailer.config";
import {PASSWORD_RESET_SUCCESS_TEMPLATE} from "../template/password-reset.template"
import { LoggerService } from "../services/logger.service";

const logger = LoggerService.getInstance();

const sendPasswordResetEmail = async(userEmail: string, resetUrl: string) => {
    try {
        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: userEmail,
            subject: 'Reset your password',
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        });
    
        logger.info('Email sent: %s', {messageId: info.messageId});
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(message);
    }
}

export default sendPasswordResetEmail
