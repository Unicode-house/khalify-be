import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestMagicLinkDto, VerifyTokenDto } from './dto/auth.dto';

@ApiTags('🔐 Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  @ApiOperation({
    summary: 'Request magic link login',
    description: `Sends a magic link to the provided email address for passwordless authentication. 
    If the user does not exist in the system, a new account is created automatically.
    The magic link is valid for **10 minutes** and can only be used once.`,
  })
  @ApiBody({ type: RequestMagicLinkDto })
  @ApiResponse({
    status: 200,
    description: 'Magic link sent successfully to the provided email',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Magic link sent successfully' },
        data: {
          email: 'user@example.com',
          token: 'a1b2c3d4e5f6...hex64chars',
        },
        meta: {
          requestId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          timestamp: '2026-05-17T13:02:34.456Z',
          apiVersion: '2.0.0',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to send email (SMTP error)',
    schema: {
      example: {
        status: { code: 500, type: 'ERROR', message: 'An unexpected error occurred. Please try again later.' },
        data: { errorCode: 'INTERNAL_SERVER_ERROR', errorType: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again later.' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  async requestMagicLink(@Body() payload: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(payload.email);
  }

  @Post('verify-token')
  @ApiOperation({
    summary: 'Verify magic link token & get JWT',
    description: `Validates the magic link token sent via email. On success, returns the user data 
    and a **JWT access token** (valid for 30 days). If the user has no profile yet, one is created automatically.
    
    The token can only be used **once** — after verification it is marked as used.`,
  })
  @ApiBody({ type: VerifyTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token verified — user data and JWT returned',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Token verified successfully' },
        data: {
          user: {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            email: 'user@example.com',
            create_at: '2026-05-17T13:02:34.000Z',
            singedIn: '2026-05-17T13:02:34.000Z',
          },
          jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired magic link token',
    schema: {
      example: {
        status: { code: 400, type: 'ERROR', message: 'Invalid or expired magic link' },
        data: {
          errorCode: 'INVALID_MAGIC_LINK',
          errorType: 'VALIDATION_ERROR',
          message: 'Invalid or expired magic link',
          details: 'The provided token is either invalid or has already expired. Please request a new magic link.',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found after token verification' })
  async verifyToken(@Body() payload: VerifyTokenDto) {
    return this.authService.verifyToken(payload.token, payload.email);
  }
}
