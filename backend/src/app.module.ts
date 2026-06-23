import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/iam/users/users.module';
import { RolesModule } from './modules/iam/roles/roles.module';
import { PermissionsModule } from './modules/iam/permissions/permissions.module';
import { ChickenYieldsModule } from './modules/master-data/chicken-yields/chicken-yields.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ChickenYieldsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
