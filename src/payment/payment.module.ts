import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuthModule } from '../app/auth/auth.module';
import { User } from '../database/entities/user.entity';
import { Profile } from '../database/entities/profile.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, Profile]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
