import { SupabaseService } from '@client/supabase/supabase.service';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';
import { ZALO_URL } from 'src/common/constants/zalo';
import { validPhoneNumber } from 'src/utils';
import { CallBackUrlDto, SendMessageDto } from './dto/zalo.dto';

@Injectable()
export class ZaloService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getZaloPhone({
    zaloAccessToken,
    phoneToken,
    secretKey,
  }: {
    zaloAccessToken: string;
    phoneToken: string;
    secretKey: string;
  }) {
    const endpoint = ZALO_URL.GET_INFO;
    const options = {
      headers: {
        access_token: zaloAccessToken,
        code: phoneToken,
        secret_key: secretKey,
      },
    };
    const response = await this.httpService.axiosRef.get(endpoint, options);
    const phone = validPhoneNumber(response.data?.data?.number);
    return phone;
  }

  async callBackUrl({ code, oa_id }: CallBackUrlDto) {
    const supabase = this.supabaseService.getSupabase();
    const secretKey = this.configService.get('ZALO_SECRET_KEY');
    const appID = this.configService.get('APP_ID');

    const config = {
      headers: {
        secret_key: secretKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    const requestData = {
      code,
      app_id: appID,
      grant_type: 'authorization_code',
    };

    const response = await this.httpService.axiosRef.post(
      ZALO_URL.GET_ACCESSTOKEN,
      requestData,
      config,
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const { error } = await supabase
      .from('configs')
      .insert({
        oa_id,
        app_id: appID,
        access_token: access_token,
        refresh_token: refresh_token,
        expire_in: expires_in,
        secret_key: secretKey,
      })
      .select('*')
      .single();

    if (error) {
      throw new HttpException(
        {
          status: 500,
          message: 'Update access token failed',
        },
        500,
      );
    }
    return {
      status: 200,
      data: {
        message: 'Update access token success',
      },
    };
  }
  async getAccessToken({ appId }: { appId: string }) {
    const supabase = this.supabaseService.getSupabase();
    const { data: appConfig, error: errorAppConfig } = await supabase
      .from('configs')
      .select('*')
      .eq('app_id', appId)
      .single();

    if (errorAppConfig) {
      throw new HttpException(
        {
          status: 500,
          message: 'Get app config failed',
        },
        500,
      );
    }

    const expiredTime = Number(appConfig.expire_in);

    const isExpired = moment(appConfig.updated_at)
      .add(expiredTime, 'seconds')
      .isSameOrBefore(moment());

    if (isExpired) {
      const config = {
        headers: {
          secret_key: appConfig.secret_key,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      const requestData = {
        refresh_token: appConfig.refresh_token,
        app_id: appConfig.app_id,
        grant_type: 'refresh_token',
      };

      const response = await this.httpService.axiosRef.post(
        ZALO_URL.GET_ACCESSTOKEN,
        requestData,
        config,
      );

      const { access_token, refresh_token, expires_in } = response.data;

      await supabase
        .from('configs')
        .update({
          access_token,
          refresh_token,
          expire_in: expires_in,
          updated_at: new Date(),
        })
        .eq('app_id', appId)
        .select('*')
        .single();
      return access_token;
    } else {
      return appConfig.access_token;
    }
  }

  async sendMessage({
    payload,
    zaloId,
    fullName,
  }: {
    payload: SendMessageDto;
    zaloId: string;
    fullName: string;
  }) {
    const supabase = this.supabaseService.getSupabase();
    const appId = this.configService.get('APP_ID');
    const access_token = await this.getAccessToken({
      appId,
    });

    const config = {
      headers: {
        access_token,
        'Content-Type': 'application/json',
      },
    };
    let payloadMessage = {};
    switch (payload.type) {
      case 'cgv':
        payloadMessage = {
          template_type: 'transaction_event',
          language: 'VI',
          elements: [
            {
              attachment_id:
                'tAMkHr9EvrhNhAbAMq7wJDsvlrnOLVTKphogIavNurdMhwXVM5U_3vZzin432Ae7ch2dG4yPh4cMiBH0KWAa48dseLLPGl07WxUw6W9UyWU0iReI05xr0eMrkHu8GFSBYVlf60v3hbcDhUTA2nQh2udv-aLDHASSjDf_91DTu44',
              type: 'banner',
            },
            {
              type: 'header',
              content: `Chúc mừng Bạn đã nhận được “${payload.giftName}” từ “Hành Trình Ký Ức” của KFC.`,
              align: 'left',
            },
            {
              type: 'text',
              align: 'left',
              content: `Khách hàng mang mã vé xem phim này đến các rạp phim CGV để sử dụng nhé! <br>LIÊN HỆ HỖ TRỢ KỸ THUẬT 0906903655`,
            },
            {
              type: 'table',
              content: [
                {
                  key: 'Tên khách hàng',
                  value: `${fullName}`,
                },
                {
                  value: `${payload.serialNo}`,
                  key: 'Số seri',
                },
                {
                  value: `${payload.pinNo}`,
                  key: 'Mã pin',
                },
                {
                  key: 'Thời hạn sử dụng',
                  value: 'hết ngày 31/01/2025',
                },
              ],
            },
          ],
        };
        break;
      case 'kfc':
        payloadMessage = {
          template_type: 'transaction_event',
          language: 'VI',
          elements: [
            {
              attachment_id:
                'tAMkHr9EvrhNhAbAMq7wJDsvlrnOLVTKphogIavNurdMhwXVM5U_3vZzin432Ae7ch2dG4yPh4cMiBH0KWAa48dseLLPGl07WxUw6W9UyWU0iReI05xr0eMrkHu8GFSBYVlf60v3hbcDhUTA2nQh2udv-aLDHASSjDf_91DTu44',
              type: 'banner',
            },
            {
              type: 'header',
              content: `Chúc mừng Bạn đã nhận được “${payload.giftName}” từ “Hành Trình Ký Ức” của KFC.`,
              align: 'left',
            },
            {
              type: 'text',
              align: 'left',
              content: `Khách hàng mang mã quà tặng này đến các nhà hàng KFC để sử dụng nhé! <br>LIÊN HỆ HỖ TRỢ KỸ THUẬT 0906903655`,
            },
            {
              type: 'table',
              content: [
                {
                  key: 'Tên khách hàng',
                  value: `${fullName}`,
                },
                {
                  value: `${payload.voucherCode}`,
                  key: 'Mã quà tặng:',
                },
                {
                  key: 'Thời hạn sử dụng',
                  value: 'hết ngày 31/08/2024',
                },
              ],
            },
          ],
        };
        break;
      default:
        payloadMessage = {
          template_type: 'transaction_event',
          language: 'VI',
          elements: [
            {
              attachment_id:
                'tAMkHr9EvrhNhAbAMq7wJDsvlrnOLVTKphogIavNurdMhwXVM5U_3vZzin432Ae7ch2dG4yPh4cMiBH0KWAa48dseLLPGl07WxUw6W9UyWU0iReI05xr0eMrkHu8GFSBYVlf60v3hbcDhUTA2nQh2udv-aLDHASSjDf_91DTu44',
              type: 'banner',
            },
            {
              type: 'header',
              content: `Chúc mừng Bạn đã nhận được “${payload.giftName}” từ “Hành Trình Ký Ức” của KFC.`,
              align: 'left',
            },
            {
              type: 'text',
              align: 'left',
              content: `Bước 1: Khách hàng bấm nút xác nhận và điền thông tin người nhận thưởng.<br>Bước 2: KFC sẽ liên hệ trong vòng 1 ngày làm việc để xác nhận thông tin & thủ tục nhận thưởng.<br>Gọi Tổng đài KFC 19006886, trường hợp chưa nhận được liên hệ từ KFC.`,
            },
            {
              type: 'table',
              content: [
                {
                  key: 'Tên khách hàng',
                  value: `${fullName}`,
                },
                {
                  key: 'Hạn chót nhận quà',
                  value: 'đến hết ngày 31/08/2024',
                },
              ],
            },
          ],
          buttons: [
            {
              title: 'XÁC NHẬN THÔNG TIN NHẬN THƯỞNG',
              image_icon: '',
              type: 'oa.open.url',
              payload: {
                url: 'https://docs.google.com/forms/d/e/1FAIpQLSeYJZDJt5pqKVKoPT5A-gxpRt0EuT7HfJR5RBJK8n5lByUj9A/viewform',
              },
            },
            {
              title: 'LIÊN HỆ HỖ TRỢ KỸ THUẬT',
              image_icon: '',
              type: 'oa.open.phone',
              payload: {
                phone_code: '0906903655',
              },
            },
          ],
        };
    }

    const requestData = {
      recipient: {
        user_id: zaloId,
      },
      message: {
        attachment: {
          type: 'template',
          payload: payloadMessage,
        },
      },
    };

    const { data } = await this.httpService.axiosRef.post(
      ZALO_URL.SEND_OA_MSG,
      requestData,
      config,
    );
    if (!data?.data?.message_id && !data?.data?.user_id && data?.error !== 0) {
      await supabase
        .from('message_log')
        .insert({
          zalo_id: zaloId,
          status: 'fail',
          reason: JSON.stringify(data),
        })
        .single();

      return {
        data,
        message: 'Send message fail',
      };
    }

    await supabase.from('message_log').insert({
      zalo_id: zaloId,
      status: 'success',
    });

    return {
      data,
      message: 'Send message success',
    };
  }
}
