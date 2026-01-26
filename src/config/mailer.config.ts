import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  host: process.env.SMTP_USER_HOST || 'smtp.gmail.com',
  // Ubah hardcode 465 menjadi dinamis
  port: parseInt(process.env.SMTP_USER_PORT) || 587,
  // Ubah hardcode true menjadi pengecekan string env
  secure: process.env.SMTP_USER_SECURE === 'true',
  auth: {
    // Gunakan variabel SMTP_AUTH_USER agar sesuai dengan env Anda
    user: process.env.SMTP_AUTH_USER || 'daffahafizhfirdaus07@gmail.com',
    pass: process.env.SMTP_USER_PASS,
  },
  pool: true,
  maxConnections: 5,
}));
