export function getTeamInviteEmailTemplate(
  agencyName: string,
  role: string,
  inviteLink: string,
  inviterName: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Team Invitation — ${agencyName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; text-align: center; padding: 30px 20px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 36px 30px; text-align: center; color: #334155; }
    .content p { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .btn-container { margin: 30px 0; }
    .btn { background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 2px 6px rgba(37,99,235,0.3); }
    .btn:hover { background-color: #1d4ed8; }
    .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CASELINK</h1>
    </div>
    <div class="content">
      <h2>You're Invited to Join ${agencyName}</h2>
      <p>Hello! <strong>${inviterName}</strong> has invited you to join the team at <strong>${agencyName}</strong> as a <strong>${role}</strong> on the Caselink platform.</p>
      <div class="btn-container">
        <a href="${inviteLink}" class="btn" target="_blank">Accept Invitation & Set Password</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This invitation link is valid for <strong>48 hours</strong>. If you were not expecting this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Caselink Travel SaaS Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
}
