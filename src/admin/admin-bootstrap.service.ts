import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/User.service';
import { encryptPassword } from '../utils/bcrypt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const bootstrapEnabled =
      this.configService.get<string>('ADMIN_BOOTSTRAP_ENABLED') !== 'false';

    if (!bootstrapEnabled) {
      return;
    }

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminPseudo =
      this.configService.get<string>('ADMIN_PSEUDO') ?? 'admin';

    if (!adminEmail || !adminPassword) {
      return;
    }

    const existingAdmin =
      await this.userService.getUserByEmailWithPassword(adminEmail);

    if (!existingAdmin) {
      const hashedPassword = await encryptPassword(adminPassword);
      await this.userService.createUser({
        email: adminEmail,
        pseudo: adminPseudo,
        password: hashedPassword,
        roles: ['admin'],
      });
    } else {
      await this.userService.ensureAdminRoleByEmail(adminEmail);

      const isSamePassword = await bcrypt.compare(
        adminPassword,
        existingAdmin.password,
      );
      if (!isSamePassword) {
        const hashedPassword = await encryptPassword(adminPassword);
        await this.userService.updatePasswordAndPseudoByEmail(
          adminEmail,
          hashedPassword,
          adminPseudo,
        );
      }
    }

    this.logger.log(`Admin bootstrap ensured for ${adminEmail}`);
  }
}
