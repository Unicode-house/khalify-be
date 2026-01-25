export const mailConfig = () => ({
  mail: {
    host: process.env.SMTP_USER_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_AUTH_USER || 'daffahafizhfirdaus07@gmail.com', 
      pass: process.env.SMTP_USER_PASS, 
    },
    pool: true,
    maxConnections: 5,
  },
});