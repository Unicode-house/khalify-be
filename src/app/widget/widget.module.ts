import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/helper/jwt-bio-guards';
import { CloudinaryService } from '../../helper/cloudinary.service';
import { CloudinaryProvider } from '../../helper/cloudinary.provider';
import { Widget } from '../../database/entities/widget.entity';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Widget, User, Profile]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
    }),
    HttpModule,
  ],
  providers: [WidgetService, JwtStrategy,
    CloudinaryService,  // <-- TAMBAHKAN INI
    CloudinaryProvider, ],
  controllers: [WidgetController],
})
export class WidgetModule {}
