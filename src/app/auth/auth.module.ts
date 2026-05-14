import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { PassportModule } from '@nestjs/passport'; // [1] Import Passport
import { JwtAccessTokenStrategy } from './jwtAccessToken.strategy'; // [2] Import Strategy
import { User } from '../../database/entities/user.entity';
import { MagicLink } from '../../database/entities/magic-link.entity';
import { Profile } from '../../database/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MagicLink, Profile]),
    MailModule,
    PassportModule, // [3] Masukkan PassportModule
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '30d',
      },
    }),
  ],
  providers: [AuthService, JwtAccessTokenStrategy], // [4] WAJIB: Masukkan Strategy disini
  controllers: [AuthController],
  exports: [AuthService, JwtAccessTokenStrategy, PassportModule], // [5] Export agar PaymentModule bisa pakai
})
export class AuthModule {}