import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_PACKAGE_NAME } from './common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        protoPath: join(__dirname, '..', '..', 'proto', 'auth.proto'),
        package: AUTH_PACKAGE_NAME,
        url: 'localhost:50051',
      },
    },
  );
  app.enableShutdownHooks();
  await app.listen();
  console.log(
    `Auth service is running on: http://localhost:50051/${AUTH_PACKAGE_NAME}`,
  );
}
void bootstrap();
