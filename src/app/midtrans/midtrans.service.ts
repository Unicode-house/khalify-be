import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Midtrans from 'midtrans-client';
import * as crypto from 'crypto';
import { Order, PaymentStatus, PaymentProvider } from '../../database/entities/order.entity';

@Injectable()
export class MidtransService {
  private snap: Midtrans.Snap;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {
    this.snap = new Midtrans.Snap({
      isProduction:
        this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true',
      serverKey: this.configService.get<string>('MIDTRANS_SERVER_KEY'),
      clientKey: this.configService.get<string>('MIDTRANS_CLIENT_KEY'),
    });
  }

  /**
   * CREATE MIDTRANS TRANSACTION
   */
  async createTransaction(dto: {
    userId: string;
    profileId: string;
    amount: number;
  }) {
    const { userId, profileId, amount } = dto;

    const orderId = `ORDER-${Date.now()}`;

    try {
      // 1️⃣ Create Midtrans transaction
      const transaction = await this.snap.createTransaction({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
      });

      // 2️⃣ Save order to DB (PENDING)
      const order = this.orderRepo.create({
        orderId,
        userId,
        profileId,
        amount,
        provider: PaymentProvider.MIDTRANS,
        status: PaymentStatus.PENDING,
        snapToken: transaction.token,
      });

      const savedOrder = await this.orderRepo.save(order);

      return {
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        order: savedOrder,
      };
    } catch (error) {
      console.error('Midtrans Error:', error?.ApiResponse || error?.message);
      throw new InternalServerErrorException(
        'Failed to create Midtrans transaction',
      );
    }
  }

  /**
   * HANDLE MIDTRANS NOTIFICATION (WEBHOOK)
   */
  async handleNotification(notification: any) {
    console.log(
      '📩 Midtrans Notification:',
      JSON.stringify(notification, null, 2),
    );

    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');

    // ⚠️ Signature validation (WAJIB)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(
        notification.order_id +
          notification.status_code +
          notification.gross_amount +
          serverKey,
      )
      .digest('hex');

    if (expectedSignature !== notification.signature_key) {
      console.error('❌ Invalid Midtrans signature');
      return { valid: false };
    }

    // Update order
    const order = await this.orderRepo.findOne({
      where: { orderId: notification.order_id },
    });

    if (!order) {
      console.error('❌ Order not found:', notification.order_id);
      return { valid: false };
    }

    let status: PaymentStatus = PaymentStatus.PENDING;

    switch (notification.transaction_status) {
      case 'capture':
        if (notification.fraud_status === 'accept') {
          status = PaymentStatus.PAID;
        }
        break;

      case 'settlement':
        status = PaymentStatus.PAID;
        break;

      case 'expire':
        status = PaymentStatus.EXPIRED;
        break;

      case 'deny':
      case 'cancel':
        status = PaymentStatus.FAILED;
        break;
    }

    await this.orderRepo.update(
      { orderId: notification.order_id },
      {
        status,
        transactionId: notification.transaction_id,
        rawNotification: notification,
        updatedAt: new Date(),
      },
    );

    console.log(`✅ Order ${order.orderId} updated to ${status}`);

    return { valid: true };
  }
}
