import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // optional override if you need custom behavior
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}