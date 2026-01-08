import { JwtService } from '@nestjs/jwt';
import 'dotenv/config';

export class JwtHelper {
  static generateAccessToken(
    jwtService: JwtService,
    payload: {
      sub: string;
      email: string;
    },
  ) {
    return jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
  }
}
