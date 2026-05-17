import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Profile } from '../database/entities/profile.entity';
import { ResponseHelper } from '../helper/base.response';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly notionDbId = process.env.NOTION_DB_ID;
  private readonly notionSecret = process.env.NOTION_SECRET;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  async getUpgradeLink(userEmail: string, userName: string) {
    const baseUrl = 'https://khlasify.myr.id/pl/content-pro/';
    const params = new URLSearchParams({ email: userEmail, name: userName || userEmail.split('@')[0] });
    return ResponseHelper.success(
      { paymentLink: `${baseUrl}?${params.toString()}` },
      'Payment link generated successfully',
    );
  }

  async checkAndSyncStatus(userId: string | undefined, userEmail: string) {
    let targetUserId = userId;

    if (!targetUserId) {
      try {
        const user = await this.userRepo.findOne({ where: { email: userEmail } });
        if (!user) {
          return ResponseHelper.notFound(
            'User not found in database',
            'USER_NOT_FOUND',
          );
        }
        targetUserId = user.id;
      } catch (err) {
        return ResponseHelper.internalError(
          'Database error while looking up user',
        );
      }
    }

    try {
      const profile = await this.profileRepo.findOne({ where: { userId: targetUserId }, select: ['isPro', 'id'] });
      if (profile?.isPro) {
        return ResponseHelper.success(
          { isPro: true, syncStatus: 'alreadyPro' },
          'User is already a PRO member',
        );
      }
    } catch (error) {
      this.logger.warn(`[SyncStatus] Local DB Check Warning`);
    }

    const isPaidInNotion = await this.checkNotionTransaction(userEmail);

    if (isPaidInNotion) {
      try {
        let profile = await this.profileRepo.findOne({ where: { userId: targetUserId } });
        if (profile) {
          await this.profileRepo.update({ userId: targetUserId }, { isPro: true });
        } else {
          profile = this.profileRepo.create({
            userId: targetUserId!, name: userEmail.split('@')[0],
            username: userEmail.split('@')[0] + Math.floor(Math.random() * 9999), isPro: true,
          });
          await this.profileRepo.save(profile);
        }
        return ResponseHelper.success(
          { isPro: true, syncStatus: 'syncedNow' },
          'PRO status synced successfully',
        );
      } catch (error) {
        return ResponseHelper.success(
          { isPro: true, syncStatus: 'syncedButUpdateFailed' },
          'PRO status confirmed but local update failed',
        );
      }
    }

    return ResponseHelper.success(
      { isPro: false, syncStatus: 'waitingPayment' },
      'No completed payment found. Awaiting payment.',
    );
  }

  private async checkNotionTransaction(email: string): Promise<boolean> {
    if (!this.notionDbId || !this.notionSecret) return false;
    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${this.notionDbId}/query`,
        { filter: { and: [
          { property: 'Email', email: { equals: email } },
          { property: 'Status', rich_text: { equals: 'SUCCES' } },
          { property: 'Variant', rich_text: { contains: 'Content OS + Preview Widget (PRO)' } }
        ]}},
        { headers: { Authorization: `Bearer ${this.notionSecret}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' }}
      );
      return response.data.results.length > 0;
    } catch (error) {
      return false;
    }
  }

  async syncProStatus(userEmail: string) {
    const NOTION_TRANS_DB_ID = "2fb1519e69f080b8a586f0f8cbab4653";
    const NOTION_TOKEN = "ntn_G56643036008mwChhk9IMXuw5kbkgNMZDyzXbXnnFElcKu";

    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${NOTION_TRANS_DB_ID}/query`,
        { filter: { and: [
          { property: 'Email', email: { equals: userEmail } },
          { property: 'Status', rich_text: { equals: 'Success' } },
        ]}},
        { headers: { Authorization: `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' }}
      );

      const transactions = response.data.results;
      if (transactions.length > 0) {
        const user = await this.userRepo.findOne({ where: { email: userEmail } });
        if (user) {
          await this.profileRepo.update({ userId: user.id }, { isPro: true });
          return { isPro: true, syncMessage: 'Status synced: PRO Active' };
        } else {
          return { isPro: false, syncMessage: 'User not found in App' };
        }
      }
      return { isPro: false, syncMessage: 'No successful transaction found' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to sync: ${errorMessage}`);
    }
  }
}