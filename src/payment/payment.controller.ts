import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ResponseHelper } from 'src/helper/base.response';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
 @Post('sync-status')
  async syncStatus(@Body() body: { email: string }) {
    const result = await this.paymentService.syncProStatus(body.email);
    return ResponseHelper.success(result, 'Sync completed');
  }
}
