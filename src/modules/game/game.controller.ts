/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { GameService } from '@game/game.service';
import { PlusScoreDTO } from '@game/game.dto';

import { IRequest } from '@common/interface';
import { AuthGuard } from '@common/guard/authenticated.guard';

@Controller('games')
// @UseGuards(AuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  get(@Req() req: IRequest) {
    return this.gameService.get(req.user.id, req.event.id, req.event?.game_id);
  }

  @Patch('/:game_code/play')
  play(@Param('game_code') game_code: string, @Req() req: IRequest) {
    return this.gameService.play(game_code, req.user, req.event.id);
  }

  @Post('/:game_code/scores')
  plusScores(
    @Param('game_code') game_code: string,
    @Req() req: IRequest,
    @Body() body: PlusScoreDTO,
  ) {
    return this.gameService.plusPoints(
      game_code,
      req.user.id,
      req.event.id,
      body,
    );
  }

  @Post('/:game_code/share')
  share(@Param('game_code') game_code: string, @Req() req: IRequest) {
    return this.gameService.share(game_code, req.user.id, req.event.id);
  }
}
