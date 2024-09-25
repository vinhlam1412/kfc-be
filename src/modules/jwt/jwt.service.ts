import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAppService {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(user: { id: number; phone: string; name: string; zaloID: string }): string {
    const payload = { user };
    return this.jwtService.sign(payload);
  }

  // eslint-disable-next-line prettier/prettier
  verifyToken({
    token,
    JWT_TOKEN_KEY,
  }: {
    token: string;
    JWT_TOKEN_KEY: string;
  }) {
    return this.jwtService.verifyAsync(token, {
      secret: JWT_TOKEN_KEY,
    });
  }
}
