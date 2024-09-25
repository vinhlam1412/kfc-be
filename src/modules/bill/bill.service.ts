/* eslint-disable prettier/prettier */
import { SupabaseService } from '@client/supabase/supabase.service';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ScanBillDTO } from '@bill/bill.dto';

import { PostgrestSingleResponse } from '@supabase/supabase-js';

import {
  IBill,
  IComboConfig,
  IGame,
  IGameConfig,
  IStore,
} from '@client/supabase/supabase.interface';
import { ConfigService } from '@nestjs/config';

import * as moment from 'moment-timezone';
import { IPlayer } from '@auth/auth.interface';

@Injectable()
export class BillService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async scan(
    body: ScanBillDTO,
    player_id: number,
    event_id: number,
    player: IPlayer
  ): Promise<PostgrestSingleResponse<null> | IBill> {
    const data = {
      ...body,
      player_id,
    };

    // validate 
    if (body?.combos?.length <= 0) {
      throw new BadRequestException(`{username} vui lòng chụp lại hóa đơn có phần ăn "Hành Trình Ký Ức" để tham gia chơi game nhận quà nhé!`);
    }

    if (!body?.invoice && !body?.order_note) {
      throw new BadRequestException(`{username} vui lòng chụp lại hóa đơn có phần ăn "Hành Trình Ký Ức" để tham gia chơi game nhận quà nhé!`);
    }

    const qb = this.supabaseService.getSupabase().from('bills').select('*');

    if (body.invoice && body.invoice !== '') {
      qb.eq('invoice', body.invoice);
    }

    if (body.order_note && body.order_note !== '') {
      qb.eq('order_note', body.order_note);
    }

    const [billResp, gameResp, storeResp] = await Promise.all([
      qb.limit(1).maybeSingle(),
      this.supabaseService
        .getSupabase()
        .from('games')
        .select('id,name,code')
        .eq('code', body.game_code)
        .limit(1)
        .maybeSingle(),
      this.supabaseService
        .getSupabase()
        .from('stores')
        .select('id,area')
        .eq('store_id', body?.store_id)
        .limit(1)
        .maybeSingle(),
    ]);

    if (billResp?.status !== HttpStatus.OK) {
      throw new HttpException(billResp?.error, billResp?.status);
    }

    if (gameResp?.status !== HttpStatus.OK) {
      throw new HttpException(gameResp?.error, gameResp?.status);
    }

    if (storeResp?.status !== HttpStatus.OK) {
      throw new HttpException(storeResp?.error, storeResp?.status);
    }

    const bill = billResp?.data ? (billResp?.data as IBill) : undefined;
    const game = gameResp?.data ? (gameResp?.data as IGame) : undefined;
    const store = gameResp?.data ? (storeResp?.data as unknown as IStore) : undefined;

    if (!game) throw new NotFoundException('{username} vui lòng chụp lại hóa đơn có phần ăn "Hành Trình Ký Ức" để tham gia chơi game nhận quà nhé!');
    if (!store) throw new NotFoundException(`{username} vui lòng chụp rõ nét lại hóa đơn có phần ăn "Hành Trình Ký Ức" để tham gia chơi game nhận quà nhé!`);

    if (bill) {
      const data_update: { player_id: number; game_id: number } = {
        player_id: bill.player_id,
        game_id: bill.game_id,
      };

      if (bill.player_id !== player_id) {
        data_update.player_id = player_id;
      }

      if (bill.game_id !== game.id) {
        data_update.game_id = game.id;
      }

      const result = await this.supabaseService
        .getSupabase()
        .rpc('update_bills', {
          p_player_id: player_id,
          p_game_id: game.id,
          p_event_id: event_id,
          p_bill_id: bill.id,
          p_area: store.area,
          p_invoice: bill?.invoice || null,
          p_order_note: bill?.order_note || null,
          p_store_id: bill?.store_id
        });

      if (
        result?.status !== HttpStatus.OK &&
        result?.status !== HttpStatus.CREATED &&
        result?.status !== HttpStatus?.NO_CONTENT
      ) {
        throw new HttpException(result?.error, result?.status);
      }

      return { ...bill, ...data_update };
    }

    // Get combo config
    const gameConfigResp = await this.supabaseService
      .getSupabase()
      .from('game_configs')
      .select('id,metadata,event_id')
      .eq('event_id', event_id)
      .limit(1)
      .maybeSingle();

    if (gameConfigResp?.status !== HttpStatus.OK)
      throw new HttpException(gameConfigResp?.error, gameConfigResp?.status);

    const gameConfigs = gameConfigResp?.data
      ? (gameConfigResp?.data as unknown as IGameConfig)
      : undefined;

    const number_of_plays = this.getNumberOfPlays(
      body.combos,
      gameConfigs?.metadata?.combos || [],
    );

    // Kiểm tra xem player scan bill có quá số lượng config cho 1 ngày không
    const totalScanBillPerDay =
      gameConfigs?.metadata?.commoms?.max_scan_bill ||
      this.configService.get<number>('game.totalScanBillPerDay');
    const currentDateOfVN = moment().tz('Asia/Ho_Chi_Minh');
    const startOfDayUTC = moment(currentDateOfVN)
      .startOf('day')
      .utc()
      .toISOString();
    const endOfDayUTC = moment(currentDateOfVN)
      .endOf('day')
      .utc()
      .toISOString();

    const billsResp = await this.supabaseService
      .getSupabase()
      .from('bills')
      .select('id')
      .eq('player_id', player_id)
      .eq('event_id', event_id)
      .gte('created_at', startOfDayUTC)
      .lte('created_at', endOfDayUTC);
    if (billResp?.status !== HttpStatus.OK) {
      throw new HttpException(billResp?.error, billsResp?.status);
    }

    const total = billsResp?.data ? billsResp?.data?.length : 0;
    const whiteList = this.configService.get<string>('game.whiteList')?.split(',') || [];

    
    // Kiểm tra total scan bill thành công >= 15 lần/ngày thì block user vĩnh viễn
    if (total >= 15 && !whiteList?.includes(player?.phone)) {
      const updatePlayerResp = await this.supabaseService.getSupabase().from('players').update({
        permanently_locked: true
      }).eq('id', player.id);

      if (updatePlayerResp?.status !== HttpStatus.NO_CONTENT) {
        throw new HttpException(updatePlayerResp?.error, updatePlayerResp?.status);
      }

      throw new ForbiddenException(`Hệ thống phát hiện dấu hiệu vi phạm của bạn khi tham gia chương trình "Hành Trình Ký Ức", vui lòng liên hệ kĩ thuật 0906903655 nếu có sự nhầm lẫn.`);
    }

    if ((total >= (totalScanBillPerDay * (player.number_of_block + 1))) && total < 15 && !whiteList?.includes(player?.phone)) {
      // NEED TO IMPLEMENTS
      const timeBlock = gameConfigs?.metadata?.commoms?.time_block || this.configService.get<number>('game.timeBlock');
      const updatePlayerResp = await this.supabaseService.getSupabase().from('players').update({
        is_block: true,
        number_of_block: player.number_of_block + 1,
        expired_block: moment().add(timeBlock, 'hours'),
      }).eq('id', player_id);

      if (updatePlayerResp?.status !== HttpStatus.NO_CONTENT) {
        throw new HttpException(updatePlayerResp?.error, updatePlayerResp?.status);
      }

      throw new ForbiddenException(`Bạn đã bị khóa tài khoản trong ${timeBlock}, do bạn đã quét bill quá nhiều lần.`);
    }

    const result = await this.supabaseService
      .getSupabase()
      .rpc('create_bills', {
        p_invoice: data?.invoice || null,
        p_store_id: data.store_id,
        p_game_id: game.id,
        p_player_id: player_id,
        p_event_id: event_id,
        p_combos: data?.combos || [],
        p_number_of_plays: number_of_plays,
        p_order_note: data.order_note || null,
        p_area: store.area,
      });

    if (
      result?.status !== HttpStatus.OK &&
      result?.status !== HttpStatus.CREATED &&
      result?.status !== HttpStatus?.NO_CONTENT
    ) {
      throw new HttpException(result?.error, result?.status);
    }

    return {
      ...data,
      number_of_plays,
      player_id,
      event_id,
    } as unknown as IBill;
  }

  private getNumberOfPlays(
    combos: { code: string; quantity: number }[],
    comboConfigs: IComboConfig[],
  ): number {
    if (combos.length <= 0 || comboConfigs.length <= 0) return 0;

    let total = 0;

    combos.map((combo) => {
      const found = comboConfigs?.find(
        (comboCode) =>
          combo.code?.toLowerCase() === comboCode.code?.toLowerCase(),
      );

      if (found && found?.number_of_plays && combo.quantity >= 1) {
        total += found.number_of_plays * combo.quantity;
      }
    });

    return total;
  }
}
