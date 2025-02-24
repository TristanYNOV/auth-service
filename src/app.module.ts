import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/User.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:root@localhost:27017', {
      dbName: 'auth_db',
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
