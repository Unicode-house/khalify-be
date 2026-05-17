import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MidtransService } from './midtrans.service';
import { CreateMidtransTransactionDto } from './dto/midtrans.dto';

@ApiTags('💳 Midtrans Payment Gateway')
@Controller('midtrans')
export class MidtransController {
  constructor(private readonly midtransService: MidtransService) {}

  @Post('create-transaction')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Midtrans Snap transaction',
    description: `Creates a new payment transaction through the Midtrans Snap API.
    Returns a **Snap token** and **redirect URL** for the client to open the payment popup.
    
    **Flow:**
    1. Client calls this endpoint with userId, profileId, and amount
    2. Server creates a Midtrans transaction and saves the order (status: PENDING)
    3. Client uses the returned \`snapToken\` to open the Midtrans payment popup
    4. After payment, Midtrans sends a webhook to \`POST /midtrans/notification\``,
  })
  @ApiBody({ type: CreateMidtransTransactionDto })
  @ApiResponse({
    status: 201,
    description: 'Transaction created — Snap token and redirect URL returned',
    schema: {
      example: {
        status: { code: 201, type: 'SUCCESS', message: 'Midtrans transaction created successfully' },
        data: {
          snapToken: 'snap-abc123-token...',
          redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/snap-abc123-token',
          order: {
            id: 'order-uuid',
            orderId: 'ORDER-1747498954000',
            userId: 'user-uuid',
            profileId: 'profile-uuid',
            amount: 99000,
            status: 'PENDING',
            provider: 'MIDTRANS',
            snapToken: 'snap-abc123-token...',
            createdAt: '2026-05-17T13:02:34.000Z',
          },
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Failed to create Midtrans transaction (gateway error)' })
  async createTransaction(@Body() dto: CreateMidtransTransactionDto) {
    return this.midtransService.createTransaction(dto);
  }

  @Post('notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Midtrans webhook notification',
    description: `Receives and processes payment status notifications from Midtrans.
    
    **⚠️ This is a webhook endpoint** — called by Midtrans servers, not by the client.
    
    **Security:** Validates the notification signature using SHA-512 hash of 
    \`orderId + statusCode + grossAmount + serverKey\`.
    
    **Status mapping:**
    | Midtrans Status | Order Status |
    |---|---|
    | \`capture\` (accept) | PAID |
    | \`settlement\` | PAID |
    | \`expire\` | EXPIRED |
    | \`deny\` / \`cancel\` | FAILED |`,
  })
  @ApiBody({
    description: 'Midtrans notification payload (automatically sent by Midtrans)',
    schema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', example: 'ORDER-1747498954000' },
        status_code: { type: 'string', example: '200' },
        gross_amount: { type: 'string', example: '99000.00' },
        signature_key: { type: 'string', example: 'sha512-hash...' },
        transaction_status: { type: 'string', example: 'settlement', enum: ['capture', 'settlement', 'expire', 'deny', 'cancel', 'pending'] },
        transaction_id: { type: 'string', example: 'txn-12345-abc' },
        fraud_status: { type: 'string', example: 'accept', enum: ['accept', 'deny', 'challenge'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification processed and order status updated',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Notification processed successfully' },
        data: { valid: true, orderId: 'ORDER-1747498954000', transactionStatus: 'PAID' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid notification signature',
    schema: {
      example: {
        status: { code: 400, type: 'ERROR', message: 'Invalid notification signature' },
        data: { errorCode: 'INVALID_SIGNATURE', errorType: 'VALIDATION_ERROR', message: 'Invalid notification signature', details: 'The webhook signature validation failed.' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Order not found for the given order_id' })
  async handleNotification(@Body() notification: any) {
    return this.midtransService.handleNotification(notification);
  }
}
