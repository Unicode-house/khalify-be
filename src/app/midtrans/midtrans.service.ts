import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Midtrans from 'midtrans-client';
import * as crypto from 'crypto';
import { Order, PaymentStatus, PaymentProvider } from '../../database/entities/order.entity';
import { ResponseHelper } from '../../helper/base.response';

@Injectable()
export class MidtransService {
  private snap: Midtrans.Snap;
  private readonly logger = new Logger(MidtransService.name);

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

      return ResponseHelper.created(
        {
          snapToken: transaction.token,
          redirectUrl: transaction.redirect_url,
          order: savedOrder,
        },
        'Midtrans transaction created successfully',
      );
    } catch (error) {
      this.logger.error('Midtrans Error:', error?.ApiResponse || error?.message);
      throw new InternalServerErrorException(
        'Failed to create Midtrans transaction',
      );
    }
  }

  /**
   * HANDLE MIDTRANS NOTIFICATION (WEBHOOK)
   */
  async handleNotification(notification: any) {
    this.logger.log(
      `📩 Midtrans Notification: ${JSON.stringify(notification, null, 2)}`,
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
      this.logger.error('❌ Invalid Midtrans signature');
      return ResponseHelper.error(
        'Invalid notification signature',
        400,
        'INVALID_SIGNATURE',
        { details: 'The webhook signature validation failed.' },
      );
    }

    // Update order
    const order = await this.orderRepo.findOne({
      where: { orderId: notification.order_id },
    });

    if (!order) {
      this.logger.error('❌ Order not found:', notification.order_id);
      return ResponseHelper.notFound(
        'Order not found',
        'ORDER_NOT_FOUND',
      );
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

    this.logger.log(`✅ Order ${order.orderId} updated to ${status}`);

    return ResponseHelper.success(
      {
        valid: true,
        orderId: order.orderId,
        transactionStatus: status,
      },
      'Notification processed successfully',
    );
  }
}
