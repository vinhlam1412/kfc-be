import { Module } from '@nestjs/common';

import { SupabaseModule } from '@client/supabase/supabase.module';

import { ExcelController } from '@excel/excel.controller';
import { ExcelService } from '@excel/excel.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {}
