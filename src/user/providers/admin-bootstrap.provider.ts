import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserService } from '../User.service';
import { encryptPassword } from '../../utils/bcrypt';

@Injectable()
export class AdminBootstrapProvider implements OnModuleInit {
  constructor(private readonly userService: UserService) {}

  async onModuleInit(): Promise<void> {
    const adminCount = await this.userService.countAdminUsers();

    if (adminCount === 1) {
      return;
    }

    if (adminCount > 1) {
      throw new Error(
        'Invalid state: multiple admin users found. Expected exactly one.',
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPseudo = process.env.ADMIN_PSEUDO || 'admin';

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'Admin bootstrap failed: ADMIN_EMAIL and ADMIN_PASSWORD must be set when no admin user exists.',
      );
    }

    const hashedPassword = await encryptPassword(adminPassword);
    await this.userService.createAdminUser({
      email: adminEmail,
      password: hashedPassword,
      pseudo: adminPseudo,
    });
  }
}
