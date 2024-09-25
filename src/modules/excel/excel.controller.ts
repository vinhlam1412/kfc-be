import { Controller, Get, Query, Res } from '@nestjs/common';

import { ExcelService } from '@excel/excel.service';

import * as moment from 'moment-timezone';
import { Response } from 'express';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('/report/histories_reward')
  async getReportHistory(
    @Query('date') date: string,
    @Res() res: Response,
    @Query('event_id') eventID: number,
    @Query('is_hide_phone') isHidePhone: string,
  ) {
    if (!eventID) return res.json({ message: 'Not found' });

    let startOfDayUTC = null;
    let endOfDayUTC = null;

    if (date) {
      startOfDayUTC = moment(date)
        .tz('Asia/Ho_Chi_Minh')
        .startOf('day')
        .toISOString();
      endOfDayUTC = moment(date)
        .tz('Asia/Ho_Chi_Minh')
        .endOf('day')
        .toISOString();
    }

    // Set the response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
    const result = await this.excelService.getReportHistoryReward(
      eventID,
      startOfDayUTC,
      endOfDayUTC,
      isHidePhone
    );

    await result.xlsx.write(res);

    res.end();
  }

  @Get('/report/scan')
  async getReportScan(
    @Query('date') date: string,
    @Res() res: Response,
    @Query('total_scan') totalScan: number,
    @Query('event_id') eventID: number,
  ) {
    if (!eventID) return res.json({ message: 'Not found' });
    let startOfDayUTC = null;
    let endOfDayUTC = null;
    let total = null;

    if (date) {
      startOfDayUTC = moment(date)
        .tz('Asia/Ho_Chi_Minh')
        .startOf('day')
        .toISOString();
      endOfDayUTC = moment(date)
        .tz('Asia/Ho_Chi_Minh')
        .endOf('day')
        .toISOString();
    }

    if (totalScan >= 1) {
      total = totalScan;
    }

    // Set the response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    const result = await this.excelService.getReportScan(
      eventID,
      startOfDayUTC,
      endOfDayUTC,
      total,
    );

    await result.xlsx.write(res);

    res.end();
  }
}
