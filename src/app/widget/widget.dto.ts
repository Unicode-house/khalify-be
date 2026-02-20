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

export class UpdateBioWidgetDto {
  name?: string;           // Nama Widget
  customAvatar?: string;   // Atur Foto Profil
  customUsername?: string; // Atur Username
  customName?: string;     // Atur Display Name
  customBio?: string;      // Atur Bio
  customLink?: string;     // Atur Link
}
