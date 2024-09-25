/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { SupabaseService } from '@client/supabase/supabase.service';
import {
  IEvent,
  ILocationConfig,
  IHistoryReward,
  IReward,
  IRewardConfig,
  ICommomConfig,
  IGameConfig,
  IVoucherConfig,
  ITicketConfig,
  ITicket,
} from '@client/supabase/supabase.interface';

import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { IPlayer } from '@auth/auth.interface';

@Injectable()
export class WheelService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async spin(
    player: IPlayer,
    event: IEvent,
    number_of_times_spin: number,
  ): Promise<{
    is_winning: boolean;
    code?: string;
    type?: string;
    item?: object;
    index_reward: number;
  }> {
    if (number_of_times_spin <= 0)
      throw new BadRequestException('Bạn không còn đủ lượt quay');

    let randomRewardItems = this.getRandomInt(201);
    let randomRewardTickets = this.getRandomInt(300);

    // Lấy time hiện tại của viet nam
    const currentDateOfVN = moment().tz('Asia/Ho_Chi_Minh');

    // Lấy config game
    const { locationConfigs, voucherConfigs, ticketConfigs, rewardConfigs } =
      await this.getConfigGame(event.id);

    // Lấy last bill và store
    const lastBillResp = await this.supabaseService
      .getSupabase()
      .from('bills')
      .select('id, store_id')
      .eq('player_id', player.id)
      .eq('event_id', event.id)
      .order('created_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (lastBillResp?.status !== HttpStatus.OK) {
      throw new HttpException(lastBillResp?.error, lastBillResp?.status);
    }

    let area = undefined;

    if (lastBillResp?.data?.store_id) {
      const storeResp = await this.supabaseService
        .getSupabase()
        .from('stores')
        .select('id,area')
        .eq('store_id', lastBillResp?.data?.store_id)
        .limit(1)
        .maybeSingle();
      if (storeResp?.status !== HttpStatus.OK) {
        throw new HttpException(storeResp?.error, storeResp?.status);
      }

      area = storeResp?.data?.area;
    }

    if (!area) {
      const logResp = await this.supabaseService
        .getSupabase()
        .from('logs')
        .select('id,area')
        .eq('player_id', player.id)
        .limit(1)
        .maybeSingle();

      if (logResp?.status !== HttpStatus.OK)
        throw new HttpException(logResp?.error, logResp?.status);

      area = logResp?.data ? logResp?.data?.area : undefined;
    }

    if (!area) {
      throw new BadRequestException('Lượt chơi đã thuộc về người khác');
    }

    if (
      randomRewardItems === 200 ||
      randomRewardItems === 101 ||
      randomRewardItems === 51 ||
      randomRewardItems === 25
    ) {
      // Kiểm tra xe user đó trung ticket chưa nếu trúng r thì ko trúng nữa
      const ticketOfUserResp = await this.supabaseService
        .getSupabase()
        .from('history_rewards')
        .select('id,type,player_id')
        .eq('type', 'ticket')
        .eq('player_id', player.id);

      if (ticketOfUserResp?.status !== HttpStatus.OK)
        throw new HttpException(
          ticketOfUserResp?.error,
          ticketOfUserResp?.status,
        );

      if (ticketOfUserResp?.data?.length === 0) {
        const rewardID = await this.getRewardID(
          currentDateOfVN,
          event,
          rewardConfigs,
          area,
          player.id,
        );

        if (rewardID !== null) {
          const result = await this.processGetRewardItems(
            area,
            player.id,
            event,
            number_of_times_spin - 1,
            rewardID,
            currentDateOfVN,
          );

          if (result) {
            return result;
          }
        }
      }
    }

    if (this.calPercent()) {
      randomRewardTickets = this.getRandomInt(11);
    }

    if (
      randomRewardTickets === 50 ||
      (this.calPercent() &&
        (randomRewardTickets === 2 ||
          randomRewardTickets === 5 ||
          randomRewardTickets === 9))
    ) {
      const rewardID = await this.processGetRewardTicketID(
        currentDateOfVN,
        player.id,
        event,
        locationConfigs,
        area,
        ticketConfigs,
      );

      if (rewardID !== null) {
        const resultReward = await this.processRewardTickets(
          rewardID,
          event,
          area,
          number_of_times_spin - 1,
          player.id,
        );

        if (resultReward) {
          return resultReward;
        }
      }
    }

    return await this.processGetVoucher(
      currentDateOfVN,
      locationConfigs,
      area,
      player.id,
      event,
      number_of_times_spin - 1,
      voucherConfigs || [],
    );
  }

  async history(
    player_id: number,
    event_id: number,
  ): Promise<IHistoryReward[]> {
    const historyRewardsResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select(
        `
      id,
      type,
      gift_at,
      vouchers(
        code,
        barcode,
        started_at,
        ended_at
      ),
      rewards(
        name,
        image,
        code
      )
      `,
      )
      .eq('player_id', player_id)
      .eq('event_id', event_id);

    if (historyRewardsResp?.status !== HttpStatus.OK) {
      throw new HttpException(
        historyRewardsResp?.error,
        historyRewardsResp?.status,
      );
    }

    const historyRewards = historyRewardsResp?.data
      ? (historyRewardsResp?.data as unknown as IHistoryReward[])
      : [];

    return historyRewards;
  }

  // Function to generate a random integer between 0 and 100
  private getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  private async getConfigGame(event_id: number): Promise<{
    commomConfigs: ICommomConfig;
    locationConfigs: ILocationConfig[];
    voucherConfigs: IVoucherConfig[];
    ticketConfigs: ITicketConfig[];
    rewardConfigs: IRewardConfig[];
  }> {
    const gameConfigsResp = await this.supabaseService
      .getSupabase()
      .from('game_configs')
      .select('id,metadata,event_id')
      .eq('event_id', event_id)
      .limit(1)
      .maybeSingle();

    if (gameConfigsResp?.status !== HttpStatus.OK) {
      throw new HttpException(gameConfigsResp?.error, gameConfigsResp?.status);
    }
    const gameConfigs = gameConfigsResp?.data as unknown as IGameConfig;

    if (!gameConfigs?.metadata?.commoms || !gameConfigs?.metadata?.locations) {
      throw new BadRequestException('Không tìm thấy config');
    }

    return {
      commomConfigs: gameConfigs?.metadata?.commoms,
      locationConfigs: gameConfigs?.metadata?.locations,
      voucherConfigs: gameConfigs?.metadata?.vouchers || [],
      ticketConfigs: gameConfigs?.metadata?.tickets || [],
      rewardConfigs: gameConfigs?.metadata?.rewards || [],
    };
  }

  private isGroup1(currentDateOfVN: moment.Moment): boolean {
    const dayOfWeek = currentDateOfVN.day(); // Get day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)

    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      return true; // Monday to Thursday
    }

    return false;
  }

  private async processGetVoucher(
    currentDateOfVN: moment.Moment,
    locationConfigs: ILocationConfig[],
    area: string,
    player_id: number,
    event: IEvent,
    number_of_times_spin: number,
    voucherConfigs: IVoucherConfig[],
  ): Promise<{
    is_winning: boolean;
    code?: string;
    type?: string;
    item?: object;
    index_reward: number;
  }> {
    let totalVoucher = 0;
    let startDay = null;
    let endDay = null;
    voucherConfigs?.forEach((voucherConfig) => {
      if (
        totalVoucher <= 0 &&
        new Date(currentDateOfVN.clone().toISOString()).getTime() <=
          new Date(voucherConfig.ended_at).getTime() &&
        new Date(currentDateOfVN.clone().toISOString()).getTime() >=
          new Date(voucherConfig.started_at).getTime()
      ) {
        startDay = voucherConfig?.started_at;
        endDay = voucherConfig?.ended_at;
        totalVoucher = voucherConfig.total;
      }
    });

    // tính tổng voucher theo khu vực
    const locationConfig = locationConfigs?.find(
      (locationConfig) =>
        locationConfig?.code?.toLowerCase() === area?.toLowerCase(),
    );

    totalVoucher = Math.round(
      totalVoucher * ((locationConfig?.rate || 0) / 100),
    );

    if (totalVoucher <= 0) {
      // Cập nhập lại lượt quay của user
      const result = await this.supabaseService
        .getSupabase()
        .rpc('update_number_spin_of_player', {
          p_number_of_times_spin: number_of_times_spin,
          p_player_id: player_id,
        });

      if (
        result?.status !== HttpStatus.OK &&
        result?.status !== HttpStatus.CREATED &&
        result?.status !== HttpStatus.NO_CONTENT
      ) {
        throw new HttpException(result?.error, result?.status);
      }

      return { is_winning: false, index_reward: 0 };
    }

    const totalVoucherOfDayResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select()
      .eq('type', 'voucher')
      .eq('area', area)
      .eq('event_id', event.id)
      .lte('gift_at', endDay)
      .gte('gift_at', startDay);

    if (totalVoucherOfDayResp?.status !== HttpStatus.OK) {
      throw new HttpException(
        totalVoucherOfDayResp?.error,
        totalVoucherOfDayResp?.status,
      );
    }

    const totalVoucherOfDay = totalVoucherOfDayResp?.data?.length;

    if (totalVoucherOfDay >= totalVoucher) {
      const result = await this.supabaseService
        .getSupabase()
        .rpc('create_history_reward', {
          p_type: 'no_rewards',
          p_is_give: true,
          p_voucher_id: null,
          p_event_id: event.id,
          p_area: area,
          p_player_id: player_id,
          p_item_quantity: null,
          p_reward_id: null,
          p_number_of_times_spin: number_of_times_spin,
          p_ticket_id: null,
        });

      if (
        result?.status !== HttpStatus.OK &&
        result?.status !== HttpStatus.CREATED &&
        result?.status !== HttpStatus.NO_CONTENT
      ) {
        throw new HttpException(result?.error, result?.status);
      }

      return { is_winning: false, index_reward: 0 };
    }

    const voucherResp = await this.supabaseService
      .getSupabase()
      .from('vouchers')
      .select('id,code,is_give,barcode')
      .eq('is_give', false)
      .eq('event_id', event.id)
      .lte('started_at', currentDateOfVN?.toISOString())
      .eq('is_delete', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (voucherResp?.status !== HttpStatus.OK) {
      throw new HttpException(voucherResp?.error, voucherResp?.status);
    }

    if (!voucherResp?.data) {
      const result = await this.supabaseService
        .getSupabase()
        .rpc('create_history_reward', {
          p_type: 'no_rewards',
          p_is_give: true,
          p_voucher_id: null,
          p_event_id: event.id,
          p_area: area,
          p_player_id: player_id,
          p_item_quantity: null,
          p_reward_id: null,
          p_number_of_times_spin: number_of_times_spin,
          p_ticket_id: null,
        });

      if (
        result?.status !== HttpStatus.OK &&
        result?.status !== HttpStatus.CREATED &&
        result?.status !== HttpStatus.NO_CONTENT
      ) {
        throw new HttpException(result?.error, result?.status);
      }

      return { is_winning: false, index_reward: 0 };
    }

    const result = await this.supabaseService
      .getSupabase()
      .rpc('create_history_reward', {
        p_type: 'voucher',
        p_is_give: true,
        p_voucher_id: voucherResp?.data?.id,
        p_event_id: event.id,
        p_area: area,
        p_player_id: player_id,
        p_item_quantity: null,
        p_reward_id: null,
        p_number_of_times_spin: number_of_times_spin,
        p_ticket_id: null,
      });

    if (
      result?.status !== HttpStatus.OK &&
      result?.status !== HttpStatus.CREATED &&
      result?.status !== HttpStatus.NO_CONTENT
    ) {
      throw new HttpException(result?.error, result?.status);
    }

    return {
      is_winning: true,
      type: 'voucher',
      item: {
        ...voucherResp?.data,
        display_name: '1 Mã Phiếu quà tặng KFC trị giá 10,000đ',
      },
      index_reward: 2,
    };
  }

  private async processGetRewardItems(
    area: string,
    player_id: number,
    event: IEvent,
    number_of_times_spin: number,
    rewardID: number,
    currentDateOfVN: moment.Moment,
  ): Promise<
    | {
        is_winning: boolean;
        code?: string;
        type?: string;
        item?: object;
        index_reward: number;
      }
    | undefined
  > {
    // Gọi lại lịch sử trong ngày xem có ai trúng chưa
    const historyRewardResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select('*')
      .eq('type', 'item')
      .eq('event_id', event.id)
      .gte('gift_at', currentDateOfVN?.clone()?.startOf('day').toISOString())
      .lte('gift_at', currentDateOfVN?.clone()?.endOf('day').toISOString());

    if (historyRewardResp?.status !== HttpStatus.OK)
      throw new HttpException(
        historyRewardResp?.error,
        historyRewardResp?.status,
      );

    if (historyRewardResp?.data?.length >= 1) {
      return undefined;
    }

    const rewardResp = await this.supabaseService
      .getSupabase()
      .from('rewards')
      .select('id,name,image,quantity,code')
      .eq('event_id', event.id)
      .eq('id', rewardID)
      .gt('quantity', 0)
      .limit(1)
      .maybeSingle();

    if (rewardResp?.status !== HttpStatus.OK)
      throw new HttpException(rewardResp?.error, rewardResp?.status);

    if (!rewardResp?.data) {
      return undefined;
    }

    const reward = rewardResp?.data as unknown as IReward;

    const result = await this.supabaseService
      .getSupabase()
      .rpc('create_history_reward', {
        p_type: 'item',
        p_is_give: true,
        p_voucher_id: null,
        p_event_id: event.id,
        p_reward_id: reward.id,
        p_area: area,
        p_player_id: player_id,
        p_item_quantity: reward.quantity - 1,
        p_number_of_times_spin: number_of_times_spin,
        p_ticket_id: null,
      });

    if (
      result?.status !== HttpStatus.OK &&
      result?.status !== HttpStatus.CREATED &&
      result?.status !== HttpStatus.NO_CONTENT
    ) {
      throw new HttpException(result?.error, result?.status);
    }

    return {
      is_winning: true,
      type: 'item',
      item: {
        ...reward,
        display_name: reward?.name,
      },
      index_reward: +reward?.code,
    };
  }

  // Lấy id trúng quà hiện vật
  private async getRewardID(
    currentDateOfVN: moment.Moment,
    event: IEvent,
    rewardConfigs: IRewardConfig[],
    area: string,
    player_id: number,
  ): Promise<null | number> {
    let rewardID = null;
    let startDay = null;
    let endDay = null;

    const historyRewardPlayerResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select('id')
      .eq('type', 'item')
      .eq('event_id', event.id)
      .eq('player_id', player_id);

    if (historyRewardPlayerResp?.status !== HttpStatus.OK)
      throw new HttpException(
        historyRewardPlayerResp?.error,
        historyRewardPlayerResp?.status,
      );

    // Kiểm tra xem user đó trúng quà hiện vật rồi thì không trúng nữa
    if (historyRewardPlayerResp?.data?.length >= 1) return rewardID;

    let totalRewards = 0;

    rewardConfigs?.forEach((rewardConfig) => {
      if (
        totalRewards <= 0 &&
        new Date(currentDateOfVN.clone().toISOString()).getTime() <=
          new Date(rewardConfig.ended_at).getTime() &&
        new Date(currentDateOfVN.clone().toISOString()).getTime() >=
          new Date(rewardConfig.started_at).getTime() &&
        area === rewardConfig.area
      ) {
        totalRewards = rewardConfig.total;
        endDay = rewardConfig?.ended_at;
        startDay = rewardConfig?.started_at;
        rewardID = rewardConfig.reward_id;
      }
    });

    if (totalRewards <= 0 || !startDay || !endDay) {
      rewardID = null;
      return rewardID;
    }

    const historyRewardsDayRangeResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select('id,player_id,event_id,area,gift_at,type,reward_id')
      .eq('type', 'item')
      .eq('event_id', event.id)
      .gte('gift_at', startDay)
      .lte('gift_at', endDay);
    const historyRewards =
      historyRewardsDayRangeResp?.data?.length > 0
        ? (historyRewardsDayRangeResp?.data as unknown as IHistoryReward[])
        : [];

    if (totalRewards <= historyRewards?.length) {
      rewardID = null;
      return rewardID;
    }

    return rewardID;
  }

  private async processGetRewardTicketID(
    currentDateOfVN: moment.Moment,
    player_id: number,
    event: IEvent,
    locationConfigs: ILocationConfig[],
    area: string,
    ticketConfigs: ITicketConfig[],
  ): Promise<number | null> {
    let giftID = null;
    let startDay = null;
    let endDay = null;

    // Kiểm tra xe user đó trung ticket chưa nếu trúng r thì ko trúng nữa
    const ticketOfUserResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select('id,type,player_id')
      .eq('type', 'ticket')
      .eq('player_id', player_id);
    if (ticketOfUserResp?.status !== HttpStatus.OK)
      throw new HttpException(
        ticketOfUserResp?.error,
        ticketOfUserResp?.status,
      );

    if (ticketOfUserResp?.data?.length >= 1) return giftID;

    // lấy total ticket theo config chung hoặc theo chi tiết kịch bản
    let totalTickets = 0;
    let isConfigByArea = false;
    // Ưu tiên lấy theo kịch bản trước
    ticketConfigs?.forEach((ticketConfig) => {
      if (
        totalTickets <= 0 &&
        new Date(currentDateOfVN.clone().toISOString()).getTime() <=
          new Date(ticketConfig.ended_at).getTime() &&
        new Date(currentDateOfVN.clone().toISOString()).getTime() >=
          new Date(ticketConfig.started_at).getTime() &&
        ticketConfig?.area === area
      ) {
        totalTickets = ticketConfig.total;
        startDay = ticketConfig.started_at;
        endDay = ticketConfig.ended_at;
        isConfigByArea = true;
      }
    });

    // Kiểm tra nếu ko có config theo kịch bản thì lấy theo config chung
    if (totalTickets <= 0 && !isConfigByArea) {
      ticketConfigs?.forEach((ticketConfig) => {
        if (
          totalTickets <= 0 &&
          new Date(currentDateOfVN.clone().toISOString()).getTime() <=
            new Date(ticketConfig.ended_at).getTime() &&
          new Date(currentDateOfVN.clone().toISOString()).getTime() >=
            new Date(ticketConfig.started_at).getTime()
        ) {
          totalTickets = ticketConfig.total;
          startDay = ticketConfig.started_at;
          endDay = ticketConfig.ended_at;
        }
      });
    }

    if (totalTickets <= 0 || !startDay || !endDay) return giftID;

    // tính tổng voucher theo khu vực
    const locationConfig = locationConfigs?.find(
      (locationConfig) =>
        locationConfig?.code?.toLowerCase() === area?.toLowerCase(),
    );

    if (!isConfigByArea) {
      totalTickets = Math.round(
        totalTickets * ((locationConfig?.rate || 0) / 100),
      );
    }

    // tính total rewards đã trao trong khoảng thời gian ngày config
    const historyTicketsResp = await this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select('id,type,reward_id,player_id,gift_at,area')
      .eq('type', 'ticket')
      .eq('area', area)
      .eq('event_id', event.id)
      .gte('gift_at', startDay)
      .lte('gift_at', endDay);

    if (historyTicketsResp?.status !== HttpStatus.OK)
      throw new HttpException(
        historyTicketsResp?.error,
        historyTicketsResp?.status,
      );

    const historyRewards = historyTicketsResp?.data
      ? (historyTicketsResp?.data as unknown as IHistoryReward[])
      : [];

    if (historyRewards?.length >= totalTickets) {
      giftID = null;
      return giftID;
    }

    const ticketResp = await this.supabaseService
      .getSupabase()
      .from('tickets')
      .select('id,pin_no,serial_no,is_gift')
      .eq('event_id', event.id)
      .eq('is_gift', false)
      .limit(1)
      .maybeSingle();

    if (ticketResp?.status !== HttpStatus.OK) {
      throw new HttpException(ticketResp?.error, ticketResp?.status);
    }

    const ticket = ticketResp?.data
      ? (ticketResp?.data as unknown as ITicket)
      : undefined;

    if (!ticket) return giftID;

    giftID = ticket.id;

    return giftID;
  }

  private async processRewardTickets(
    rewardID: number,
    event: IEvent,
    area: string,
    number_of_times_spin: number,
    player_id: number,
  ): Promise<
    | {
        is_winning: boolean;
        code?: string;
        type?: string;
        item?: object;
        index_reward: number;
      }
    | undefined
  > {
    const ticketResp = await this.supabaseService
      .getSupabase()
      .from('tickets')
      .select('id,serial_no,pin_no,is_gift')
      .eq('is_gift', false)
      .eq('id', rewardID)
      .limit(1)
      .maybeSingle();

    if (ticketResp?.status !== HttpStatus.OK)
      throw new HttpException(ticketResp?.error, ticketResp?.status);

    const ticket = ticketResp?.data
      ? (ticketResp?.data as unknown as ITicket)
      : undefined;
    if (ticketResp) {
      const result = await this.supabaseService
        .getSupabase()
        .rpc('create_history_reward', {
          p_type: 'ticket',
          p_is_give: true,
          p_voucher_id: null,
          p_event_id: event.id,
          p_reward_id: null,
          p_area: area,
          p_player_id: player_id,
          p_item_quantity: 0,
          p_number_of_times_spin: number_of_times_spin,
          p_ticket_id: ticket.id,
        });

      if (
        result?.status !== HttpStatus.OK &&
        result?.status !== HttpStatus.CREATED &&
        result?.status !== HttpStatus.NO_CONTENT
      ) {
        throw new HttpException(result?.error, result?.status);
      }

      return {
        is_winning: true,
        type: 'ticket',
        item: {
          ...ticket,
          display_name: '1 Mã Vé xem phim CGV',
        },
        index_reward: 4,
      };
    }

    return undefined;
  }

  // Function to get the start and end of the week for a specific date in Vietnam
  private getWeekRange(currentDateOfVN: moment.Moment): {
    startOfWeek: string;
    endOfWeek: string;
  } {
    const startOfWeek = moment(currentDateOfVN)
      .tz('Asia/Ho_Chi_Minh')
      .locale('vi')
      .startOf('weeks')
      .utc()
      .toISOString();
    const endOfWeek = moment(currentDateOfVN)
      .tz('Asia/Ho_Chi_Minh')
      .locale('vi')
      .endOf('weeks')
      .utc()
      .toISOString();

    return {
      startOfWeek,
      endOfWeek,
    };
  }

  private calPercent(): boolean {
    const cc = moment().tz('Asia/Ho_Chi_Minh');

    // Define the start and end times
    const t1 = cc.clone().hour(17).minute(0).second(0);
    const t2 = cc.clone().hour(21).minute(0).second(0);

    return cc.isBetween(t1, t2);
  }
}
