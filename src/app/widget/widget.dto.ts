import { PartialType } from '@nestjs/mapped-types';

export class CreateWidgetDto {
  token: string;
  dbID: string;
  email: string;
  name?: string;
  // secureCode: string;
}
export class UpdateWidgetDto {
  token: string;
  dbID: string;
}
export class CreateWidgetBulkDto {
  email: string;
  token: string;
  dbIDs: string[];
}
