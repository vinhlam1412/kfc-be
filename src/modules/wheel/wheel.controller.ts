/* eslint-disable prettier/prettier */
import { AuthGuard } from '@common/guard/authenticated.guard';
import { OverSpinGuard } from '@common/guard/over-spin.guard';
import { IRequest } from '@common/interface';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { WheelService } from '@wheel/wheel.service';

@Controller('wheels')
@UseGuards(AuthGuard)
export class WheelController {
  constructor(private readonly wheelService: WheelService) {}

  @Post('/spin')
  @UseGuards(OverSpinGuard)
  spin(@Req() req: IRequest) {
    return this.wheelService.spin(
      req.user,
      req.event,
      req.user.number_of_times_spin,
    );
  }

  @Get('histories/rewards')
  historyRewards(@Req() req: IRequest) {
    return this.wheelService.history(req.user.id, req.event.id);
  }
}
