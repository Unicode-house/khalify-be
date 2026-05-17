import { Controller, Patch, Param, Body, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProfileService } from './profile.service';

@ApiTags('🪪 Profiles')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Endpoint untuk memperbarui status isPro di database.
   * URL: PATCH /profile/:id/pro-status
   */
  @Patch(':id/pro-status')
  @ApiOperation({
    summary: 'Update PRO subscription status',
    description: `Toggles the PRO subscription status for a user profile. 
    
    Set \`isPro\` to \`true\` to activate PRO features (custom branding, priority support) 
    or \`false\` to deactivate.
    
    ⚠️ This endpoint should ideally be called by internal systems or admin tools, 
    not directly by end users.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Profile UUID',
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  @ApiBody({
    description: 'PRO status toggle payload',
    schema: {
      type: 'object',
      properties: {
        isPro: {
          type: 'boolean',
          example: true,
          description: 'Set to true to activate PRO, false to deactivate',
        },
      },
      required: ['isPro'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PRO status updated',
    schema: {
      example: {
        status: { code: 200, type: 'SUCCESS', message: 'PRO status activated successfully' },
        data: {
          id: 'profile-uuid',
          name: 'John Doe',
          username: 'johndoe',
          avatarUrl: 'https://res.cloudinary.com/.../avatar.jpg',
          bio: 'Content creator 🚀',
          isPro: true,
          create_at: '2026-05-17T13:02:34.000Z',
          userId: 'user-uuid',
        },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
    schema: {
      example: {
        status: { code: 404, type: 'ERROR', message: 'Profile not found' },
        data: { errorCode: 'RESOURCE_NOT_FOUND', errorType: 'RESOURCE_NOT_FOUND', message: 'Profile not found' },
        meta: { requestId: 'uuid', timestamp: '2026-05-17T13:02:34.456Z', apiVersion: '2.0.0' },
      },
    },
  })
  async updateProStatus(
    @Param('id') id: string,
    @Body('isPro', ParseBoolPipe) isPro: boolean,
  ) {
    return this.profileService.updateProStatus(id, isPro);
  }
}