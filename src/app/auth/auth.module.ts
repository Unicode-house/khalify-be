import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { PassportModule } from '@nestjs/passport'; // [1] Import Passport
import { JwtAccessTokenStrategy } from './jwtAccessToken.strategy'; // [2] Import Strategy

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule, // [3] Masukkan PassportModule
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  providers: [AuthService, JwtAccessTokenStrategy], // [4] WAJIB: Masukkan Strategy disini
  controllers: [AuthController],
  exports: [AuthService, JwtAccessTokenStrategy, PassportModule], // [5] Export agar PaymentModule bisa pakai
})
export class AuthModule {}