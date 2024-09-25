import { IRequest } from '@common/interface';
import { LoggerService } from '@logger/logger.service';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AxiosError } from 'axios';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost, private readonly loggerService: LoggerService) {}

  catch(exception: any, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<IRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '';
    let stack = '';

    if (exception instanceof HttpException) {
        status = exception?.getStatus();
        message = exception?.message;
        stack = exception?.stack
    }

    if (exception instanceof AxiosError) {
        status = exception?.status;
        message = exception?.message;
        stack = exception?.stack;
    }

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message
    };
    
    this.loggerService.error(`${message} IP_ADDRESS: ${request?.ip} User: ${request?.user?.id} Token: ${request?.headers?.authorization}`, stack);

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
