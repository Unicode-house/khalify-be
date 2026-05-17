import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';

@ApiTags('🧾 Orders')
@Controller('order')
export class OrderController {

    constructor(private readonly orderService: OrderService) { }
    
    @Get("/getOrder")
    @ApiOperation({
      summary: 'Get all orders',
      description: `Retrieves a collection of all payment orders in the system.
      Each order contains transaction details including status (PENDING, PAID, FAILED, EXPIRED), 
      payment provider, Snap token, and Midtrans transaction ID.`,
    })
    @ApiResponse({
      status: 200,
      description: 'Collection of all orders',
      schema: {
        example: {
          status: { code: 200, type: 'SUCCESS', message: 'Orders retrieved successfully' },
          data: {
            items: [
              {
                id: 'order-uuid',
                orderId: 'ORDER-1747498954000',
                userId: 'user-uuid',
                amount: 99000,
                status: 'PAID',
                provider: 'MIDTRANS',
                snapToken: 'snap-token-abc123',
                transactionId: 'txn-12345',
                createdAt: '2026-05-17T13:02:34.000Z',
                updatedAt: '2026-05-17T13:10:00.000Z',
                profileId: 'profile-uuid',
              },
            ],
            count: 1,
          },
          meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
        },
      },
    })
    async getOrder() {
        return await this.orderService.getOrder();
    }
}
