import { Body, Controller, HttpException, Post, Req, UseGuards } from '@nestjs/common';

import { ScanBillDTO } from '@bill/bill.dto';
import { BillService } from '@bill/bill.service';

import { AuthGuard } from '@common/guard/authenticated.guard';
import { IRequest } from '@common/interface';
import { BlockEmployeeGuard } from '@common/guard/block-employee.guard';

import { LoggerService } from '@logger/logger.service';

@Controller('bills')
@UseGuards(AuthGuard)
export class BillController {
  constructor(private readonly billService: BillService, private readonly loggerService: LoggerService) {}

  @Post('scan')
  @UseGuards(BlockEmployeeGuard)
  async scan(@Body() body: ScanBillDTO, @Req() req: IRequest) {
    if (body?.invoice === '218-001-0158625') {
      throw new HttpException('Hóa đơn này đã bị khóa', 400);
    }
    try {
      this.loggerService.log(`Body: ${JSON.stringify(body)} Player_Id: ${req.user?.id}`);
      const result = await this.billService.scan(body, req.user.id, req.event.id, req.user);
      return result;
    } catch (error) {
      this.loggerService.error(error?.message, error?.stack);
      if (error instanceof HttpException) {
        throw new HttpException(error?.message, error?.getStatus());
      }
      return error;
    }
  }
}
