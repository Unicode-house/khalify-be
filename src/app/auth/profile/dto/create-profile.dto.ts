import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsString()
  userId: string;
}
