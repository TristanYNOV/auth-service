const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DATABASE_URL',
  'DB_NAME',
  'JWT_EXPIRES_IN',
] as const;

const WEAK_JWT_SECRETS = new Set([
  '',
  '__CHANGE_ME__',
  'change-me',
  'changeme',
  'secret',
  'password',
  '123456',
  '123456789',
  'qwerty',
]);

function readEnvValue(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function assertRequiredValue(
  config: Record<string, unknown>,
  key: string,
): void {
  const value = readEnvValue(config, key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

function isStrictMode(config: Record<string, unknown>): boolean {
  const nodeEnv = readEnvValue(config, 'NODE_ENV');
  const strictOverride = readEnvValue(config, 'STRICT_ENV').toLowerCase();

  return nodeEnv === 'production' || strictOverride === 'true';
}

function assertStrictValues(config: Record<string, unknown>): void {
  const jwtSecret = readEnvValue(config, 'JWT_SECRET');
  const normalizedSecret = jwtSecret.toLowerCase();

  if (jwtSecret.length < 16 || WEAK_JWT_SECRETS.has(normalizedSecret)) {
    throw new Error(
      'Invalid JWT_SECRET in strict mode: use a non-placeholder secret with at least 16 characters.',
    );
  }

  const dbName = readEnvValue(config, 'DB_NAME');
  if (dbName === '__CHANGE_ME__') {
    throw new Error(
      'Invalid DB_NAME in strict mode: placeholder value is not allowed.',
    );
  }

  const databaseUrl = readEnvValue(config, 'DATABASE_URL');
  if (databaseUrl === '__CHANGE_ME__') {
    throw new Error(
      'Invalid DATABASE_URL in strict mode: placeholder value is not allowed.',
    );
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of REQUIRED_ENV_VARS) {
    assertRequiredValue(config, key);
  }

  if (isStrictMode(config)) {
    assertStrictValues(config);
  }

  return config;
}
