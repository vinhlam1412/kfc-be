/* eslint-disable prettier/prettier */
import { SupabaseService } from '@client/supabase/supabase.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { IPlayer } from '@auth/auth.interface';

import { JwtAppService } from '@jwt/jwt.service';

import { IRequest } from '@common/interface';

import { IEvent } from '@client/supabase/supabase.interface';

import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtAppService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  private extractTokenFromHeader(request: IRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const currentDateOfVN = moment().tz('Asia/Ho_Chi_Minh');
    const supabase = this.supabaseService.getSupabase();

    const request = context.switchToHttp().getRequest() as IRequest;
    const token = this.extractTokenFromHeader(request);
    const eventCode = request.headers['x-event-code'] as string;

    if (!token) {
      throw new UnauthorizedException();
    }

    const payload = await this.jwtService.verifyToken({
      JWT_TOKEN_KEY: process.env.JWT_TOKEN_KEY,
      token,
    });

    const [userResp, eventResp] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('id', payload.user.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id, is_start, game_id, start_date, end_date')
        .eq('code', eventCode?.trim())
        .lte('start_date', currentDateOfVN.utc().toISOString())
        .gte('end_date', currentDateOfVN.utc().toISOString())
        .limit(1)
        .maybeSingle(),
    ]);

    if (userResp?.status !== HttpStatus.OK)
      throw new HttpException(userResp?.error, userResp?.status);

    if (eventResp?.status !== HttpStatus.OK)
      throw new HttpException(eventResp?.error, eventResp?.status);

    if (!eventResp?.data && request.url !== '/auth/me') {
      throw new UnauthorizedException('Không tìm thấy event');
    }

    if (!userResp?.data) {
      throw new UnauthorizedException('Không tìm thấy user');
    }

    request.user = userResp?.data as IPlayer;
    request.event = eventResp?.data as IEvent;

    // white list
    const whiteList = this.configService.get<string>('game.whiteList')?.split(',') || [];
    if (whiteList?.includes(request.user?.phone)) {
      return true;
    }

    if (request.user.permanently_locked) {
      throw new ForbiddenException(`Hệ thống phát hiện dấu hiệu vi phạm của bạn khi tham gia chương trình "Hành Trình Ký Ức", vui lòng liên hệ kĩ thuật 0906903655 nếu có sự nhầm lẫn.`);
    }

    // Xử lý xem user bị block không do quét bill quá quy định
    if (request.user?.is_block) {
      // Kiểm tra xem user này quá thời gian block chưa nếu rồi thì mở block cho user
      if (
        request.user?.expired_block &&
        new Date().getTime() >= new Date(request.user.expired_block).getTime()
      ) {
        const updatedUserResp = await this.supabaseService
          .getSupabase()
          .from('players')
          .update({
            is_block: false,
            expired_block: null,
          })
          .eq('id', request.user.id);

        if (updatedUserResp?.status !== HttpStatus.NO_CONTENT)
          throw new HttpException(
            updatedUserResp?.error,
            updatedUserResp?.status,
          );
      } else {
        throw new ForbiddenException(`Hệ thống phát hiện dấu hiệu vi phạm của bạn khi tham gia chương trình "Hành Trình Ký Ức", vui lòng liên hệ kĩ thuật 0906903655 nếu có sự nhầm lẫn.`);
      }
    }

    return true;
  }
}
