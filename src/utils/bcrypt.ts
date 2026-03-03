import * as bcrypt from 'bcrypt';
import * as process from 'node:process';

const salt = +process.env.SALT || 10;
// Adapt salt if necessary
export async function encryptPassword(rawPassword: string) {
  return await bcrypt.hash(rawPassword, salt);
}
