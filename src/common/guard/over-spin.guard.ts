/* eslint-disable prettier/prettier */
import { SupabaseService } from '@client/supabase/supabase.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { IRequest } from '@common/interface';

import * as moment from 'moment-timezone';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class OverSpinGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as IRequest;
    const currentDateOfVN = moment().tz('Asia/Ho_Chi_Minh');
    if (request?.user) {
      const totalSpin = await this.supabaseService
        .getSupabase()
        .from('history_rewards')
        .select('id')
        .eq('player_id', request.user?.id)
        .gte(
          'created_at',
          currentDateOfVN?.clone()?.startOf('day')?.utc()?.toISOString(),
        )
        .lte(
          'created_at',
          currentDateOfVN?.clone()?.endOf('day')?.utc()?.toISOString(),
        );
      const maxSpin = this.configService.get<number>('game.maxSpin') || 10;

      if (totalSpin?.data?.length >= maxSpin) {
        await this.supabaseService
          .getSupabase()
          .from('players')
          .update({
            permanently_locked: true,
          })
          .eq('id', request.user?.id);
        throw new ForbiddenException(
          `Hệ thống phát hiện dấu hiệu vi phạm của bạn khi tham gia chương trình "Hành Trình Ký Ức", vui lòng liên hệ kĩ thuật 0906903655 nếu có sự nhầm lẫn.`,
        );
      }
    }
    return true;
  }
}
