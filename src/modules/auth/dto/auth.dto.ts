import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class LoginDto {
  phone_token: string;
  zalo_access_token: string;
  zaloId: string;
  avatar: string;
  name: string;
}

export class CheckMeDTO {
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class UpdatePlayerDTO {
  @IsOptional()
  @IsString()
  @IsPhoneNumber('VN')
  alternative_phone?: string;

  @IsOptional()
  @IsString()
  alternative_name?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;
}
