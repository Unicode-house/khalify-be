import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuthModule } from '../app/auth/auth.module'; // [1] Import AuthModule
import { PrismaModule } from '../app/prisma/prisma.module'; // [2] Import PrismaModule

@Module({
  imports: [
    AuthModule,   // [3] Agar Guard 'jwt_access_token' dikenali
    PrismaModule  // [4] Agar PaymentService bisa akses DB
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
