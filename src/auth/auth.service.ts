/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import {
  CreateUserDto,
  USER_SERVICE_NAME,
  UserResponse,
  UserServiceClient,
} from '../common/types'; // path based on your proto-gen output
import {
  AuthResponse,
  LogoutResponse,
  SignUpRequest,
} from 'src/common/types/auth';
import { JwtService } from './services/jwt.service';
import { status } from '@grpc/grpc-js';

@Injectable()
export class AuthService implements OnModuleInit {
  private userServiceClient: UserServiceClient;

  constructor(
    @Inject(USER_SERVICE_NAME) private readonly client: ClientGrpc,
    private readonly jwtService: JwtService, // inject jwtService
  ) {}
  onModuleInit() {
    this.userServiceClient =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const { fullName, email, phoneNumber, password, role } = data;
    const passwordHash = await bcrypt.hash(password, 10); // Hash the password

    const userId = uuidv4();

    /// genarate refresh toke 0----------------------------------
    // console.log('userId-------------', userId);
    const accessToken = this.jwtService.signAccessToken({
      userId,
      role,
    });
    const refreshToken = this.jwtService.signRefreshToken({
      userId,
    });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    //------------------ user payload--------------------
    const userPayload: CreateUserDto = {
      userId,
      fullName,
      email,
      phoneNumber,
      passwordHash: passwordHash, // Hash the password
      role,
      isVerified: false,
      refreshToken: hashedRefreshToken,
      fcmToken: data.fcmToken ?? null,
    };

    // 3. Call user-service to create user
    const newuser: UserResponse = await lastValueFrom(
      this.userServiceClient.createUser(userPayload),
    );

    const authResponse: AuthResponse = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: {
        userId: newuser.userId,
        fullName: newuser.fullName,
        email: newuser.email,
        phoneNumber: newuser.phoneNumber,
        role: newuser.role,
        isVerified: newuser.isVerified,
        createdAt: newuser.createdAt,
        updatedAt: newuser.updatedAt,
      },
    };

    return authResponse;
  }

  //------------------------- signin-------------------------
  async signIn(email: string, password: string): Promise<AuthResponse> {
    let user: UserResponse;
    // console.log('email', email);
    // console.log('password', password);
    try {
      // 1. Call user-service to find user by email
      user = await lastValueFrom(
        this.userServiceClient.findUserByEmail({ email }),
      );
    } catch (error: any) {
      if (error.code === status.NOT_FOUND) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }
      // 2b. Other gRPC error
      throw error;
    }
    // console.log('user-------', user);
    // 3. Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    // console.log('isPasswordValid', isPasswordValid);
    if (!isPasswordValid) {
      // console.log('Invalid credentials');
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid credentials',
      });
    }
    // console.log('user found');
    // 4. Generate JWT tokens
    const accessToken = this.jwtService.signAccessToken({
      userId: user.userId,
      role: user.role,
    });

    const refreshToken = this.jwtService.signRefreshToken({
      userId: user.userId,
    });

    // update refresh token in the database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const updateUserResponse = await lastValueFrom(
      this.userServiceClient.updateRefreshToken({
        refreshToken: hashedRefreshToken,
        userId: user.userId,
      }),
    );
    if (!updateUserResponse) {
      throw new RpcException({
        code: status.INTERNAL,
        message: 'token update failed',
      });
    }
    //  Return tokens and user info (excluding passwordHash)
    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  //------------------------- logout-------------------------
  async logout(refreshToken: string, userId: string): Promise<LogoutResponse> {
    // console.log('auth service logout function');
    try {
      // Verify the refresh token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);
      if (!payload) {
        // console.log('Invalid refresh token');
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid refresh token',
        });
      }
      // const user = await this.userService.findById(userId);

      // delete the refresh token from the database

      const deleteUserResponse = await lastValueFrom(
        this.userServiceClient.deleteRefreshToken({
          userId,
          refreshToken,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      // console.log(deleteUserResponse);

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (!deleteUserResponse || !deleteUserResponse.success) {
        // console.log('Token deletion failed');

        throw new RpcException({
          code: status.INTERNAL,
          message: 'token deletion failed',
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Logout failed',
      });
    }
  }
}
