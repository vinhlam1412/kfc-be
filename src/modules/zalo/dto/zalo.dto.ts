import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CallBackUrlDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  oa_id: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  giftName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['default', 'kfc', 'cgv'])
  type: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  voucherCode: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  serialNo: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  pinNo: string;
}
