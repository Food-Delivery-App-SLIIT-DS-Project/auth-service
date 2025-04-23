import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_PACKAGE_NAME } from './common/types/auth';
import { ConfigModule } from '@nestjs/config';

async function bootstrap() {
  void ConfigModule.forRoot({ isGlobal: true });
  const url = process.env.AUTH_SERVICE_URL || 'localhost:50051';

  const protoPath =
    process.env.GRPC_PROTO_PATH || join(__dirname, '../auth.proto');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        protoPath,
        package: AUTH_PACKAGE_NAME,
        url: url,
      },
    },
  );

  app.enableShutdownHooks();
  await app.listen();

  console.log(`Auth service is running on ${url}`);
}
void bootstrap();
