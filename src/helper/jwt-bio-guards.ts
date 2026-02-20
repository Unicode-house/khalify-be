import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // optional override if you need custom behavior
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // Pastikan sama dengan saat generate token
    });
  }

  async validate(payload: any) {
    // Data ini akan masuk ke dalam req.user
    return { 
      userId: payload.id, 
      email: payload.email, 
      profileId: payload.profileId 
    };
  }
}