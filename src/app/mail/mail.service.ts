import { MagicLink } from './../../../node_modules/.prisma/client/index.d';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { addMinutes } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../../helper/base.response';
import { JwtHelper } from 'src/helper/jwt.generate';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

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
      // const token = await JwtHelper.generateAccessToken(this.js, {
      //   sub: 'magic-link',
      //   email: normalizedEmail,
      // });

      const link = `${process.env.FRONTEND_URL}/api/embed?token=${token}`;
      // const resend = new Resend();
      // await resend.emails.send({
      //   from: `"Khalify" <${process.env.SMTP_USER_EMAIL}>`,
      //   to: email,
      //   subject: 'Your Secure Login Link',
      //   html: `
      //     <div style="font-family: Arial, sans-serif">
      //       <h2>Sign in to Khalify</h2>
      //       <p>Click the button below to securely sign in.</p>
      //       <a
      //         href="${link}"
      //         style="
      //           display:inline-block;
      //           padding:12px 20px;
      //           background:#4f46e5;
      //           color:#fff;
      //           text-decoration:none;
      //           border-radius:6px;
      //           margin:16px 0;
      //         "
      //       >
      //         Sign in
      //       </a>
      //       <p>This link will expire in 10 minutes.</p>
      //       <p style="font-size:12px;color:#666">
      //         If you didn’t request this, ignore this email.
      //       </p>
      //     </div>
      //   `,
      // });

      // 1️⃣ Save token to DB
      await this.ps.client.magicLink.create({
        data: {
          email: normalizedEmail,
          token,
        },
      });
      await this.transporter.sendMail({
        from: `"Khalify" <${process.env.SMTP_USER_EMAIL || "daffahafizhfirdaus07@gmail.com"}>`,
        to: email,
        subject: 'Your Secure Login Link',
        html: `
          <div style="font-family: Arial, sans-serif">
            <h2>Sign in to Khalify</h2>
            <p>Click the button below to securely sign in.</p>
            <a
              href="${link}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#4f46e5;
                color:#fff;
                text-decoration:none;
                border-radius:6px;
                margin:16px 0;
              "
            >
              Sign in
            </a>
            <p>This link will expire in 10 minutes.</p>
            <p style="font-size:12px;color:#666">
              If you didn’t request this, ignore this email.
            </p>
          </div>
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
