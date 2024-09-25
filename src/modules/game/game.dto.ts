import { IsNotEmpty, IsNumber } from 'class-validator';

export class PlusScoreDTO {
  @IsNotEmpty()
  @IsNumber()
  score: number;
}
