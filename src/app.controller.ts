import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('🏠 Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns a simple greeting message to confirm the API server is running and responsive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is healthy and running',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Request processed successfully' },
        data: 'Hello World!',
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0', responseTimeMs: 1 },
      },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
