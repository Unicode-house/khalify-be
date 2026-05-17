import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { MagicLink } from '../../database/entities/magic-link.entity';
import { Profile } from '../../database/entities/profile.entity';
import { MailService } from '../mail/mail.service';
import { ResponseHelper } from '../../helper/base.response';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MagicLink)
    private readonly magicLinkRepo: Repository<MagicLink>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly mailService: MailService,
    private js: JwtService,
  ) {}



  /**
   * STEP 1: REQUEST LOGIN / REGISTER
   */
  async requestMagicLink(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: email.trim() },
    });

    if (!user) {
      const newUser = this.userRepo.create({
        email: email.trim(),
      });
      await this.userRepo.save(newUser);
    }

    const res = await this.mailService.sendMagicLink(email);

    return ResponseHelper.success(
      {
        email,
        token: res.token,
      },
      'Magic link sent successfully',
    );
  }

  async verifyToken(token: string, email: string) {
    const magicLink = await this.magicLinkRepo.findOne({
      where: { token },
    });

    if (!magicLink) {
      return ResponseHelper.error(
        'Invalid or expired magic link',
        400,
        'INVALID_MAGIC_LINK',
        { details: 'The provided token is either invalid or has already expired. Please request a new magic link.' },
      );
    }

    await this.magicLinkRepo.update(
      { id: magicLink.id },
      { used: true },
    );

    const user = await this.userRepo.findOne({
      where: { email: email },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    // 1. Cari profile
    let profile = await this.profileRepo.findOne({
      where: { userId: user.id },
    });

    // 2. JIKA profile tidak ada, BUAT DULU (Penting!)
    if (!profile) {
      profile = this.profileRepo.create({
        name: 'New User',
        username: 'user_' + Date.now() + Math.floor(Math.random() * 1000),
        avatarUrl: '',
        bio: 'the human',
        userId: user.id,
      });
      profile = await this.profileRepo.save(profile);
      console.log(`[AUTH] Profile created for new user: ${profile.id}`);
    }

    // 3. SEKARANG generate JWT (Pastikan profileId sudah pasti ada nilainya)
    const tokenJWT = this.js.sign({
      sub: 'magic-link',
      email,
      profileId: profile.id, // Sekarang tidak akan null lagi
    });

    return ResponseHelper.success(
      {
        user,
        jwt: tokenJWT,
      },
      'Token verified successfully',
    );
  }
}
