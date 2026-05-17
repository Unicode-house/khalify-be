import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateMidtransTransactionDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the user initiating the payment',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'UUID of the user profile associated with the payment',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({
    example: 99000,
    description: 'Transaction amount in IDR (Indonesian Rupiah). Minimum: 1',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;
}
