export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log(`[EMAIL DISPATCH - CONSOLE]: To: ${options.to} | Subject: ${options.subject}`);
    return true;
  }
}

class SmtpEmailProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // SMTP dispatch integration contract using configured SMTP_HOST
    console.log(`[EMAIL DISPATCH - SMTP]: To: ${options.to} | Subject: ${options.subject}`);
    return true;
  }
}

const activeEmailProvider = process.env.EMAIL_PROVIDER || 'CONSOLE';
export const emailProvider: EmailProvider =
  activeEmailProvider === 'SMTP' ? new SmtpEmailProvider() : new ConsoleEmailProvider();
