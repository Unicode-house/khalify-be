import { Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
// [FIX] Import JwtGuard, bukan AuthGuard
import { JwtGuard } from '../app/auth/auth.guard'; 

@Controller('payment')
@UseGuards(JwtGuard) // [FIX] Gunakan JwtGuard
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('link')
  async getLink(@Req() req: any) {
    return this.paymentService.getUpgradeLink(req.user.email, req.user.name);
  }

  @Get('check-status')
  async checkStatus(@Req() req: any) {
    // req.user.id mungkin undefined di Magic Link, tapi service kita sudah handle itu sekarang
    return this.paymentService.checkAndSyncStatus(req.user.id, req.user.email);
  }
}