import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './app/prisma/prisma.module';
import { AuthModule } from './app/auth/auth.module';
import { HighlightModule } from './app/highlight/highlight.module';
import { ProfileModule } from './app/auth/profile/profile.module';
import { OrderModule } from './app/order/order.module';
import { WidgetModule } from './app/widget/widget.module';
import { MidtransModule } from './app/midtrans/midtrans.module';
import { OrderController } from './app/order/order.controller';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './app/mail/mail.module';
import { mailConfig } from './config/mailer.config';
import { HttpModule } from '@nestjs/axios';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HighlightModule,
    ProfileModule,
    OrderModule,
    WidgetModule,
    MidtransModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailConfig],
    }),
    MailModule,
    HttpModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
