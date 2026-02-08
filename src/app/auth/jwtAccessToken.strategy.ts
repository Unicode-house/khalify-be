import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service'; // Sesuaikan path

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, 'jwt_access_token') {
  private readonly logger = new Logger(JwtAccessTokenStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // Pastikan ini benar
    });
  }

  async validate(payload: any) {
    this.logger.log(`Validating JWT Payload: ${JSON.stringify(payload)}`);

    console.log('🔍 [DEBUG STRATEGY] Payload received:', JSON.stringify(payload));
    // SKENARIO 1: Token Normal (Login biasa) -> Cari by ID
    if (payload.sub && payload.sub !== 'magic-link') {
      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
      });
      if (user) return user;
    }

    // SKENARIO 2: Token Magic Link -> Cari by Email
    if (payload.email) {
      const user = await this.prisma.client.user.findUnique({
        where: { email: payload.email },
      });
      
      if (user) {
        this.logger.log(`User found via Email: ${user.email}`);
        return user;
      }
    }

    // GAGAL SEMUA
    this.logger.error('User not found in DB based on Token payload');
    throw new UnauthorizedException('User not found or Token invalid');
  }
}