import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/User.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { AdminModule } from './admin/admin.module';
import { AdminBootstrapService } from './admin/admin-bootstrap.service';
import * as process from 'node:process';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.DATABASE_URL || 'mongodb://localhost:3000',
      {
        dbName: process.env.DB_NAME || 'auth_db',
      },
    ),
    UserModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [AdminBootstrapService],
})
export class AppModule {}
