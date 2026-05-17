import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SyncStatusQueryDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user to sync PRO status for',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Optional display name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
