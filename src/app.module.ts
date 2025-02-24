import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/User.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from './auth/auth.module';
import process from "node:process";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL, {
      dbName: process.env.DB_NAME || 'auth_db',
    }),
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
