import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ResponseHelper } from 'src/helper/base.response';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
@Post('link')
  async getLink(@Req() req: any) {
    return this.paymentService.getUpgradeLink(req.user.email, req.user.name);
  }

  @Get('check-status')
  async checkStatus(@Req() req: any) {
    // req.user biasanya berisi payload JWT (id, email, dll)
    return this.paymentService.checkAndSyncStatus(req.user.id, req.user.email);
  }
}
