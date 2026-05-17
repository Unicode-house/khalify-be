import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET DTOs — Request Payload Definitions
// ═══════════════════════════════════════════════════════════════════════════

export class CreateWidgetDto {
  @ApiProperty({
    example: 'ntn_abc123xyz789...',
    description: 'Notion integration token for accessing the database',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Notion database ID to create the widget from',
  })
  @IsString()
  @IsNotEmpty()
  dbID: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token of the authenticated user (used to resolve user identity)',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'My Blog Widget',
    description: 'Display name for the widget (defaults to Notion database name)',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateWidgetDto {
  @ApiProperty({
    example: 'ntn_abc123xyz789_updated...',
    description: 'Updated Notion integration token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Target Notion database ID',
  })
  @IsString()
  @IsNotEmpty()
  dbID: string;
}

export class CreateWidgetBulkDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token of the authenticated user',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'ntn_abc123xyz789...',
    description: 'Notion integration token for all databases',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: ['db-id-1-uuid', 'db-id-2-uuid', 'db-id-3-uuid'],
    description: 'Array of Notion database IDs to register as widgets',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  dbIDs: string[];
}

export class UpdateBioWidgetDto {
  @ApiPropertyOptional({
    example: 'My Content Hub',
    description: 'Internal widget name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    description: 'Custom avatar image URL (Cloudinary)',
  })
  @IsOptional()
  @IsString()
  customAvatar?: string;

  @ApiPropertyOptional({
    example: '@johndoe',
    description: 'Custom username displayed on the widget',
  })
  @IsOptional()
  @IsString()
  customUsername?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Custom display name shown on the widget',
  })
  @IsOptional()
  @IsString()
  customName?: string;

  @ApiPropertyOptional({
    example: 'Content creator & tech enthusiast 🚀',
    description: 'Custom bio text for the widget profile',
  })
  @IsOptional()
  @IsString()
  customBio?: string;

  @ApiPropertyOptional({
    example: 'https://johndoe.com',
    description: 'Custom link displayed on the widget',
  })
  @IsOptional()
  @IsString()
  customLink?: string;
}
