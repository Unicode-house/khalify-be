import {
  Body,
  Controller,
  Delete,
  Get,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { WidgetService } from './widget.service';
import {
  CreateWidgetBulkDto,
  CreateWidgetDto,
  UpdateBioWidgetDto,
  UpdateWidgetDto,
} from './widget.dto';
import { JwtAuthGuard } from '../../helper/jwt-bio-guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseHelper } from '../../helper/base.response';
import { CloudinaryService } from '../../helper/cloudinary.service';

@ApiTags('📦 Widgets')
@Controller('widgets')
export class WidgetController {
  constructor(
    private readonly widgetService: WidgetService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────
  // GET ALL WIDGETS
  // ─────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Get all widgets',
    description: 'Retrieves all registered widgets in the system, sorted by creation date (newest first). Returns a collection response with items array.',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection of all widgets',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Widgets retrieved successfully' },
        data: {
          items: [
            {
              id: 'a1b2c3d4-uuid',
              token: 'ntn_abc123...',
              dbID: 'notion-db-uuid',
              name: 'My Blog Widget',
              link: 'https://widget.khlasify.com/embed/123456?db=notion-db-uuid',
              profileId: 'profile-uuid',
              create_at: '2026-05-17T13:02:34.000Z',
            },
          ],
          count: 1,
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0', responseTimeMs: 35 },
      },
    },
  })
  async getAll() {
    return this.widgetService.getAll();
  }

  // ─────────────────────────────────────────────────────────────────────
  // NOTION PAGES QUERY
  // ─────────────────────────────────────────────────────────────────────

  @Get('/ntn/:token/db/:databaseId/pages')
  @ApiOperation({
    summary: 'Query Notion database pages',
    description: `Proxies a query to the Notion API to retrieve pages from a specific database. 
    Supports filtering by **pinned** status and pagination via **startCursor**.
    
    **Pinned behavior:**
    - \`pinned=true\` → returns only pinned pages
    - \`pinned=false\` → returns only unpinned pages  
    - *(omitted)* → returns up to 3 pinned + remaining unpinned (smart default)`,
  })
  @ApiParam({ name: 'token', description: 'Notion integration token', example: 'ntn_abc123xyz...' })
  @ApiParam({ name: 'databaseId', description: 'Notion database UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiQuery({ name: 'pinned', required: false, enum: ['true', 'false'], description: 'Filter by pinned status' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of items per page (default: 10)', example: 10 })
  @ApiQuery({ name: 'startCursor', required: false, description: 'Notion pagination cursor for next page', example: 'abc123-cursor' })
  @ApiResponse({ status: 200, description: 'Notion pages retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Missing required parameters (token or databaseId)' })
  @ApiResponse({ status: 401, description: 'Invalid Notion token' })
  async getNotionPages(
    @Param('token') token: string,
    @Param('databaseId') databaseId: string,
    @Query('pinned') pinned?: string,
    @Query('pageSize') pageSize?: string,
    @Query('startCursor') startCursor?: string,
  ) {
    const size = Number.isFinite(Number(pageSize))
      ? Math.max(1, Number(pageSize))
      : 10;

    return this.widgetService.queryDbWithPinnedFilter({
      token,
      databaseId,
      pinned,
      pageSize: size,
      startCursor,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // GET NOTION DATABASES
  // ─────────────────────────────────────────────────────────────────────

  @Post('/getNotionDatabases/:token')
  @ApiOperation({
    summary: 'List Notion databases',
    description: `Retrieves all databases accessible by the provided Notion integration token. 
    Each database includes an \`isAlreadyWidget\` flag indicating if it's already registered in Khalify.`,
  })
  @ApiParam({ name: 'token', description: 'Notion integration token', example: 'ntn_abc123xyz...' })
  @ApiResponse({
    status: 200,
    description: 'List of Notion databases with registration status',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Notion databases retrieved successfully' },
        data: {
          items: [
            { id: 'notion-db-uuid-1', name: 'Blog Posts', url: 'https://notion.so/...', lastEditedTime: '2026-05-17T13:02:34.000Z', icon: null, isAlreadyWidget: true },
            { id: 'notion-db-uuid-2', name: 'Projects', url: 'https://notion.so/...', lastEditedTime: '2026-05-16T10:00:00.000Z', icon: null, isAlreadyWidget: false },
          ],
          count: 2,
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired Notion token' })
  async getNotionDatabases(@Param('token') token: string) {
    return await this.widgetService.getNotionDatabases(token);
  }

  // ─────────────────────────────────────────────────────────────────────
  // GET WIDGET DETAIL
  // ─────────────────────────────────────────────────────────────────────

  @Get('/detail/:id')
  @ApiOperation({
    summary: 'Get widget detail by database ID',
    description: 'Retrieves detailed information about a specific widget, including branding fields (customName, customAvatar, etc.) and PRO status.',
  })
  @ApiParam({ name: 'id', description: 'Notion database ID of the widget', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({
    status: 200,
    description: 'Widget detail with branding information',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Widget retrieved successfully' },
        data: {
          id: 'widget-uuid',
          token: 'ntn_abc123...',
          link: 'https://widget.khlasify.com/embed/123456?db=notion-db-uuid',
          name: 'My Blog Widget',
          dbID: 'notion-db-uuid',
          createdAt: '2026-05-17T13:02:34.000Z',
          profileId: 'profile-uuid',
          isPro: true,
          customName: 'John\'s Blog',
          customAvatar: 'https://res.cloudinary.com/.../avatar.jpg',
          customUsername: '@johndoe',
          customBio: 'Content creator 🚀',
          customLink: 'https://johndoe.com',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Widget ID is empty' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async getDetail(@Param('id') id: string) {
    return this.widgetService.getDetail(id);
  }

  // ─────────────────────────────────────────────────────────────────────
  // GET WIDGETS BY USER (via JWT Token Header)
  // ─────────────────────────────────────────────────────────────────────

  @Get('/list')
  @ApiOperation({
    summary: 'Get widgets owned by current user',
    description: 'Retrieves all widgets owned by the user identified through the `khalify-token` header (JWT). Decodes the JWT to extract the user email.',
  })
  @ApiHeader({
    name: 'khalify-token',
    required: true,
    description: 'JWT token of the authenticated user',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({ status: 200, description: 'Collection of widgets owned by the user' })
  @ApiResponse({ status: 404, description: 'User or profile not found' })
  async getListWidgets(@Headers('khalify-token') khalifyToken: string) {
    return this.widgetService.getWidgetByEmail(khalifyToken);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CREATE WIDGET
  // ─────────────────────────────────────────────────────────────────────

  @Post('/create')
  @ApiOperation({
    summary: 'Create a new widget',
    description: `Registers a new Notion database as a Khalify widget. Generates a unique embed link.
    
    **Duplicate check:** If a widget with the same \`dbID\` already exists, returns HTTP 405.`,
  })
  @ApiBody({ type: CreateWidgetDto })
  @ApiResponse({
    status: 201,
    description: 'Widget created with embed link',
    schema: {
      example: {
        status: { code: 201, type: 'SUCCESS', message: 'Widget created successfully' },
        data: {
          user: { id: 'user-uuid', email: 'user@example.com' },
          profile: { id: 'profile-uuid', name: 'John Doe', isPro: false },
          widget: { id: 'widget-uuid', dbID: 'notion-db-uuid', name: 'My Widget', token: 'ntn_...' },
          embedLink: 'https://widget.khlasify.com/embed/123456?db=notion-db-uuid',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid auth token or token payload' })
  @ApiResponse({ status: 404, description: 'User or profile not found' })
  @ApiResponse({ status: 405, description: 'Widget for this database ID already exists' })
  async create(@Body() dto: CreateWidgetDto) {
    return this.widgetService.create(dto);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CREATE BULK WIDGETS
  // ─────────────────────────────────────────────────────────────────────

  @Post('bulk')
  @ApiOperation({
    summary: 'Create multiple widgets at once',
    description: `Bulk-registers multiple Notion databases as widgets. Automatically skips databases that are already registered.
    Returns the count of created and skipped widgets.`,
  })
  @ApiBody({ type: CreateWidgetBulkDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk widgets created',
    schema: {
      example: {
        status: { code: 201, type: 'SUCCESS', message: 'Widgets created successfully' },
        data: {
          createdCount: 2,
          skippedCount: 1,
          widgets: [{ id: 'uuid-1', dbID: 'db-1' }, { id: 'uuid-2', dbID: 'db-2' }],
          embedLinks: ['https://widget.khlasify.com/embed/111?db=db-1', 'https://widget.khlasify.com/embed/222?db=db-2'],
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User or profile not found' })
  @ApiResponse({ status: 405, description: 'All databases are already registered as widgets' })
  async createBulk(@Body() dto: CreateWidgetBulkDto) {
    return this.widgetService.createBulk(dto);
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPDATE WIDGET
  // ─────────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({
    summary: 'Update widget token and database ID',
    description: 'Updates the Notion integration token and database ID for an existing widget.',
  })
  @ApiParam({ name: 'id', description: 'Widget UUID', format: 'uuid' })
  @ApiBody({ type: UpdateWidgetDto })
  @ApiResponse({ status: 200, description: 'Widget updated successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return this.widgetService.update(id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPDATE WIDGET BRANDING (PRO ONLY)
  // ─────────────────────────────────────────────────────────────────────

  @Patch('bio/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Update widget branding (PRO only)',
    description: `Updates custom branding fields for a widget (name, avatar, username, bio, link).
    
    ⚠️ **PRO feature only** — the authenticated user must have an active PRO subscription.
    The user must also be the **owner** of the widget.`,
  })
  @ApiParam({ name: 'id', description: 'Widget UUID', format: 'uuid' })
  @ApiBody({ type: UpdateBioWidgetDto })
  @ApiResponse({ status: 200, description: 'Widget branding updated successfully' })
  @ApiResponse({ status: 400, description: 'Custom branding is PRO-only feature' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'User is not the owner of this widget' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async updateBranding(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateBioWidgetDto,
  ) {
    const profileId = req.user.profileId;
    return await this.widgetService.updateWidgetBranding(id, profileId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────
  // DELETE WIDGET
  // ─────────────────────────────────────────────────────────────────────

  @Delete('/delete/:id')
  @ApiOperation({
    summary: 'Delete a widget',
    description: 'Permanently deletes a widget by its UUID. The associated Notion database is NOT affected.',
  })
  @ApiParam({ name: 'id', description: 'Widget UUID to delete', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async delete(@Param('id') id: string) {
    return this.widgetService.delete(id);
  }

  // ─────────────────────────────────────────────────────────────────────
  // GET EMBED DATA (Public)
  // ─────────────────────────────────────────────────────────────────────

  @Get('embed/:dbID')
  @ApiOperation({
    summary: 'Get widget embed data (public)',
    description: `Retrieves the data needed to render an embedded widget on the frontend.
    Includes the Notion token, branding data (if PRO), and embed link.
    
    This endpoint is **public** — no authentication required.`,
  })
  @ApiParam({ name: 'dbID', description: 'Notion database ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({
    status: 200,
    description: 'Embed data with branding (PRO) or without',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Embed data retrieved successfully' },
        data: {
          id: 'widget-uuid',
          name: 'My Blog Widget',
          dbID: 'notion-db-uuid',
          token: 'ntn_abc123...',
          link: 'https://...',
          isPro: true,
          branding: {
            displayName: 'John\'s Blog',
            avatarUrl: 'https://res.cloudinary.com/.../avatar.jpg',
            username: '@johndoe',
            bio: 'Content creator 🚀',
            customLink: 'https://johndoe.com',
          },
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async getEmbed(@Param('dbID') dbID: string) {
    return await this.widgetService.getEmbedData(dbID);
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPLOAD AVATAR (PRO ONLY)
  // ─────────────────────────────────────────────────────────────────────

  @Patch(':dbID/upload-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload widget avatar image (PRO only)',
    description: `Uploads an image file to Cloudinary and saves the URL as the widget's custom avatar.
    
    ⚠️ Requires **JWT authentication** and **PRO subscription**.
    The form field name must be \`file\`.`,
  })
  @ApiParam({ name: 'dbID', description: 'Notion database ID of the widget' })
  @ApiBody({
    description: 'Avatar image file (JPG, PNG, WebP)',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image file to upload' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded and saved',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'Avatar uploaded and saved successfully' },
        data: { url: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Not the widget owner or not PRO' })
  async uploadAvatar(
    @Param('dbID') dbID: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const result = await this.cloudinaryService.uploadImage(file);
    const imageUrl = result.secure_url;
    const profileId = req.user.profileId;
    await this.widgetService.updateWidgetBranding(dbID, profileId, {
      customAvatar: imageUrl,
    });

    return ResponseHelper.success(
      { url: imageUrl },
      'Avatar uploaded and saved successfully',
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // REMOVE AVATAR (PRO ONLY)
  // ─────────────────────────────────────────────────────────────────────

  @Patch(':dbID/remove-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Remove widget avatar (PRO only)',
    description: 'Removes the custom avatar from a widget. If no avatar is set, returns success without performing a database update.',
  })
  @ApiParam({ name: 'dbID', description: 'Notion database ID of the widget' })
  @ApiResponse({ status: 200, description: 'Avatar removed (or already empty)' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Not the widget owner' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async removeAvatar(@Param('dbID') dbID: string, @Req() req: any) {
    const profileId = req.user.profileId;
    return await this.widgetService.removeWidgetAvatar(dbID, profileId);
  }
}
