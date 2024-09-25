export interface IPlayer {
  id: number;
  zalo_id: string;
  name: string;
  phone: string;
  is_following_oa: boolean;
  alternative_phone: string;
  alternative_name: string;
  number_of_times_played: number;
  number_of_times_spin: number;
  email: string;
  date_of_birth: Date;
  is_block: boolean;
  number_of_block: number;
  expired_block: string;
  permanently_locked: boolean;
}

export interface IUpdatedPlayer {
  alternative_phone?: string;
  alternative_name?: string;
  email?: string;
  date_of_birth?: Date;
}
