import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config()

const transporter = nodemailer.createTransport({
  host: "server353.web-hosting.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export default transporter;
