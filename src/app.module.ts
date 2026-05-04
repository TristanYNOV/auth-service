import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/User.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import * as process from 'node:process';
import { MetricsController } from './observability/metrics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL as string, {
      dbName: process.env.DB_NAME as string,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [],
})
export class AppModule {}
