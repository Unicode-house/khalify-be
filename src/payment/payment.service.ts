import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/prisma.service';
import { ResponseHelper } from 'src/helper/base.response';
import axios from 'axios';

@Injectable()
export class PaymentService {
  // Gunakan Logger bawaan NestJS agar log lebih rapi di terminal
  private readonly logger = new Logger(PaymentService.name);

  // Ambil Config dari ENV (JANGAN HARDCODE DI SINI UNTUK PRODUCTION!)
  // Pastikan .env Anda punya:
  // NOTION_DB_ID=2fb1519e69f080b8a586f0f8cbab4653
  // NOTION_SECRET=ntn_G56643036008mwChhk9IMXuw5kbkgNMZDyzXbXnnFElcKu
  private readonly notionDbId = process.env.NOTION_DB_ID || "2fb1519e69f080b8a586f0f8cbab4653"; 
  private readonly notionSecret = process.env.NOTION_SECRET || "ntn_G56643036008mwChhk9IMXuw5kbkgNMZDyzXbXnnFElcKu";

  constructor(private readonly prisma: PrismaService) {}

  // 1. Generate Link Mayar (Pasif)
  async getUpgradeLink(userEmail: string, userName: string) {
    const baseUrl = 'https://khlasify.myr.id/pl/content-pro/';
    const params = new URLSearchParams({
      email: userEmail,
      name: userName,
      // Opsional: Redirect balik ke dashboard setelah bayar
      // redirect_url: 'https://dashboard.khlasify.com/payment-finish' 
    });

    return {
      paymentLink: `${baseUrl}?${params.toString()}`
    };
  }

  // 2. Logic Utama: Cek Notion -> Sync ke DB Lokal
 async checkAndSyncStatus(userId: string, userEmail: string) {
    // 1. Cek Cache Lokal di tabel PROFILE (Bukan User)
    const profile = await this.prisma.client.profile.findUnique({
      where: { userId: userId }, // Cari profile berdasarkan userId
      select: { isPro: true, id: true } 
    });

    // Jika profile tidak ditemukan (kasus langka), return error/false
    if (!profile) return { isPro: false, status: 'profile_not_found' };

    // Jika sudah PRO, langsung return
    if (profile.isPro) {
      return { isPro: true, status: 'already_pro' };
    }

    // 2. Hit API Notion
    const isPaidInNotion = await this.checkNotionTransaction(userEmail);

    if (isPaidInNotion) {
      // 3. Sinkronisasi: Update tabel PROFILE
      await this.prisma.client.profile.update({
        where: { userId: userId }, // Kita update berdasarkan userId (karena @unique)
        data: { isPro: true }
      });
      
      this.logger.log(`User ${userEmail} synced to PRO based on Notion data.`);
      return { isPro: true, status: 'synced_now' };
    }

    // 4. Belum bayar
    return { isPro: false, status: 'waiting_payment' };
  }
  // --- PRIVATE HELPER (Logic Notion) ---
  private async checkNotionTransaction(email: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${this.notionDbId}/query`,
        {
          filter: {
            and: [
              {
                property: 'email', // Sesuaikan nama property di Notion (huruf kecil/besar sensitif!)
                email: { equals: email }, // Asumsi tipe property Notion adalah 'Email'
              },
              {
                property: 'status', 
                rich_text: { equals: 'PAID' }, // Pastikan value-nya 'PAID' atau 'Success' sesuai Make.com
              },
              {
                property: 'variant',
                rich_text: { contains: 'pro' } // Filter tambahan (opsional)
              }
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

      // Jika ada minimal 1 row data, berarti valid
      return response.data.results.length > 0;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Notion API Error: ${JSON.stringify(error.response?.data)}`);
      } else {
        this.logger.error(`Unknown Error checking Notion: ${error}`);
      }
      return false; // Default: anggap belum bayar kalau error
    }
  }
}