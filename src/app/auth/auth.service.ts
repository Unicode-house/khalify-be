import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ResponseHelper } from '../../helper/base.response';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends ResponseHelper {
  constructor(
    private readonly ps: PrismaService,
    private readonly mailService: MailService,
    private js: JwtService,
  ) {
    super();
  }



  /**
   * STEP 1: REQUEST LOGIN / REGISTER
   */
  async requestMagicLink(email: string) {
    const user = await this.ps.client.user.findFirst({
      where: {
        email: email.trim(),
      },
    });

    if (!user) {
      await this.ps.client.user.create({
        data: {
          email: email.trim(),
        },
      });
    }

    // await this.ps.client.magicLink.create({
    //   data: {
    //     email,
    //     token,
    //     expiresAt: addMinutes(new Date(), 10), // valid 10 menit
    //   },
    // });

    const res = await this.mailService.sendMagicLink(email);

    // console.log(
    //   `🔗 Magic link: http://localhost:3000/auth/verify?token=${token}`,
    // );

    return ResponseHelper.success(
      {
        email,
        token: res.token,
      },
      'magic link sent successfully',
    );
  }

  async verifyToken(token: string, email: string) {
    const magicLink = await this.ps.client.magicLink.findFirst({
      where: {
        token,
      },
    });

    if (!magicLink) {
      return ResponseHelper.error(
        'Invalid or expired magic link',
        400,
        'INVALID_MAGIC_LINK',
      );
    }
    await this.ps.client.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true },
    });

    const user = await this.ps.client.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const profile = await this.ps.client.profile.findFirst({
      where: { userId: user.id },
    });

    const tokenJWT = this.js.sign({
      sub: 'magic-link',
      email,
    });
    if (!profile) {
      await this.ps.client.profile.create({
        data: {
          name: 'New User',
          username: 'user_' + Date.now() + Math.floor(Math.random() * 1000),
          avatarUrl: '',
          bio: 'the human',
          userId: user.id,
        },
      });
    }
    return ResponseHelper.success(
      {
        user,
        jwt: tokenJWT,
      },
      'Token verified successfully',
    );
  }
}
