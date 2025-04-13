/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthResponse, SignUpRequest } from 'src/common/types/auth';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'SignUp')
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    console.log('auth grpc controller signUp');
    return this.authService.signUp(data);
  }

  // signin controller ---------------
  @GrpcMethod('AuthService', 'SignIn')
  async signIn(data: SignUpRequest): Promise<AuthResponse> {
    console.log('auth grpc controller signIn');
    const { email, password } = data;
    return this.authService.signIn(email, password);
  }
}
