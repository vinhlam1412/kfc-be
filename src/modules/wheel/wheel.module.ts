import { Module } from '@nestjs/common';

import { WheelController } from '@wheel/wheel.controller';
import { WheelService } from '@wheel/wheel.service';

import { SupabaseModule } from '@client/supabase/supabase.module';

@Module({
  controllers: [WheelController],
  imports: [SupabaseModule],
  providers: [WheelService],
})
export class WheelModule {}
