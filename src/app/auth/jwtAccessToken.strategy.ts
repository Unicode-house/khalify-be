import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { jwt_config } from '../../config/jwt.config'; // <--- 1. Tambahkan Import ini

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, 'jwt_access_token') {
  private readonly logger = new Logger(JwtAccessTokenStrategy.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 2. Gunakan fallback ke config jika env kosong
      secretOrKey: process.env.JWT_SECRET || jwt_config.access_token_secret, 
    });
  }

  async validate(payload: any) {
    // ... kode validasi tetap sama ...
    this.logger.log(`Validating JWT Payload: ${JSON.stringify(payload)}`);
    console.log('🔍 [DEBUG STRATEGY] Payload received:', JSON.stringify(payload));

    if (payload.sub && payload.sub !== 'magic-link') {
      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });
      if (user) return user;
    }

    if (payload.email) {
      const user = await this.userRepo.findOne({
        where: { email: payload.email },
      });
      if (user) {
        return user;
      }
    }

    this.logger.error('User not found in DB based on Token payload');
    throw new UnauthorizedException('User not found or Token invalid');
  }
}