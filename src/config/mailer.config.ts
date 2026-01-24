
export const mailConfig = () => ({
  mail: {
    host: process.env.SMTP_USER_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER_EMAIL || 'daffahafizhfirdaus07@gmail.com',
      pass: process.env.SMTP_USER_PASS || 'tupy rmaa aobr gjco',
    },
    pool: true, // ⬅️ penting
    maxConnections: 5,
  },
});
