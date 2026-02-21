import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWidgetBulkDto,
  CreateWidgetDto,
  UpdateWidgetDto,
  UpdateBioWidgetDto,
} from './widget.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../../helper/base.response';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

interface QueryDbPinnedParams {
  token: string;
  databaseId: string;
  pinned?: string; // "true" | "false" | undefined
  pageSize: number;
  startCursor?: string; // cursor untuk pagination (lihat catatan di bawah)
}

@Injectable()
export class WidgetService extends ResponseHelper {
  constructor(
    private readonly ps: PrismaService,
    private readonly http: HttpService,
    private readonly js: JwtService,
  ) {
    super();
  }

  // GET ALL
  async getAll() {
    const data = await this.ps.client.widget.findMany({
      orderBy: { create_at: 'desc' },
    });

    return ResponseHelper.success(data, 'Widgets retrieved successfully');
  }

  async getNotionDatabases(token: string) {
    // const token = process.env.NOTION_DATABASE_TOKEN;
    const body = {
      filter: {
        property: 'object',
        value: 'database',
      },
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    const { data } = await axios.post(
      'https://api.notion.com/v1/search',
      body,
      {
        headers,
      },
    );

    const databases = data.results.map((db: any) => ({
      id: db.id,
      name: db.title?.[0]?.plain_text || 'Untitled',
      url: db.url,
      last_edited_time: db.last_edited_time,
      icon: db.icon || null,
    }));

    return ResponseHelper.success(
      //  data,
      databases,
      'Notion Databases retrieved successfully',
    );
  }

  async queryDbWithPinnedFilter(params: {
    token: string;
    databaseId: string;
    pinned?: string; // "true" | "false" | undefined
    pageSize: number;
    startCursor?: string;
  }) {
    const { token, databaseId, pinned, pageSize, startCursor } = params;

    if (!token) throw new BadRequestException('token is required');
    if (!databaseId) throw new BadRequestException('databaseId is required');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    const sorts = [
      { property: 'Publish Date', direction: 'descending' },
      { timestamp: 'created_time', direction: 'descending' },
    ];

    // Hide != true (checkbox) => equals false
    const hideFilter = { property: 'Hide', checkbox: { equals: false } };

    // pinned=true => pinned only
    if (pinned === 'true') {
      const body = {
        page_size: pageSize,
        start_cursor: startCursor,
        filter: {
          and: [{ property: 'Pinned', checkbox: { equals: true } }, hideFilter],
        },
        sorts,
      };

      const { data } = await axios.post(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        body,
        { headers },
      );
      return data;
    }

    // pinned=false => unpinned only
    if (pinned === 'false') {
      const body = {
        page_size: pageSize,
        start_cursor: startCursor,
        filter: {
          and: [
            { property: 'Pinned', checkbox: { equals: false } },
            hideFilter,
          ],
        },
        sorts,
      };

      const { data } = await axios.post(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        body,
        { headers },
      );
      return data;
    }

    // pinned param absent => default: pinned max 3 diprioritaskan, lalu unpinned sisanya
    const pinnedLimit = Math.min(3, pageSize);
    const unpinnedLimit = Math.max(0, pageSize - pinnedLimit);

    // 1) get pinned max 3
    const pinnedBody = {
      page_size: pinnedLimit,
      filter: {
        and: [{ property: 'Pinned', checkbox: { equals: true } }, hideFilter],
      },
      sorts,
    };

    const pinnedResp = await axios.post(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      pinnedBody,
      { headers },
    );

    const pinnedResults = pinnedResp.data?.results ?? [];

    // 2) get unpinned fill remainder (paginate pakai startCursor)
    let unpinnedData: any = { results: [], has_more: false, next_cursor: null };

    if (unpinnedLimit > 0) {
      const unpinnedBody = {
        page_size: unpinnedLimit,
        start_cursor: startCursor,
        filter: {
          and: [
            { property: 'Pinned', checkbox: { equals: false } },
            hideFilter,
          ],
        },
        sorts,
      };

      const unpinnedResp = await axios.post(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        unpinnedBody,
        { headers },
      );

      unpinnedData = unpinnedResp.data;
    }

    return {
      object: 'list',
      pinned_default: true,
      pinned_limit: pinnedLimit,
      results: [...pinnedResults, ...(unpinnedData?.results ?? [])],
      next_cursor: unpinnedData?.next_cursor ?? null,
      has_more: Boolean(unpinnedData?.has_more),
    };
  }

  async getDetail(id: string) {
  try {
    // 1. Validasi Input (Basic Null Safety)
    if (!id) {
      return ResponseHelper.error('ID tidak boleh kosong', 400, 'BAD_REQUEST');
    }

    const widget = await this.ps.client.widget.findUnique({
      where: { dbID: id },
      include: {
        profile: true,
      },
    });

    // 2. Jika data tidak ada di database
    if (!widget) {
      return ResponseHelper.error('Widget tidak ditemukan', 404, 'NOT_FOUND');
    }

    // 3. Mapping dengan Null Safety (Optional Chaining & Nullish Coalescing)
    const responseData = {
      id: widget.id,
      token: widget.token ?? '',
      link: widget.link ?? '',
      name: widget.name ?? 'Unnamed Widget',
      dbID: widget.dbID,
      create_at: widget.create_at,
      profileId: widget.profileId,
      // Jika profile null, isPro otomatis false tanpa crash
      isPro: widget.profile?.isPro ?? false, 
    };

    return ResponseHelper.success([responseData], 'Widget retrieved successfully');

  } catch (error: any) {
    // 4. Logging yang lebih spesifik untuk debugging di Vercel Logs
    console.error('SERVER_CRASH_DETAIL:', {
      message: error.message,
      stack: error.stack,
      id_requested: id
    });

    // Jangan tampilkan pesan "kasar" ke user/client di production, 
    // cukup simpan di console log saja.
    return ResponseHelper.error(
      'Terjadi kesalahan internal pada server', 
      500, 
      error.code ?? 'INTERNAL_SERVER_ERROR'
    );
  }
}

  async getWidgetByEmail(token: string) {
    const payload = this.js.decode(token);

    const user = await this.ps.client.user.findFirst({
      where: { email: payload.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ps.client.profile.findFirst({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const widgets = await this.ps.client.widget.findMany({
      where: { profileId: profile.id },
    });

    if (!widgets) {
      throw new NotFoundException('Widgets not found');
    }

    return ResponseHelper.success(widgets, 'Widgets retrieved successfully');
  }

 async getEmbedData(dbID: string) {
  try {
    console.log(`[GET_EMBED] Memanggil data untuk dbID: ${dbID}`);

    const widget = await this.ps.client.widget.findUnique({
      where: { dbID: dbID },
      include: {
        profile: {
          select: {
            isPro: true,
          },
        },
      },
    });

    if (!widget) {
      console.warn(`[GET_EMBED] Widget dengan dbID ${dbID} tidak ditemukan.`);
      return ResponseHelper.error('Widget not found', 404, 'NOT_FOUND');
    }

    const isProUser = widget.profile?.isPro ?? false;

    // Susun response agar mudah dibaca Frontend
    const result = {
      id: widget.id,
      name: widget.name, // Nama internal widget
      dbID: widget.dbID,
      token: widget.token,
      link: widget.link,
      isPro: isProUser,
      
      // Data Branding Custom (Hanya dikirim jika User PRO dan Toggle ON)
      branding: (isProUser) ? {
        displayName: widget.customName || widget.name, // Fallback ke nama widget jika customName kosong
        avatarUrl: widget.customAvatar,
        username: widget.customUsername,
        bio: widget.customBio,
        customLink: widget.customLink,
      } : null
    };

    console.log(`[GET_EMBED] Result Branding:`, result.branding ? 'AKTIF' : 'NON-AKTIF/FREE');
    
    return ResponseHelper.success(result, 'Embed data retrieved successfully');
  } catch (error) {
    console.error('[GET_EMBED] Error:', error);
    return ResponseHelper.error('Internal Server Error', 500);
  }
}
  // CREATE
  async create(dto: CreateWidgetDto) {
    // 1. Decode token (dto.email sepertinya berisi token JWT)
    let decode;
    try {
      decode = await this.js.decode(dto.email);
    } catch (e) {
      throw new BadRequestException('Invalid Auth Token');
    }

    if (!decode || !decode.email) {
      throw new BadRequestException('Invalid Token Payload');
    }

    // 2. Cari User & VALIDASI DULU sebelum akses property-nya
    const user = await this.ps.client.user.findFirst({
      where: { email: decode.email },
    });

    if (!user) {
      throw new NotFoundException('User not found'); // Cegah Error 500
    }

    // 3. Cari Profile & VALIDASI DULU
    const profile = await this.ps.client.profile.findFirst({
      where: { userId: user.id }, // Aman diakses karena user sudah dicek
    });

    if (!profile) {
      throw new NotFoundException('Profile not found'); // Cegah Error 500
    }

    // 4. Cek Duplikat Widget (Baru aman panggil profile.id)
    const existingWidget = await this.ps.client.widget.findFirst({
      where: { dbID: dto.dbID },
    });

    if (existingWidget) {
      throw new MethodNotAllowedException(
        `Widget dengan Database ID ${dto.dbID} sudah terdaftar di sistem.`,
      );
    }

    // Ini penyebab Error 405 (Validasi Logic)
    // if (widget) {
    //   throw new MethodNotAllowedException(
    //     'Widget for this database already exists',
    //   );
    // }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const data = await this.ps.client.widget.create({
      data: {
        token: dto.token,
        dbID: dto.dbID,
        name: dto.name,
        profileId: profile.id,
        link: `https://widget.khlasify.com/embed/${code}?db=${dto.dbID}`,
      },
    });
    try {
      const response = await axios.post(
        'https://khlasify-widget-be.vercel.app/widgets/create',
        data,
      );
      // success logic
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 405) {
        console.error(
          'Database ini sudah terdaftar sebagai widget. Silakan pilih database lain.',
        );
      } else {
        console.error('Terjadi kesalahan pada server.');
      }
    }

    return ResponseHelper.success(
      {
        user,
        profile,
        widget: data,
        embedLink: `https://widget.khlasify.com/embed/${code}?db=${dto.dbID}`,
      },
      'Widget created successfully',
      201,
    );
  }

async updateWidgetBranding(widgetId: string, profileId: string, dto: UpdateBioWidgetDto) {
  // 1. Cari widget & cek status Pro pemiliknya
  const widget = await this.ps.client.widget.findUnique({
    where: { id: widgetId },
    include: { profile: true }
  });

  if (!widget) throw new NotFoundException('Widget tidak ditemukan');
  
  // 2. PROTEKSI: Cek apakah user adalah pemilik & apakah dia PRO
  if (widget.profileId !== profileId) throw new ForbiddenException('Akses ditolak');
  
  if (!widget.profile.isPro) {
    throw new BadRequestException('Fitur Custom Branding hanya untuk akun PRO!');
  }

  // 3. Update data widget
  const updatedWidget = await this.ps.client.widget.update({
    where: { id: widgetId },
    data: {
      name: dto.name,
      customAvatar: dto.customAvatar,
      customUsername: dto.customUsername,
      customName: dto.customName,
      customBio: dto.customBio,
      customLink: dto.customLink
    }
  });

  return ResponseHelper.success(updatedWidget, 'Widget branding updated!');
}

  async createBulk(dto: CreateWidgetBulkDto) {
    const decode = await this.js.decode(dto.email);

    const user = await this.ps.client.user.findFirst({
      where: { email: decode.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ps.client.profile.findFirst({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // ambil widget yang sudah ada
    const existingWidgets = await this.ps.client.widget.findMany({
      where: {
        profileId: profile.id,
        dbID: { in: dto.dbIDs },
      },
      select: { dbID: true },
    });

    const existingDbIDs = new Set(existingWidgets.map((w) => w.dbID));

    // filter yang belum ada
    const widgetsToCreate = dto.dbIDs
      .filter((dbID) => !existingDbIDs.has(dbID))
      .map((dbID) => ({
        token: dto.token,
        dbID,
        profileId: profile.id,
      }));

    if (widgetsToCreate.length === 0) {
      throw new MethodNotAllowedException(
        'All widgets for these databases already exist',
      );
    }

    // bulk insert
    await this.ps.client.widget.createMany({
      data: widgetsToCreate,
    });

    // ambil data yang baru dibuat
    const widgets = await this.ps.client.widget.findMany({
      where: {
        profileId: profile.id,
        dbID: { in: widgetsToCreate.map((w) => w.dbID) },
      },
    });

    return ResponseHelper.success(
      {
        user,
        profile,
        createdCount: widgets.length,
        skippedCount: existingDbIDs.size,
        widgets,
        embedLinks: widgets.map((w) => {
          const code = Math.floor(100000 + Math.random() * 900000);
          return `https://widget.khlasify.com/embed/${code}?db=${w.dbID}`;
        }),
      },
      'Widgets created successfully',
      201,
    );
  }

  // CREATE BULK
  // async createBulk(data: CreateWidgetDto[]) {
  //   const result = await this.ps.client.widget.createMany({
  //     data,
  //     skipDuplicates: true,
  //   });

  //   return ResponseHelper.success(result, 'Widgets created successfully', 201);
  // }

  // UPDATE
  async update(id: string, dto: UpdateWidgetDto) {
    const exists = await this.ps.client.widget.findUnique({
      where: { id },
    });

    if (!exists) {
      return ResponseHelper.error(
        'Widget not found',
        404,
        'RESOURCE_NOT_FOUND',
      );
    }

    const data = await this.ps.client.widget.update({
      where: { id },
      data: dto,
    });

    return ResponseHelper.success(data, 'Widget updated successfully');
  }

  // DELETE
  async delete(id: string) {
    const exists = await this.ps.client.widget.findFirst({
      where: { id },
    });

    if (!exists) {
      return ResponseHelper.error(
        'Widget not found',
        404,
        'RESOURCE_NOT_FOUND',
      );
    }

    const data = await this.ps.client.widget.delete({
      where: { id },
    });

    return ResponseHelper.success(data, 'Widget deleted successfully');
  }
}
