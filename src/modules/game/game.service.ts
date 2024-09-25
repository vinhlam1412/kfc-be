/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '@client/supabase/supabase.service';
import {
  IBill,
  IGame,
  ILog,
} from '@client/supabase/supabase.interface';

import { IGameResponse } from '@game/game.interface';
import { PlusScoreDTO } from '@game/game.dto';

import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { IPlayer } from '@auth/auth.interface';

@Injectable()
export class GameService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async get(
    player_id: number,
    event_id: number,
    game_ids: number[] = [],
  ): Promise<IGameResponse[] | []> {
    const gamePromise = this.supabaseService
      .getSupabase()
      .from('games')
      .select()
      .eq('is_active', true)
      .eq('is_delete', false)
      .in('id', game_ids)
      .order('priority', { ascending: true });
    const billPromise = this.supabaseService
      .getSupabase()
      .from('bills')
      .select()
      .eq('player_id', player_id)
      .eq('event_id', event_id);

    const [gamesResp, billsResp] = await Promise.all([
      gamePromise,
      billPromise,
    ]);

    const games = (gamesResp?.data as IGame[]) || [];
    const bills = (billsResp?.data as IBill[]) || [];

    const resp: IGameResponse[] = [];

    games?.map((game) => {
      const filteredBills = bills?.filter((bill) => bill.game_id === game.id);

      const total = filteredBills?.reduce((pre, cur) => {
        pre += cur.number_of_plays;
        return pre;
      }, 0);

      resp.push({
        id: game.id,
        name: game.name,
        description: game.description,
        number_of_plays: total,
        url: game.url,
        is_test: game.is_test,
        icon: game?.icon,
        priority: game?.priority,
      });
    });

    return resp;
  }

  async play(
    game_code: string,
    player: IPlayer,
    event_id: number,
  ): Promise<PostgrestFilterBuilder<any, any, any, unknown, unknown>> {
    // Xử lý lấy game theo code
    const gameResp = await this.supabaseService
      .getSupabase()
      .from('games')
      .select('id,name,code')
      .eq('code', game_code)
      .maybeSingle();
    if (gameResp?.status !== HttpStatus.OK)
      throw new HttpException(gameResp?.error, gameResp?.status);

    const game = gameResp?.data ? (gameResp?.data as IGame) : undefined;

    if (!game) throw new NotFoundException('Không tìm thấy game');

    const billResp = await this.supabaseService
      .getSupabase()
      .from('bills')
      .select('id,number_of_plays,created_at')
      .eq('game_id', game.id)
      .eq('player_id', player.id)
      .eq('event_id', event_id)
      .gt('number_of_plays', 0)
      .order('created_at', {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (billResp?.status !== HttpStatus.OK) {
      throw new HttpException(billResp?.error, billResp?.status);
    }

    if (!billResp?.data) {
      throw new BadRequestException('Bạn không còn lượt chơi cho game này');
    }

    const result = await this.supabaseService.getSupabase().rpc('play', {
      p_number_of_plays: billResp?.data?.number_of_plays - 1,
      p_number_of_times_spin: player.number_of_times_spin + 1,
      p_bill_id: billResp?.data?.id,
      p_player_id: player.id,
    });

    return result;
  }

  async plusPoints(
    game_code: string,
    player_id: number,
    event_id: number,
    body: PlusScoreDTO,
  ): Promise<PostgrestFilterBuilder<any, any, any, unknown, unknown>> {
    // Xử lý lấy game theo code
    const gameResp = await this.supabaseService
      .getSupabase()
      .from('games')
      .select('id,name,code')
      .eq('code', game_code)
      .maybeSingle();
    if (gameResp?.status !== HttpStatus.OK)
      throw new HttpException(gameResp?.error, gameResp?.status);

    const game = gameResp?.data ? (gameResp?.data as IGame) : undefined;

    if (!game) throw new NotFoundException('Không tìm thấy game');

    const scoreResp = await this.supabaseService
      .getSupabase()
      .from('scores')
      .select('id,score')
      .eq('game_id', game.id)
      .eq('player_id', player_id)
      .eq('event_id', event_id)
      .limit(1)
      .maybeSingle();

    if (scoreResp?.status !== HttpStatus.OK) {
      throw new HttpException(scoreResp?.error, scoreResp?.status);
    }

    const result = await this.supabaseService
      .getSupabase()
      .rpc('upsert_score', {
        p_event_id: event_id,
        p_player_id: player_id,
        p_game_id: game.id,
        p_new_score: body.score,
        p_score: scoreResp?.data?.score
          ? scoreResp?.data?.score + body.score
          : body.score,
      });

    return result;
  }

  async share(
    game_code: string,
    player_id: number,
    event_id: number,
  ): Promise<undefined | ILog> {
    // Xử lý lấy game theo code
    const gameResp = await this.supabaseService
      .getSupabase()
      .from('games')
      .select('id,name,code')
      .eq('code', game_code)
      .maybeSingle();
    if (gameResp?.status !== HttpStatus.OK)
      throw new HttpException(gameResp?.error, gameResp?.status);

    const game = gameResp?.data ? (gameResp?.data as IGame) : undefined;

    if (!game) throw new NotFoundException('Không tìm thấy game');

    const logsResp = await this.supabaseService
      .getSupabase()
      .from('logs')
      .select()
      .eq('game_id', game.id)
      .eq('player_id', player_id)
      .eq('event_id', event_id)
      .limit(1)
      .maybeSingle();

    if (logsResp?.status !== HttpStatus.OK) {
      throw new HttpException(logsResp?.error, logsResp?.status);
    }

    const log = logsResp?.data ? (logsResp?.data as ILog) : undefined;

    if (!log) {
      return undefined;
    }

    const updatedResp = await this.supabaseService
      .getSupabase()
      .from('logs')
      .update({
        total_share: log.total_share + 1,
        updated_at: new Date(),
      })
      .eq('id', log.id);

    if (updatedResp?.status !== HttpStatus.NO_CONTENT) {
      throw new HttpException(updatedResp?.error, updatedResp?.status);
    }

    return log;
  }
}
