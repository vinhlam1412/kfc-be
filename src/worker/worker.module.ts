import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WorkerService } from '@worker/worker.service';

import { SupabaseModule } from '@client/supabase/supabase.module';

import { LoggerModule } from '@logger/logger.module';

import configuration from '@config/index';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    LoggerModule.register('worker'),
    SupabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot()
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
