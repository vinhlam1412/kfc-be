import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guard/authenticated.guard';
import { IRequest } from 'src/common/interface';
import { AuthService } from './auth.service';
import { LoginDto, UpdatePlayerDTO } from './dto/auth.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(201)
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Patch('logged-in')
  @UseGuards(AuthGuard)
  updateLoggedIn(@Req() req: IRequest) {
    return this.authService.updateLoggedIn(req.user);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: IRequest) {
    return req?.user || undefined;
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  update(@Body() body: UpdatePlayerDTO, @Req() req: IRequest) {
    const user = req.user;
    return this.authService.updatePlayer(body, user.zalo_id);
  }
}
