import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MidtransService } from './midtrans.service';
import { MidtransController } from './midtrans.controller';
import { Order } from '../../database/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [MidtransService],
  controllers: [MidtransController]
})
export class MidtransModule {}
