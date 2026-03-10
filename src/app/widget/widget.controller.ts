import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { WidgetService } from './widget.service';
import {
  CreateWidgetBulkDto,
  CreateWidgetDto,
  UpdateBioWidgetDto,
  UpdateWidgetDto,
} from './widget.dto';
import { JwtAuthGuard } from '../../helper/jwt-bio-guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseHelper } from 'src/helper/base.response';
import { CloudinaryService } from '../../helper/cloudinary.service';

@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService, private readonly cloudinaryService: CloudinaryService,) {}

  /**
   * GET ALL WIDGETS
   */
  @Get()
  async getAll() {
    return this.widgetService.getAll();
  }

  @Get('/ntn/:token/db/:databaseId/pages')
  async getNotionPages(
    @Param('token') token: string,
    @Param('databaseId') databaseId: string,
    @Query('pinned') pinned?: string, // "true" | "false" | undefined
    @Query('pageSize') pageSize?: string, // default 10
    @Query('startCursor') startCursor?: string,
  ) {
    const size = Number.isFinite(Number(pageSize))
      ? Math.max(1, Number(pageSize))
      : 10;

    return this.widgetService.queryDbWithPinnedFilter({
      token,
      databaseId,
      pinned, // raw
      pageSize: size,
      startCursor,
    });
  }

  @Post('/getNotionDatabases/:token')
  async getNotionDatabases(@Param('token') token: string) {
    return await this.widgetService.getNotionDatabases(token);
  }
  /**
   * GET WIDGET DETAIL
   */
  @Get('/detail/:id')
  async getDetail(@Param('id') id: string) {
    return this.widgetService.getDetail(id);
  }

  @Get('/list')
  async getListWidgets(@Headers('khalify-token') khalifyToken: string) {
    return this.widgetService.getWidgetByEmail(khalifyToken);

    // console.log(khalifyToken);
  }

  /**
   * CREATE WIDGET
   */
  @Post('/create')
  async create(@Body() dto: CreateWidgetDto) {
    return this.widgetService.create(dto);
  }

  /**
   * CREATE BULK WIDGETS
   */
  // @Post('bulk')
  // async createBulk(@Body() data: CreateWidgetDto[]) {
  //   return this.widgetService.createBulk(data);
  // }

  @Post('bulk')
  // @UseGuards(JwtAuthGuard) // aktifkan kalau pakai auth
  async createBulk(@Body() dto: CreateWidgetBulkDto) {
    return this.widgetService.createBulk(dto);
  }

  /**
   * UPDATE WIDGET
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return this.widgetService.update(id, dto);
  }

  @Patch('bio/:id')
  @UseGuards(JwtAuthGuard)
  async updateBranding(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateBioWidgetDto,
  ) {
    // req.user sekarang akan berisi data dari JwtStrategy.validate()
    const profileId = req.user.profileId;
    return await this.widgetService.updateWidgetBranding(id, profileId, dto);
  }
  /**
   * DELETE WIDGET
   */
  @Delete('/delete/:id')
  async delete(@Param('id') id: string) {
    return this.widgetService.delete(id);
  }
  @Get('embed/:dbID')
  async getEmbed(@Param('dbID') dbID: string) {
    return await this.widgetService.getEmbedData(dbID);
  }

  @Patch(':dbID/upload-avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // Nama field di FormData harus 'file'
  async uploadAvatar(
    @Param('dbID') dbID: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    // 1. Upload ke Cloudinary
    const result = await this.cloudinaryService.uploadImage(file);

    // 2. Ambil URL aman (https) dari Cloudinary
    const imageUrl = result.secure_url;

    // 3. Simpan link tersebut ke database (Table Widget)
    const profileId = req.user.profileId; // Dari JWT
    await this.widgetService.updateWidgetBranding(dbID, profileId, {
      customAvatar: imageUrl,
    });

    return ResponseHelper.success(
      { url: imageUrl },
      'Avatar uploaded and saved successfully',
    );
  }

  @Patch(':dbID/remove-avatar')
  @UseGuards(JwtAuthGuard)
  async removeAvatar(
    @Param('dbID') dbID: string,
    @Req() req: any,
  ) {
    const profileId = req.user.profileId; // Dari JWT

    // Kita panggil service yang sudah ada, tapi set customAvatar menjadi null / string kosong
    await this.widgetService.updateWidgetBranding(dbID, profileId, {
      customAvatar: null, // Ubah menjadi '' (string kosong) jika skema Prisma-mu tidak mengizinkan null
    } as any); // Gunakan 'as any' sementara jika DTO-mu menolak nilai null

    return ResponseHelper.success(
      null,
      'Avatar berhasil dihapus',
    );
  }
}
