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
        from: `"nidio" <${process.env.GMAIL_USER}>`,
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
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Восстановление пароля</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#F8F7F4;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="padding:48px 16px;"
>
<tr>
<td align="center">

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    max-width:560px;
    background:#FFFFFF;
    border:1px solid #EFECE7;
    border-radius:28px;
    padding:56px 48px;
  "
>

<tr>
<td align="center">

<div
  style="
    font-size:30px;
    font-weight:700;
    color:#181818;
    letter-spacing:-0.04em;
    margin-bottom:40px;
  "
>
Nidio
</div>

</td>
</tr>

<tr>
<td>

<h1
  style="
    margin:0 0 20px;
    font-size:30px;
    font-weight:700;
    line-height:1.2;
    color:#181818;
    text-align:center;
  "
>
Восстановление пароля
</h1>

<p
  style="
    margin:0 auto 36px;
    max-width:420px;
    font-size:16px;
    line-height:1.7;
    color:#666666;
    text-align:center;
  "
>
Мы получили запрос на изменение пароля для вашей учетной записи.
Если это были вы, нажмите кнопку ниже, чтобы создать новый пароль.
</p>

</td>
</tr>

<tr>
<td align="center">

<a
  href="${resetUrl}"
  style="
    display:inline-block;
    padding:16px 32px;
    background:#C97A63;
    color:#FFFFFF;
    text-decoration:none;
    font-size:16px;
    font-weight:600;
    border-radius:18px;
  "
>
Создать новый пароль
</a>

</td>
</tr>

<tr>
<td>

<p
  style="
    margin:40px auto 0;
    max-width:420px;
    font-size:14px;
    line-height:1.7;
    color:#8A8A8A;
    text-align:center;
  "
>
Ссылка действительна в течение
<strong>15 минут</strong>.
Если вы не отправляли этот запрос, просто проигнорируйте это письмо —
ваш пароль останется без изменений.
</p>

</td>
</tr>

<tr>
<td>

<p
  style="
    margin:32px 0 0;
    font-size:13px;
    line-height:1.6;
    color:#999999;
    text-align:center;
    word-break:break-all;
  "
>
Если кнопка не работает, откройте ссылку вручную:
</p>

<p
  style="
    margin:8px 0 0;
    font-size:13px;
    text-align:center;
    word-break:break-all;
  "
>
<a
  href="${resetUrl}"
  style="
    color:#C97A63;
    text-decoration:none;
  "
>
${resetUrl}
</a>
</p>

</td>
</tr>

<tr>
<td>

<div
  style="
    margin-top:48px;
    padding-top:24px;
    border-top:1px solid #EFECE7;
    text-align:center;
    font-size:13px;
    color:#B3B3B3;
  "
>
© ${year} Nidio. Shared space for two.
</div>

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
