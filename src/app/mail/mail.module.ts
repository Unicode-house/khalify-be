import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';
import { MagicLink } from '../../database/entities/magic-link.entity';
import 'dotenv/config';


@Module({
  imports: [
    TypeOrmModule.forFeature([MagicLink]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
