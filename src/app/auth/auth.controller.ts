import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  async requestMagicLink(@Body() payload: { email: string }) {
    return this.authService.requestMagicLink(payload.email);
  }

  @Post('verify-token')
  async verifyToken(@Body() payload: { token: string; email: string }) {
    return this.authService.verifyToken(payload.token, payload.email);
  }
}
