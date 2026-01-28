import { Controller, Patch, Param, Body, ParseBoolPipe, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Endpoint untuk memperbarui status isPro di database (Supabase).
   * URL: PATCH /profile/:id/pro-status
   */
  @Patch(':id/pro-status')
  async updateProStatus(
    @Param('id') id: string,
    @Body('isPro', ParseBoolPipe) isPro: boolean,
  ) {
    return this.profileService.updateProStatus(id, isPro);
  }
}