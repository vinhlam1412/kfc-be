/* eslint-disable prettier/prettier */
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ScanBillDTO {
  @IsOptional()
  @IsString()
  @Transform((params) => {
    if (params?.value && typeof params.value === 'string' && params.value !== '') {
      let value = params.value?.match(/[0-9-]+/g)?.join('');
      return value || params.value;
    }

    return undefined
  })
  invoice?: string;

  @IsNotEmpty()
  @IsNumber()
  store_id: number;

  @IsNotEmpty()
  @IsString()
  game_code: number;

  @IsOptional()
  @IsString()
  @Transform((params) => {
    if (typeof params.value === 'string') {
      return params.value?.replace(/\s+/g, '');
    }

    return undefined
  })
  order_note?: string;

  @IsNotEmpty()
  @IsArray()
  combos: {
    code: string;
    quantity: number;
  }[];
}
