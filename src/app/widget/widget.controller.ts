import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { WidgetService } from './widget.service';
import { CreateWidgetBulkDto, CreateWidgetDto, UpdateWidgetDto } from './widget.dto';

@Controller('widgets')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

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

  /**
   * DELETE WIDGET
   */
  @Delete('/delete/:id')
  async delete(@Param('id') id: string) {
    return this.widgetService.delete(id);
  }
}
