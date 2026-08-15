export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProductionConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('DATABASE_URL environment variable is missing.');
  } else if (process.env.NODE_ENV === 'production' && dbUrl.includes('localhost')) {
    warnings.push('DATABASE_URL points to localhost in production mode.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET environment variable is missing.');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security.');
  }

  const storageProvider = process.env.STORAGE_PROVIDER || 'LOCAL';
  if (storageProvider === 'S3' && (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID)) {
    warnings.push('S3 storage provider selected but credentials or bucket name are missing.');
  }

  const emailProvider = process.env.EMAIL_PROVIDER || 'CONSOLE';
  if (emailProvider === 'SMTP' && (!process.env.SMTP_HOST || !process.env.SMTP_USER)) {
    warnings.push('SMTP email provider selected but host or credentials are missing.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
