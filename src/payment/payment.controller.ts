import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtGuard } from '../app/auth/auth.guard';
import { SyncStatusQueryDto } from './dto/payment.dto';

@ApiTags('💰 Payment & PRO Subscription')
@Controller('payment')
@UseGuards(JwtGuard)
@ApiBearerAuth('JWT-Auth')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('link')
  @ApiOperation({
    summary: 'Get PRO upgrade payment link',
    description: `Generates a personalized payment link for upgrading to PRO subscription.
    The link redirects to the Khlasify payment page (myr.id) with pre-filled user data.
    
    ⚠️ Requires **JWT authentication** — user email and name are extracted from the JWT token.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment link generated',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Payment link generated successfully' },
        data: {
          paymentLink: 'https://khlasify.myr.id/pl/content-pro/?email=user%40example.com&name=John+Doe',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async getLink(@Req() req: any) {
    return this.paymentService.getUpgradeLink(req.user.email, req.user.name);
  }

  @Get('check-status')
  @ApiOperation({
    summary: 'Check and sync PRO subscription status',
    description: `Checks whether the authenticated user has an active PRO subscription.
    
    **Logic flow:**
    1. Check local database for existing PRO status
    2. If not PRO locally, query Notion transaction database for completed payment
    3. If paid in Notion, sync the PRO status to local database
    
    **Possible sync statuses:**
    - \`alreadyPro\` — User is already PRO
    - \`syncedNow\` — Payment found, PRO activated just now
    - \`waitingPayment\` — No completed payment found`,
  })
  @ApiResponse({
    status: 200,
    description: 'PRO status checked and synced',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'User is already a PRO member' },
        data: { isPro: true, syncStatus: 'alreadyPro' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found in database' })
  async checkStatus(@Req() req: any) {
    return this.paymentService.checkAndSyncStatus(req.user.id, req.user.email);
  }

  @Get('sync-status')
  @ApiOperation({
    summary: 'Manually sync PRO status from Notion',
    description: `Manually triggers a sync of the user's PRO subscription status by querying 
    the Notion transaction database for successful payments.
    
    This endpoint is useful for admin-level or manual recovery scenarios.`,
  })
  @ApiQuery({ name: 'email', required: true, type: String, description: 'Email address to sync', example: 'user@example.com' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Optional display name' })
  @ApiResponse({
    status: 200,
    description: 'Sync completed',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Request processed successfully' },
        data: { isPro: true, syncMessage: 'Status synced: PRO Active' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 500, description: 'Failed to sync with Notion API' })
  async syncStatus(@Query() query: SyncStatusQueryDto) {
    return await this.paymentService.syncProStatus(query.email);
  }
}
