import { Module } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/helper/jwt-bio-guards';
import { CloudinaryService } from 'src/helper/cloudinary.service';
import { CloudinaryProvider } from 'src/helper/cloudinary.provider';
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
    }),
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [WidgetService, JwtStrategy,
    CloudinaryService,  // <-- TAMBAHKAN INI
    CloudinaryProvider, ],
  controllers: [WidgetController],
})
export class WidgetModule {}
