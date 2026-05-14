import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CreateWidgetBulkDto,
  CreateWidgetDto,
  UpdateWidgetDto,
  UpdateBioWidgetDto,
} from './widget.dto';
import { Widget } from '../../database/entities/widget.entity';
import { User } from '../../database/entities/user.entity';
import { Profile } from '../../database/entities/profile.entity';
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
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly http: HttpService,
    private readonly js: JwtService,
  ) {
    super();
  }

  // GET ALL
  async getAll() {
    const data = await this.widgetRepo.find({
      order: { create_at: 'DESC' },
    });

    return ResponseHelper.success(data, 'Widgets retrieved successfully');
  }

  async getNotionDatabases(token: string) {
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

    try {
      // 1. Ambil list database dari API Notion
      const { data } = await axios.post(
        'https://api.notion.com/v1/search',
        body,
        { headers },
      );

      // 2. Ambil semua ID widget yang sudah ada di database lokal kamu
      const existingWidgets = await this.widgetRepo.find({
        select: ['dbID'],
      });

      // 3. Ubah ke bentuk Set agar proses pencocokan jauh lebih cepat (O(1) lookup)
      const registeredDbIds = new Set(
        existingWidgets.map((widget) => widget.dbID),
      );

      // 4. Map data dari Notion dan tambahkan flag 'isAlreadyWidget'
      const databases = data.results.map((db: any) => ({
        id: db.id,
        name: db.title?.[0]?.plain_text || 'Untitled',
        url: db.url,
        last_edited_time: db.last_edited_time,
        icon: db.icon || null,
        // Jika ID dari Notion ada di dalam Set database lokal, jadikan true
        isAlreadyWidget: registeredDbIds.has(db.id),
      }));

      return ResponseHelper.success(
        databases,
        'Notion Databases retrieved successfully',
      );
    } catch (error: any) {
      // Pertahankan error handling yang sudah kita buat sebelumnya
      if (error.response) {
        if (error.response.status === 401) {
          throw new HttpException(
            'Token Notion tidak valid',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          error.response.data.message || 'Gagal mengambil data dari Notion',
          error.response.status,
        );
      }
      throw new HttpException(
        'Terjadi kesalahan server',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
      if (!id) {
        return ResponseHelper.error(
          'ID tidak boleh kosong',
          400,
          'BAD_REQUEST',
        );
      }

      const widget = await this.widgetRepo.findOne({
        where: { dbID: id },
        relations: ['profile'],
      });

      if (!widget) {
        return ResponseHelper.error('Widget tidak ditemukan', 404, 'NOT_FOUND');
      }

      // UPDATE: Masukkan field branding ke dalam mapping responseData
      const responseData = {
        id: widget.id,
        token: widget.token ?? '',
        link: widget.link ?? '',
        name: widget.name ?? 'Unnamed Widget',
        dbID: widget.dbID,
        create_at: widget.create_at,
        profileId: widget.profileId,
        isPro: widget.profile?.isPro ?? false,

        // --- FIELD BARU DISINI ---
        customName: widget.customName,
        customAvatar: widget.customAvatar,
        customUsername: widget.customUsername,
        customBio: widget.customBio,
        customLink: widget.customLink,
      };

      return ResponseHelper.success(
        [responseData],
        'Widget retrieved successfully',
      );
    } catch (error: any) {
      console.error('SERVER_CRASH_DETAIL:', {
        message: error.message,
        stack: error.stack,
        id_requested: id,
      });

      return ResponseHelper.error(
        'Terjadi kesalahan internal pada server',
        500,
        error.code ?? 'INTERNAL_SERVER_ERROR',
      );
    }
  }
  async updateWidgetAvatar(dbID: string, profileId: string, imageUrl: string) {
    // Pastikan pemilik widget yang mengupdate
    const widget = await this.widgetRepo.findOne({
      where: { dbID: dbID },
    });

    if (!widget || widget.profileId !== profileId) {
      throw new ForbiddenException('Akses ditolak atau widget tidak ditemukan');
    }

    await this.widgetRepo.update(
      { dbID: dbID },
      { customAvatar: imageUrl },
    );

    return await this.widgetRepo.findOne({ where: { dbID: dbID } });
  }
  async getWidgetByEmail(token: string) {
    const payload = this.js.decode(token);

    const user = await this.userRepo.findOne({
      where: { email: (payload as any).email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profileRepo.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const widgets = await this.widgetRepo.find({
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

      const widget = await this.widgetRepo.findOne({
        where: { dbID: dbID },
        relations: ['profile'],
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
        branding: isProUser
          ? {
              displayName: widget.customName || widget.name, // Fallback ke nama widget jika customName kosong
              avatarUrl: widget.customAvatar,
              username: widget.customUsername,
              bio: widget.customBio,
              customLink: widget.customLink,
            }
          : null,
      };

      console.log(
        `[GET_EMBED] Result Branding:`,
        result.branding ? 'AKTIF' : 'NON-AKTIF/FREE',
      );

      return ResponseHelper.success(
        result,
        'Embed data retrieved successfully',
      );
    } catch (error) {
      console.error('[GET_EMBED] Error:', error);
      return ResponseHelper.error(
        'Internal Server Error',
        500,
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
  // CREATE
  async create(dto: CreateWidgetDto) {
    // 1. Decode token
    let decode;
    try {
      decode = await this.js.decode(dto.email);
    } catch (e) {
      throw new BadRequestException('Invalid Auth Token');
    }

    if (!decode || !decode.email) {
      throw new BadRequestException('Invalid Token Payload');
    }

    // 2. Cari User
    const user = await this.userRepo.findOne({
      where: { email: decode.email },
    });
    if (!user) throw new NotFoundException('User not found');

    // 3. Cari Profile
    const profile = await this.profileRepo.findOne({
      where: { userId: user.id },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // 4. Cek Duplikat Widget
    const existingWidget = await this.widgetRepo.findOne({
      where: { dbID: dto.dbID },
    });

    if (existingWidget) {
      throw new HttpException(
        {
          message: `Widget dengan Database ID ${dto.dbID} sudah terdaftar di sistem.`,
          code: 'WIDGET_ALREADY_EXIST',
        },
        HttpStatus.METHOD_NOT_ALLOWED, // 405
      );
    }

    // 5. Buat Kode Unik & Simpan ke Database
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Ambil FRONTEND_URL dari .env (Opsi 2 yang kita bahas sebelumnya)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const embedLink = `${frontendUrl}/embed/${code}?db=${dto.dbID}`;

    const newWidget = this.widgetRepo.create({
      token: dto.token,
      dbID: dto.dbID,
      name: dto.name,
      profileId: profile.id,
      link: embedLink,
    });

    const data = await this.widgetRepo.save(newWidget);

    // 6. LANGSUNG RETURN SUKSES (TIDAK PERLU AXIOS LAGI!)
    return ResponseHelper.success(
      {
        user,
        profile,
        widget: data,
        embedLink: embedLink,
      },
      'Widget created successfully',
      201, // HTTP 201 Created
    );
  }

  async updateWidgetBranding(
    widgetId: string,
    profileId: string,
    dto: UpdateBioWidgetDto,
  ) {
    // 1. Cari widget & cek status Pro pemiliknya
    const widget = await this.widgetRepo.findOne({
      where: { id: widgetId },
      relations: ['profile'],
    });

    if (!widget) throw new NotFoundException('Widget tidak ditemukan');

    // 2. PROTEKSI: Cek apakah user adalah pemilik & apakah dia PRO
    if (widget.profileId !== profileId)
      throw new ForbiddenException('Akses ditolak');

    if (!widget.profile.isPro) {
      throw new BadRequestException(
        'Fitur Custom Branding hanya untuk akun PRO!',
      );
    }

    // 3. Update data widget
    await this.widgetRepo.update(
      { id: widgetId },
      {
        name: dto.name,
        customAvatar: dto.customAvatar,
        customUsername: dto.customUsername,
        customName: dto.customName,
        customBio: dto.customBio,
        customLink: dto.customLink,
      },
    );

    const updatedWidget = await this.widgetRepo.findOne({ where: { id: widgetId } });

    return ResponseHelper.success(updatedWidget, 'Widget branding updated!');
  }
  async removeWidgetAvatar(widgetId: string, profileId: string) {
    // 1. Ambil data SECUKUPNYA saja
    const widget = await this.widgetRepo.findOne({
      where: { id: widgetId },
      select: ['id', 'profileId', 'customAvatar'],
    });

    if (!widget) throw new NotFoundException('Widget tidak ditemukan');
    if (widget.profileId !== profileId)
      throw new ForbiddenException('Akses ditolak');

    // 2. CEK RESOURCE: Jika sudah kosong, JANGAN lakukan operasi UPDATE ke database
    if (!widget.customAvatar) {
      return ResponseHelper.success(
        null,
        'Avatar memang sudah kosong, tidak ada resource database yang terpakai.',
      );
    }

    // 3. Jika ada isinya, baru lakukan query UPDATE
    await this.widgetRepo.update(
      { id: widgetId },
      { customAvatar: null },
    );

    return ResponseHelper.success(null, 'Avatar berhasil dihapus');
  }
  async createBulk(dto: CreateWidgetBulkDto) {
    const decode = await this.js.decode(dto.email);

    const user = await this.userRepo.findOne({
      where: { email: (decode as any).email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profileRepo.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // ambil widget yang sudah ada
    const existingWidgets = await this.widgetRepo.find({
      where: {
        profileId: profile.id,
        dbID: In(dto.dbIDs),
      },
      select: ['dbID'],
    });

    const existingDbIDs = new Set(existingWidgets.map((w) => w.dbID));

    // filter yang belum ada
    const widgetsToCreate = dto.dbIDs
      .filter((dbID) => !existingDbIDs.has(dbID))
      .map((dbID) => this.widgetRepo.create({
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
    await this.widgetRepo.save(widgetsToCreate);

    // ambil data yang baru dibuat
    const widgets = await this.widgetRepo.find({
      where: {
        profileId: profile.id,
        dbID: In(widgetsToCreate.map((w) => w.dbID)),
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

  // UPDATE
  async update(id: string, dto: UpdateWidgetDto) {
    const exists = await this.widgetRepo.findOne({
      where: { id },
    });

    if (!exists) {
      return ResponseHelper.error(
        'Widget not found',
        404,
        'RESOURCE_NOT_FOUND',
      );
    }

    await this.widgetRepo.update({ id }, dto);
    const data = await this.widgetRepo.findOne({ where: { id } });

    return ResponseHelper.success(data, 'Widget updated successfully');
  }

  // DELETE
  async delete(id: string) {
    const exists = await this.widgetRepo.findOne({
      where: { id },
    });

    if (!exists) {
      return ResponseHelper.error(
        'Widget not found',
        404,
        'RESOURCE_NOT_FOUND',
      );
    }

    await this.widgetRepo.remove(exists);

    return ResponseHelper.success(exists, 'Widget deleted successfully');
  }
}
