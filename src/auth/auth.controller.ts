/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  AuthResponse,
  LogoutRequest,
  LogoutResponse,
  SignUpRequest,
} from 'src/common/types/auth';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'SignUp')
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    // console.log('auth grpc controller signUp');
    return this.authService.signUp(data);
  }

  // signin controller ---------------
  @GrpcMethod('AuthService', 'SignIn')
  async signIn(data: SignUpRequest): Promise<AuthResponse> {
    // console.log('auth grpc controller signIn');
    const { email, password } = data;
    return this.authService.signIn(email, password);
  }

  // logout controller ---------------
  @GrpcMethod('AuthService', 'Logout')
  // eslint-disable-next-line @typescript-eslint/require-await
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    // console.log('auth grpc controller logout');
    const { refreshToken, userId } = data;
    // console.log('dataooooooooooooooo', userId);
    return this.authService.logout(refreshToken, userId);
  }
}
