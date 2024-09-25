import { Module } from '@nestjs/common';

import { GameController } from '@game/game.controller';
import { GameService } from '@game/game.service';

import { SupabaseModule } from '@client/supabase/supabase.module';

@Module({
  controllers: [GameController],
  imports: [SupabaseModule],
  providers: [GameService],
})
export class GameModule {}
