import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma/prisma.service'; 
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly notionDbId = process.env.NOTION_DB_ID; 
  private readonly notionSecret = process.env.NOTION_SECRET;

  constructor(private readonly prisma: PrismaService) {}

  // 1. Generate Link Mayar
  async getUpgradeLink(userEmail: string, userName: string) {
    this.logger.log(`[GetLink] Request upgrade link for: ${userEmail}`);

    const baseUrl = 'https://khlasify.myr.id/pl/content-pro/';
    const params = new URLSearchParams({
      email: userEmail,
      name: userName || userEmail.split('@')[0], 
    });

    const finalLink = `${baseUrl}?${params.toString()}`;
    return { paymentLink: finalLink };
  }

  // 2. Logic Utama
  async checkAndSyncStatus(userId: string | undefined, userEmail: string) {
    this.logger.log(`[SyncStatus] Check request for Email: ${userEmail} (UserID input: ${userId})`);

    let targetUserId = userId;

    // [FIX 1] Gunakan .client saat akses DB
    // Jika userId kosong (Magic Link), cari User ID berdasarkan Email
    if (!targetUserId) {
      this.logger.log(`[SyncStatus] UserID missing. Finding user by email...`);
      try {
        // PERBAIKAN: this.prisma.client.user
        const user = await this.prisma.client.user.findUnique({
          where: { email: userEmail },
        });

        if (!user) {
          this.logger.error(`[SyncStatus] Critical: User with email ${userEmail} not found in DB.`);
          return { isPro: false, status: 'user_not_found_in_db' };
        }
        targetUserId = user.id;
        this.logger.log(`[SyncStatus] User found via email. ID: ${targetUserId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[SyncStatus] DB Error finding user: ${msg}`);
        return { isPro: false, status: 'db_error' };
      }
    }

    // A. Cek Cache Lokal di tabel PROFILE
    try {
      // PERBAIKAN: this.prisma.client.profile
      const profile = await this.prisma.client.profile.findUnique({
        where: { userId: targetUserId },
        select: { isPro: true, id: true } 
      });

      if (profile?.isPro) {
        this.logger.log(`[SyncStatus] User is already PRO (Local Cache).`);
        return { isPro: true, status: 'already_pro' };
      }
      
      this.logger.log(`[SyncStatus] User is FREE locally. Checking Notion...`);

    } catch (error) {
       const msg = error instanceof Error ? error.message : String(error);
       this.logger.warn(`[SyncStatus] Local DB Check Warning: ${msg}`);
    }

    // B. Hit API Notion
    const isPaidInNotion = await this.checkNotionTransaction(userEmail);

    if (isPaidInNotion) {
      this.logger.log(`[SyncStatus] PAID found in Notion! Syncing to local DB...`);

      // C. Sinkronisasi (UPSERT)
      try {
        // PERBAIKAN: this.prisma.client.profile
        await this.prisma.client.profile.upsert({
          where: { userId: targetUserId },
          update: { isPro: true },
          create: {
            userId: targetUserId!,
            name: userEmail.split('@')[0],
            username: userEmail.split('@')[0] + Math.floor(Math.random() * 9999),
            isPro: true
          }
        });
        
        this.logger.log(`[SyncStatus] SUCCESS! User ${userEmail} synced to PRO.`);
        return { isPro: true, status: 'synced_now' };

      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`[SyncStatus] Failed to update Local DB: ${msg}`);
        return { isPro: true, status: 'synced_but_update_failed' }; 
      }
    }

    this.logger.log(`[SyncStatus] No PAID transaction found in Notion for ${userEmail}.`);
    return { isPro: false, status: 'waiting_payment' };
  }

  // --- PRIVATE HELPER ---
  private async checkNotionTransaction(email: string): Promise<boolean> {
    if (!this.notionDbId || !this.notionSecret) {
      this.logger.error(`[NotionAPI] Missing Env Config!`);
      return false;
    }

    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${this.notionDbId}/query`,
        {
          filter: {
            and: [
              { property: 'email', email: { equals: email } }, // Sesuaikan huruf besar/kecil key ini dengan DB Notion
              { property: 'status', rich_text: { equals: 'PAID' } },
              { property: 'variant', rich_text: { contains: 'pro' } }
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.notionSecret}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.results.length > 0;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`[NotionAPI] Axios Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`[NotionAPI] Unknown Error: ${msg}`);
      }
      return false; 
    }
  }
}