/* eslint-disable prettier/prettier */
import { SupabaseService } from '@client/supabase/supabase.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isNil } from 'lodash';
import { JwtAppService } from '../jwt/jwt.service';
import { ZaloService } from '../zalo/zalo.service';
import { ConfigService } from '@nestjs/config';
import { CheckMeDTO, LoginDto, UpdatePlayerDTO } from './dto/auth.dto';
import { IPlayer, IUpdatedPlayer } from './auth.interface';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { http } from 'winston';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtAppService,
    private readonly zaloService: ZaloService,
    private readonly configService: ConfigService,
  ) {}
  async login(payload: LoginDto) {
    const supabase = this.supabaseService.getSupabase();
    const secretKey = this.configService.get('ZALO_SECRET_KEY');
    const { data: user }: { data: IPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('zalo_id', payload.zaloId)
      .single();

    if (user) {
      await this.supabaseService.getSupabase().from('players').update({
        loggined_at: new Date(),
      });

      const accessToken = this.jwtService.createAccessToken({
        id: user.id,
        phone: user.phone,
        name: user.name,
        zaloID: user.zalo_id,
      });
      return {
        status: 200,
        data: {
          data: accessToken,
          message: 'Login success',
        },
      };
    }

    const phone = await this.zaloService.getZaloPhone({
      zaloAccessToken: payload.zalo_access_token,
      phoneToken: payload.phone_token,
      secretKey,
    });

    if (isNil(phone) || phone === '') {
      throw new HttpException(
        {
          status: 500,
          message: `Phone number is invalid, ${phone}`,
        },
        500,
      );
    }

    const resp = await supabase.from('players').insert({
      zalo_id: payload.zaloId,
      name: payload.name,
      avatar: payload.avatar,
      phone,
      created_by: 'system',
      is_following_oa: false,
    });

    if (resp?.status !== HttpStatus.CREATED) {
      throw new HttpException(resp?.error, resp?.status);
    }

    const { data: newUser }: { data: IPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('zalo_id', payload.zaloId)
      .single();

    const accessToken = this.jwtService.createAccessToken({
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      zaloID: newUser.zalo_id,
    });

    return {
      status: 200,
      data: {
        data: accessToken,
        message: 'Login success',
      },
    };
  }

  async updateLoggedIn(user: IPlayer) {
    const data = await this.supabaseService
      .getSupabase()
      .from('players')
      .update({
        loggined_at: new Date(),
      })
      .eq('id', user.id);

    return {
      data,
      message: 'updated logged in time',
    };
  }

  async getMe(query: CheckMeDTO): Promise<IPlayer | undefined> {
    const supabase = this.supabaseService.getSupabase();

    const data = await supabase
      .from('players')
      .select('*')
      .eq('phone', query.phone)
      .single();

    const user = data?.data ? (data?.data as IPlayer) : undefined;

    return user;
  }

  async updatePlayer(
    body: UpdatePlayerDTO,
    zaloID: string,
  ): Promise<PostgrestSingleResponse<null> | undefined> {
    const data: IUpdatedPlayer = {};

    const supabase = this.supabaseService.getSupabase();
    const player = await supabase
      .from('players')
      .select('*')
      .eq('zalo_id', zaloID)
      .single();

    const user = player?.data ? (player?.data as IPlayer) : undefined;

    if (!user) return undefined;

    data.alternative_name = user.alternative_name;
    data.alternative_phone = user.alternative_phone;
    data.email = user.email;

    if (body.alternative_name) {
      data.alternative_name = body.alternative_name;
    }

    if (body.alternative_phone) {
      data.alternative_phone = body.alternative_phone;
    }

    if (body.email) {
      data.email = body.email;
    }

    if (body.date_of_birth) {
      data.date_of_birth = body.date_of_birth;
    }

    const updated = await supabase
      .from('players')
      .update(data)
      .eq('zalo_id', zaloID);

    return updated;
  }
}
