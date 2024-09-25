import configuration from '@config/index';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';

import { AppService } from './app.service';

import { AuthModule } from '@auth/auth.module';

import { JwtAppModule } from '@jwt/jwt.module';

import { SupabaseModule } from '@client/supabase/supabase.module';

import { ZaloModule } from '@zalo/zalo.module';

import { BillModule } from '@bill/bill.module';

import { GameModule } from '@game/game.module';

import { WheelModule } from '@wheel/wheel.module';

import { LoggerModule } from '@logger/logger.module';

import { TrackingModule } from '@tracking/tracking.module';

import { ExcelModule } from '@excel/excel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtAppModule,
    SupabaseModule,
    AuthModule,
    ZaloModule,
    BillModule,
    GameModule,
    WheelModule,
    TrackingModule,
    LoggerModule.register('KFC'),
    ExcelModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
