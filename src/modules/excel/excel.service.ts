import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { SupabaseService } from '@client/supabase/supabase.service';

import * as ExcelJs from 'exceljs';

import * as moment from 'moment-timezone';
import { IHistoryRewardExcel } from '@client/supabase/supabase.interface';
import { PostgrestSingleResponse } from '@supabase/postgrest-js';

export interface IScanReport {
  player_name?: string
  phone?: string
  store_id?: number
  area?: string
  game_name?: string
  invoice?: string
  order_note?: any
  total?: number
}


@Injectable()
export class ExcelService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getReportHistoryReward(event_id: number, startDay?: string, endDay?: string, isHidePhone?: string): Promise<ExcelJs.Workbook> {
    const qb = this.supabaseService
      .getSupabase()
      .from('history_rewards')
      .select(
        `
            area,
            players(
                name,
                phone,
                date_of_birth
            ),
            created_at,
            type,
            rewards(
                name
            ),
            vouchers(
              code,
              barcode
            ),
            tickets(
              serial_no,
              pin_no
            )
            `,
      )
      .eq('event_id', event_id);

    if (startDay && endDay) {
      qb.gte('gift_at', startDay).lte('gift_at', endDay)
    }

    const resp = await qb;

    if (resp?.status !== HttpStatus.OK)
      throw new HttpException(resp?.error, resp?.status);

    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Define header row and style
    const headers = [
      { header: 'STT', key: 'stt', width: 10 },
      { header: 'Ngày nhận tin nhắn trúng giải', key: 'date', width: 20 },
      { header: 'Họ và tên', key: 'name', width: 30 },
      { header: 'SDT', key: 'phone', width: 15 },
      { header: 'Ngày sinh (optional)', key: 'dob', width: 20 },
      { header: 'Số lượng', key: 'quantity', width: 10 },
      { header: 'Loại quà tặng', key: 'gift', width: 25 },
      { header: 'Code / Serial No', key: 'code_serial_no', width: 30 },
      { header: 'Barcode / Pin No', key: 'barcode_pin_no', width: 30 },
      { header: 'Khu vực', key: 'region', width: 10 },
    ];

    worksheet.columns = headers;

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9900' }, // Orange color
      };
      cell.font = {
        bold: true,
      };
    });

    const data = resp?.data?.length ? (resp?.data as unknown as IHistoryRewardExcel[]) : [];
    data.forEach((history, index) => {
        worksheet.addRow({
            'stt': index + 1,
            'date': history?.created_at ? moment(history?.created_at).tz('Asia/Ho_Chi_Minh')?.toString() : '',
            'name': history?.players?.name,
            'phone': isHidePhone === 'true' ? this.maskPhoneNumber(history?.players?.phone || '') : history?.players?.phone,
            'dob': history?.players?.date_of_birth ? moment(history?.players?.date_of_birth).tz('Asia/Ho_Chi_Minh')?.toString() : '',
            'quantity': 1,
            'gift': this.getName(history?.type, history),
            'code_serial_no': this.getCodeOrSerialCode(history?.type, history),
            'barcode_pin_no': this.getBarcodeOrPinNo(history?.type, history),
            'region': history?.area
        })
    })

    return workbook;
  }

  async getReportScan(eventID: number, start?: string, end?: string, total?: number) {
    let resp: PostgrestSingleResponse<IScanReport[]>;

    if (start && end && total >= 1) {
      resp =  await this.supabaseService.getSupabase().rpc('report_user_scan', {
        p_started_at: start,
        p_ended_at: end,
        p_total_scan: total,
        p_event_id: eventID
      })
    } else if (start && end) {
      resp =  await this.supabaseService.getSupabase().rpc('report_user_scan', {
        p_started_at: start,
        p_ended_at: end,
        p_total_scan: null,
        p_event_id: eventID
      })
    } else if (total >= 1) {
      resp =  await this.supabaseService.getSupabase().rpc('report_user_scan', {
        p_started_at: null,
        p_ended_at: null,
        p_total_scan: total,
        p_event_id: eventID
      })
    } else {
      resp =  await this.supabaseService.getSupabase().rpc('report_user_scan', {
        p_started_at: null,
        p_ended_at: null,
        p_total_scan: null,
        p_event_id: eventID
      })
    }

    if (resp?.status !== HttpStatus.OK && resp?.status !== HttpStatus.NO_CONTENT && resp?.status !== HttpStatus.CREATED) 
      throw new HttpException(resp?.error, resp?.status);

    const data = resp?.data ? resp?.data : [];

    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Define header row and style
    const headers = [
      { header: 'Tên người chơi', key: 'player_name', width: 10 },
      { header: 'Số điện thoại', key: 'phone', width: 20 },
      { header: 'ID cửa hàng', key: 'store_id', width: 30 },
      { header: 'Khu vực cửa hàng', key: 'area', width: 15 },
      { header: 'Tên game', key: 'game_name', width: 20 },
      { header: 'Invoice của bill', key: 'invoice', width: 10 },
      { header: 'Order Note của bill', key: 'order_note', width: 25 },
      { header: 'Tổng lượt scan bill', key: 'total', width: 10 },
    ];

    worksheet.columns = headers;

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9900' }, // Orange color
      };
      cell.font = {
        bold: true,
      };
    });

    data.forEach((scan) => {
        worksheet.addRow({
            'player_name': scan?.player_name,
            'phone': scan?.phone,
            'store_id': scan?.store_id,
            'area': scan?.area,
            'game_name': scan?.game_name,
            'invoice': scan?.invoice,
            'order_note': scan?.order_note,
            'total': scan?.total
        })
    })

    return workbook;
  }

  private getName(type: string, history: IHistoryRewardExcel): string {
    if (type === 'item') return history?.rewards?.name;
    if (type === 'voucher') return  'Phiếu Quà Tặng Trị Giá 10K';
    if (type === 'ticket') return 'Vé Xem phim CGV';

    return ''
  }

  private maskPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/(\d{6})(\d{3})$/g, '$1***');
  }

  private getCodeOrSerialCode(type: string, history: IHistoryRewardExcel): string {
    if (type === 'voucher') return history?.vouchers?.code;
    if (type === 'ticket') return history?.tickets?.serial_no;
    
    return '';
  }

  private getBarcodeOrPinNo(type: string, history: IHistoryRewardExcel): string {
    if (type === 'voucher') return history?.vouchers?.barcode;
    if (type === 'ticket') return history?.tickets?.pin_no;
    
    return '';
  }
}
