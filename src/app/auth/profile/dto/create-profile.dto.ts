import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user profile',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'johndoe_2026',
    description: 'Unique username (must be unique across all profiles)',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    description: 'URL of the user avatar image',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'Content creator and Notion enthusiast 🚀',
    description: 'Short biography text',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the associated User entity',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
