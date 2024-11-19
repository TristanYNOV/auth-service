import { Module } from '@nestjs/common';
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/User.module";

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:root@localhost:27017', {
      dbName: 'auth_db',
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
