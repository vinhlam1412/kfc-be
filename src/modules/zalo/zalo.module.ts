import { Module } from '@nestjs/common';
import { ZaloService } from './zalo.service';
import { HttpModule } from '@nestjs/axios';
import { ZaloController } from './zalo.controller';

@Module({
  imports: [HttpModule],
  controllers: [ZaloController],
  providers: [ZaloService],
  exports: [ZaloService],
})
export class ZaloModule {}
