import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/User.service';
import { encryptPassword } from '../utils/bcrypt';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const rawBootstrapFlag = this.configService.get<string>(
      'ADMIN_BOOTSTRAP_ENABLED',
      'true',
    );
    const bootstrapEnabled = !['false', '0', 'no'].includes(
      rawBootstrapFlag.toLowerCase(),
    );

    if (!bootstrapEnabled) {
      this.logger.log('Admin bootstrap is disabled by ADMIN_BOOTSTRAP_ENABLED');
      return;
    }

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminPseudo =
      this.configService.get<string>('ADMIN_PSEUDO')?.trim() || 'admin';

    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        'Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing',
      );
      return;
    }

    const hashedPassword = await encryptPassword(adminPassword);

    await this.userService.ensureAdminAccount(
      adminEmail.toLowerCase(),
      hashedPassword,
      adminPseudo,
    );

    this.logger.log(`Admin bootstrap ensured for ${adminEmail.toLowerCase()}`);
  }
}
