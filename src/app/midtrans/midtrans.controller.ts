import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MidtransService } from './midtrans.service';

@Controller('midtrans')
export class MidtransController {
  constructor(private readonly midtransService: MidtransService) {}

  
  @Post('create-transaction')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body()
    dto: {
      userId: string;
      profileId: string;
      amount: number;
    },
  ) {
    return this.midtransService.createTransaction(dto);
  }

  
  @Post('notification')
  @HttpCode(HttpStatus.OK)
  async handleNotification(@Body() notification: any) {
    return this.midtransService.handleNotification(notification);
  }
}
