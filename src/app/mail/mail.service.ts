import { MagicLink } from './../../../node_modules/.prisma/client/index.d';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../../helper/base.response';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService extends ResponseHelper {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly ps: PrismaService,
    private readonly js: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.transporter = nodemailer.createTransport({
      ...this.configService.get('mail'),
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  /**
   * GENERATE + SAVE + SEND MAGIC LINK
   */
  async sendMagicLink(email: string) {
    try {
      const normalizedEmail = email.trim();
      const token = randomBytes(32).toString('hex');

      // Link Frontend (Pastikan env FRONTEND_URL sudah benar)
      const link = `https://widget.khlasify.com/api/embed?token=${token}`;

      // 1️⃣ Save token to DB
      await this.ps.client.magicLink.create({
        data: {
          email: normalizedEmail,
          token,
        },
      });

      // 2️⃣ Send Email Professional HTML
      await this.transporter.sendMail({
        // Branding Identity & Email Sender
        from: `"Khlasify" <verif@khlasify.com>`,
        to: email,
        subject: 'Log in to khlasify',
        html: `
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to khlasify</title>
  <style>
    /* Reset CSS dasar untuk email client */
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
  </style>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0;">
  
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
    
    <div style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #f3f4f6;">
      <img src="https://res.cloudinary.com/dldcpjdoz/image/upload/khlasify_Primary_Logo-transparent_prq4xe.png" alt="Khlasify Logo" style="width: 150px; height: auto; display: block; margin: 0 auto;">
    </div>

    <div style="padding: 40px 40px 32px 40px;">
      <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px; text-align: center;">Login to khlasify</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 26px; margin-bottom: 32px; text-align: center;">
        Click the button below to access your \nContent Preview Widget
      </p>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${link}" target="_blank" style="display: inline-block; background-color: #8D68D6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 50px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39); transition: background-color 0.2s;">
          Sign in to Khlasify
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin-bottom: 0; text-align: center;">
        This login link will expire in <strong>10 minutes</strong>.<br>
        if you didn't request this email, you can safely ignore it
      </p>
    </div>

    <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
        &copy; khlasify<br>
        Jakarta, Indonesia
      </p>
      <div style="margin-top: 12px;">
        <a href="https://khlasify.super.site/privacy-policy" style="color: #9ca3af; font-size: 12px; text-decoration: underline; margin: 0 8px;">Privacy Policy</a>
        <a href="https://khlasify.super.site/support" style="color: #9ca3af; font-size: 12px; text-decoration: underline; margin: 0 8px;">Support</a>
      </div>
    </div>
  </div>
  
  <div style="height: 40px;"></div>
  
</body>
</html>
        `,
      });

      return {
        message: 'Magic link sent successfully',
        token: token,
      };
    } catch (error) {
      console.error('MailService Error:', error);
      throw new InternalServerErrorException('Failed to send magic link');
    }
  }
}
