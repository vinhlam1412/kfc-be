import { AuthGuard } from '@common/guard/authenticated.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CallBackUrlDto, SendMessageDto } from './dto/zalo.dto';
import { ZaloService } from './zalo.service';
import { IRequest } from '@common/interface';

@Controller('zalo')
export class ZaloController {
  constructor(
    private readonly zaloService: ZaloService,
    private readonly configService: ConfigService,
  ) {}

  @Get('callback')
  async callBackUrl(@Query() query: CallBackUrlDto, @Res() res: Response) {
    await this.zaloService.callBackUrl({
      ...query,
    });
    const redirectUrl = this.configService.get<string>('REDIRECT_URL');
    return res.redirect(redirectUrl);
  }

  @Post('send-message')
  @UseGuards(AuthGuard)
  sendMessage(@Body() payload: SendMessageDto, @Req() req: IRequest) {
    return this.zaloService.sendMessage({
      payload,
      zaloId: req.user.zalo_id,
      fullName: req.user.name,
    });
  }
}
