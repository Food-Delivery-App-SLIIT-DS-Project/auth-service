import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { AuthService } from './auth.service';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME } from '../common';
import { AuthGrpcController } from './auth.controller';
import { JwtService } from './services/jwt.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: USER_PACKAGE_NAME,
          protoPath: join(__dirname, '..', '..', 'user.proto'),
          url: 'user-service:50052', // <-- this is where user-service is running
        },
      },
    ]),
  ],
  controllers: [AuthGrpcController],
  providers: [AuthService, JwtService],
})
export class AuthModule {}
