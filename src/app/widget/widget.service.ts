import {
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWidgetBulkDto,
  CreateWidgetDto,
  UpdateWidgetDto,
} from './widget.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../../helper/base.response';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
  // DETAIL
  async getDetail(id: string) {
    const data = await this.ps.client.widget.findMany({
      where: {
        dbID: id,
      },
    });

    if (!data) {
      return ResponseHelper.error(
        'Widget not found',
        404,
        'RESOURCE_NOT_FOUND',
      );
    }

    return ResponseHelper.success(data, 'Widget retrieved successfully');
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

  // CREATE
  async create(dto: CreateWidgetDto) {
    // const compare = await bcrypt.compare(
    //   dto.secureCode,
    //   '$2b$10$HHzcHq1whnolioELQVdLRuvn/EGFhpKZoZ26q5u2UbJ1smsHBy7p2',
    // );

    // if (compare === false) {
    //   throw new MethodNotAllowedException('Invalid secure code');
    // }

    const decode = await this.js.decode(dto.email);

    const user = await this.ps.client.user.findFirst({
      where: { email: decode.email },
    });

    const profile = await this.ps.client.profile.findFirst({
      where: { userId: user.id },
    });
    const widget = await this.ps.client.widget.findFirst({
      where: {
        dbID: dto.dbID,
        profileId: profile.id,
      },
    });

    if (widget) {
      throw new MethodNotAllowedException(
        'Widget for this database already exists',
      );
    }

    if (!profile || !user) {
      throw new NotFoundException('User or profile not found');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const data = await this.ps.client.widget.create({
      data: {
        token: dto.token,
        dbID: dto.dbID,
        name: dto.name,
        profileId: profile.id,
        link: `https://khalify-notion-widgets.vercel.app/embed/${code}?db=${dto.dbID}`,
      },
    });

    return ResponseHelper.success(
      {
        user,
        profile,
        widget: data,
        embedLink: `https://khalify-notion-widgets.vercel.app/embed/${code}?db=${dto.dbID}`,
      },
      'Widget created successfully',
      201,
    );
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
          return `https://khalify-notion-widgets.vercel.app/embed/${code}?db=${w.dbID}`;
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
