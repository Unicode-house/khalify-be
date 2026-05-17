import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestMagicLinkDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send the magic link to. If the user does not exist, a new account is created automatically.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyTokenDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...',
    description: 'Magic link token received via email (64-character hex string)',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address associated with the magic link token',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
