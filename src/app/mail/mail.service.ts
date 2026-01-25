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
      const link = `${process.env.FRONTEND_URL}/api/embed?token=${token}`;

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
        from: `"Khlasify" <hello@khlasify.com>`,
        to: email,
        subject: 'Log in to Khlasify',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login to Khlasify</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0;">
          
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <div style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #f3f4f6;">
              <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Khlasify</h1>
            </div>

            <div style="padding: 40px;">
              <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Welcome back!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
                You requested a magic link to sign in to your <strong>Khlasify</strong> account. Click the button below to log in securely.
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${link}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; transition: background-color 0.2s;">
                  Sign in to Khlasify
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-bottom: 0;">
                This link will expire in <strong>10 minutes</strong>. If you didn't request this email, you can safely ignore it.
              </p>
            </div>

            <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Khlasify Inc. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">
                <a href="#" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a> • <a href="#" style="color: #9ca3af; text-decoration: underline;">Contact Support</a>
              </p>
            </div>
          </div>
          
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
