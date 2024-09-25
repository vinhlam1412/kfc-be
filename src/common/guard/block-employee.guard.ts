/* eslint-disable prettier/prettier */
import { SupabaseService } from '@client/supabase/supabase.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import { IRequest } from '@common/interface';

@Injectable()
export class BlockEmployeeGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as IRequest;

    const employeeResp = await this.supabaseService
      .getSupabase()
      .from('employees')
      .select()
      .eq('phone', request?.user?.phone)
      ?.maybeSingle();

    if (employeeResp?.status !== HttpStatus.OK) {
      throw new HttpException(employeeResp?.error, employeeResp?.status);
    }

    if (employeeResp?.data) {
      throw new ForbiddenException(
        `Cảm ơn bạn đã quan tâm chương trình “Hành Trình Ký Ức”. Nhân viên KFC không được tham gia chương trình này, vui lòng liên hệ KFC Việt Nam để biết thêm thông tin chi tiết hoặc hotline kĩ thuật nếu có sự nhầm lẫn.`,
      );
    }

    return true;
  }
}
