export interface IBill {
  id: number;
  store_id: number;
  invoice: string;
  number_of_plays: number;
  player_id: number;
  game_id: number;
  order_note: string;
  event_id?: number;
}

export interface IGame {
  id: number;
  created_at: Date;
  update_at: Date;
  name: string;
  is_active: boolean;
  description: string;
  url: string;
  is_test: boolean;
  icon?: string;
  priority?: number;
  code: string;
}

export interface IComboConfig {
  code: string;
  number_of_plays: number;
}

export interface ILocationConfig {
  code: string;
  rate: number;
}

export interface IPeriodConfig {
  key: string;
  value: number;
  campaign_id: number;
}

export interface IEvent {
  id: number;
  start_date: Date;
  end_date: Date;
  is_start: boolean;
  game_id?: number[];
}

export interface IScore {
  id: number;
  score?: number;
  game_id?: number;
  player_id?: number;
  event_id?: number;
}

export interface IReward {
  id: number;
  name: string;
  is_active: boolean;
  quantity: number;
  image?: string;
  code?: string;
}

export interface IHistoryReward {
  id: string;
  type: string;
  voucher_id: number;
  reward_id: number;
  player_id: number;
  ticket_id: number;
  gift_at: Date;
  event_id: number;
  area: string;
  voucher?: {
    code?: string;
    barcode?: string;
    started_at?: string;
    ended_at?: string;
  }[];
  reward?: IReward[];
}

export interface IRewardConfig {
  reward_id: number;
  total: number;
  started_at: string;
  ended_at: string;
  area: string;
}

export interface ICommomConfig {
  group_1: number;
  group_2: number;
  total: number;
  percent_per_week: number;
  percent_first_three_days: number;
  max_scan_bill?: number;
  reward_items_per_week: IRewardConfig[];
  time_block: number;
}

export interface IGameConfig {
  event_id: number;
  metadata: {
    combos: IComboConfig[];
    commoms: ICommomConfig;
    locations: ILocationConfig[];
    vouchers: IVoucherConfig[];
    tickets: ITicketConfig[];
    rewards: IRewardConfig[];
  };
}

export interface ILog {
  game_id: number;
  id: number;
  player_id: number;
  event_id: number;
  total_share: number;
  total_scan: number;
}

export interface IVoucherConfig {
  started_at: string;
  ended_at: string;
  total: number;
}

export interface ITicketConfig {
  started_at: string;
  ended_at: string;
  total: number;
  area?: string;
}

export interface ITicket {
  id?: string;
  name?: string;
  serial_no: string;
  pin_no: string;
  is_gift: boolean;
}

export interface IHistoryRewardExcel {
  area: string;
  players?: {
    name?: string;
    phone?: string;
    date_of_birth?: string;
  };
  created_at?: string;
  type?: string;
  rewards?: {
    name?: string;
  };
  vouchers?: {
    code?: string;
    barcode?: string;
  };
  tickets?: {
    serial_no?: string;
    pin_no?: string;
  }
}

export interface IStore {
  id: number;
  area: string;
}