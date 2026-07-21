import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Gmail SMTP connected');
    } catch (err) {
      this.logger.error('❌ Gmail SMTP connection failed:', err);
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    // Не логируем email (PII), чтобы не раскрывать персональные данные в логах.
    this.logger.log('📧 Sending password reset email');

    try {
      const info = await this.transporter.sendMail({
        from: `"Logma" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Восстановление пароля',
        html: this.getResetPasswordTemplate(resetUrl),
      });

      const messageId = this.getMessageId(info);
      this.logger.log(`✅ Email sent: ${messageId}`);
    } catch (err) {
      this.logger.error('❌ Failed to send email:', err);
      throw err;
    }
  }

  private getResetPasswordTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Восстановление пароля</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; padding: 48px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="font-size: 32px; font-weight: 700; color: #1a1a1a;">
                      L<span style="color: #f1d36b;">💡</span>gma
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center;">
                      Восстановление пароля
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 32px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #666; text-align: center;">
                      Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы создать новый пароль:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 32px; background: #f1d36b; color: #000; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(241, 211, 107, 0.3);">
                      Сбросить пароль
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #999; text-align: center;">
                      Ссылка действительна <strong style="color: #666;">15 минут</strong>. Если вы не запрашивали сброс, проигнорируйте это письмо.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 32px; border-top: 1px solid #eee;">
                    <p style="margin: 0; font-size: 12px; color: #ccc; text-align: center;">
                      © ${new Date().getFullYear()} Logma. Все права защищены.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getMessageId(info: unknown): string {
    if (typeof info !== 'object' || info === null) {
      return 'unknown';
    }

    if (!('messageId' in info)) {
      return 'unknown';
    }

    const messageId = (info as Record<string, unknown>).messageId;
    return typeof messageId === 'string' ? messageId : 'unknown';
  }
}
