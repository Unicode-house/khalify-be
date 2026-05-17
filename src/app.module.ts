import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './app/auth/auth.module';
import { HighlightModule } from './app/highlight/highlight.module';
import { ProfileModule } from './app/auth/profile/profile.module';
import { OrderModule } from './app/order/order.module';
import { WidgetModule } from './app/widget/widget.module';
import { MidtransModule } from './app/midtrans/midtrans.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './app/mail/mail.module';
import { mailConfig } from './config/mailer.config';
import { HttpModule } from '@nestjs/axios';
import { PaymentModule } from './payment/payment.module';
import { UserModule } from './app/user/user.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailConfig],
    }),
    DatabaseModule,
    AuthModule,
    HighlightModule,
    ProfileModule,
    OrderModule,
    WidgetModule,
    MidtransModule,
    MailModule,
    HttpModule,
    PaymentModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Request ID middleware to ALL routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
