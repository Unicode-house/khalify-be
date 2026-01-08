import { Module } from '@nestjs/common';
import { MidtransService } from './midtrans.service';
import { MidtransController } from './midtrans.controller';

@Module({
  providers: [MidtransService],
  controllers: [MidtransController]
})
export class MidtransModule {}
