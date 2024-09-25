import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SupabaseService } from '@client/supabase/supabase.service';

import { LoggerService } from '@logger/logger.service';

@Injectable()
export class WorkerService {
  constructor(private readonly loggerService: LoggerService, private readonly supabaseService: SupabaseService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'reset block player',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async updatePlayer() {
    try {
        this.loggerService.log('Cron reset data player running');
        const updatedResp = await this.supabaseService.getSupabase().from('players').update({
            is_block: false,
            expired_block: null,
            number_of_block: 0,
        }).eq('is_block', true);
        
        if (updatedResp?.status !== HttpStatus.NO_CONTENT) {
            throw new Error(updatedResp.error.message);
        }

        this.loggerService.log('Cron reset data player finshed');
    } catch (error) {
        this.loggerService.error(error?.message, error?.stack);
    }
  }
}
