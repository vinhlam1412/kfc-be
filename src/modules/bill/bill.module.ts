import { Module } from '@nestjs/common';

import { BillController } from '@bill/bill.controller';
import { BillService } from '@bill/bill.service';

import { SupabaseModule } from '@client/supabase/supabase.module';

import { LoggerModule } from '@logger/logger.module';

@Module({
  controllers: [BillController],
  providers: [BillService],
  imports: [SupabaseModule, LoggerModule.register('KFC_SCAN_BILL')],
})
export class BillModule {}
