import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/prisma.service';
import { ResponseHelper } from 'src/helper/base.response';
import axios from 'axios';

@Injectable()
export class PaymentService extends ResponseHelper {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async syncProStatus(userEmail: string) {
    // Pastikan ID dan Token benar
    const NOTION_TRANS_DB_ID = "2fb1519e69f080b8a586f0f8cbab4653";
    const NOTION_TOKEN = "ntn_G56643036008mwChhk9IMXuw5kbkgNMZDyzXbXnnFElcKu"; 

    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${NOTION_TRANS_DB_ID}/query`,
        {
          filter: {
            and: [
              {
                // 1. Cek Nama Property: Biasanya 'Email' (Huruf Besar Awal)
                property: 'Email', 
                
                // 2. Cek Tipe Property:
                // Jika Icon Amplop ✉️ -> Pakai 'email'
                // Jika Icon Huruf 'A' -> Pakai 'rich_text'
                // Default Make.com biasanya 'email' atau 'rich_text'. 
                // Kita coba 'email' dulu sesuai icon standar.
                email: { 
                  equals: userEmail,
                },
              },
              {
                // 3. Cek Nama Property: Biasanya 'Status' (Huruf Besar Awal)
                property: 'Status', 
                
                // 4. PERBAIKAN UTAMA DISINI (Berdasarkan Error Log 400)
                // Error bilang DB-nya Text, tapi Anda filter pakai Select.
                // Jadi kita ganti ke 'rich_text'.
                rich_text: { 
                  equals: 'Success', 
                },
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      const transactions = response.data.results;

      // Logika Penentuan
      if (transactions.length > 0) {
        // Cari User ID lokal
        const user = await this.prisma.client.user.findFirst({
          where: { email: userEmail },
        });

        if (user) {
          // Update DB Lokal jadi PRO
          await this.prisma.client.profile.update({
            where: { userId: user.id },
            data: { isPro: true },
          });
          
          return { isPro: true, message: 'Status synced: PRO Active' };
        } else {
             // User belum terdaftar di aplikasi tapi sudah bayar
             return { isPro: false, message: 'User not found in App' };
        }
      }

      return { isPro: false, message: 'No successful transaction found' };

    } catch (error) {
      // Logging Error
      if (axios.isAxiosError(error)) {
        console.error('🔴 NOTION ERROR BODY:', JSON.stringify(error.response?.data, null, 2));
      } else {
        console.error('🔴 UNKNOWN ERROR:', error);
      }
      throw new Error(`Failed to sync: ${error.message}`);
    }
  }
}