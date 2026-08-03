export function getOtpEmailTemplate(
  code: string,
  title: string,
  description: string,
  expirationMinutes: number = 5,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; text-align: center; padding: 30px 20px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 36px 30px; text-align: center; color: #334155; }
    .content p { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; margin: 24px 0; display: inline-block; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; }
    .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CASELINK</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${description}</p>
      <div class="otp-box">
        <div class="otp-code">${code}</div>
      </div>
      <p style="font-size: 13px; color: #64748b;">This code will expire in <strong>${expirationMinutes} minutes</strong>. If you did not request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Caselink Travel SaaS Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
}
