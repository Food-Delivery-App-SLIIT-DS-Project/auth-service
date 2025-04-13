import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly accessTokenSecret =
    process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  signAccessToken(payload: Record<string, any>): string {
    console.log('JwtService accessTokenSecret', this.accessTokenSecret);
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  signRefreshToken(payload: Record<string, any>): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  verifyAccessToken(token: string): any {
    return jwt.verify(token, this.accessTokenSecret);
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.refreshTokenSecret);
  }
}
