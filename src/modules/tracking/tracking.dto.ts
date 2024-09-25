import { IsDate, IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatedTrackingReqDto {
    @IsOptional()
    @IsString()
    screen?: string;

    @IsNotEmpty()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    game_code?: string;

    @IsOptional()
    @IsString()
    button?: string;

    @IsOptional()
    @IsDateString()
    entry_time?: string;

    @IsOptional()
    @IsDateString()
    exit_time?: string;

    @IsOptional()
    @IsDateString()
    click_at?: string;
}