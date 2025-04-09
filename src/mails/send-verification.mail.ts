import transporter from "../config/nodemailer.config";
import {VERIFICATION_EMAIL_TEMPLATE} from "../template/verification-mail.template"
import { LoggerService } from "../services/logger.service";

const logger = LoggerService.getInstance();

const sendVerificationEmail = async(userEmail: string, verficationCode: string) => {
    try {
        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: userEmail,
            subject: 'Verification Code',
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verficationCode}", verficationCode),
        });
    
        logger.info('Email sent: %s', {messageId: info.messageId});
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(message);
    }
}

export default sendVerificationEmail