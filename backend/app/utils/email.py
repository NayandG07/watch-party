"""
Email sending utility using Python's smtplib.

If SMTP settings are not configured, logs OTP to console (development mode).
"""
from __future__ import annotations

import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import structlog

logger = structlog.get_logger()

OTP_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Verify your email - Watch Party</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#16131f;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#7c2ff7,#4f46e5);padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">Watch Party</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f0ff;">Verify your email address</h2>
            <p style="margin:0 0 28px;color:#9491a7;font-size:14px;line-height:1.6;">
              Use the code below to complete your registration. Expires in <strong style="color:#c4b5fd;">10 minutes</strong>.
            </p>
            <div style="background:#0d0b18;border:1px solid rgba(124,47,247,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#7c2ff7;">Verification Code</p>
              <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:12px;color:#fff;">{otp}</p>
            </div>
            <p style="margin:0;color:#6b6880;font-size:13px;">If you did not create an account, ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;color:#4a4760;font-size:12px;text-align:center;">&copy; 2025 Watch Party</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def send_otp_email(to_email: str, otp: str, settings: object) -> bool:
    """Send OTP verification email. Returns True on success."""
    smtp_host: str = getattr(settings, "smtp_host", "")
    smtp_user: str = getattr(settings, "smtp_user", "")

    if not smtp_host or not smtp_user:
        logger.info("DEV: Email OTP (SMTP not configured)", to=to_email, otp=otp)
        return True

    smtp_port: int = getattr(settings, "smtp_port", 587)
    smtp_password: str = getattr(settings, "smtp_password", "")
    smtp_from: str = getattr(settings, "smtp_from", "noreply@watchparty.app")
    smtp_starttls: bool = getattr(settings, "smtp_starttls", True)

    html = OTP_EMAIL_TEMPLATE.format(otp=otp)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp} - Your Watch Party verification code"
    msg["From"] = smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    def _send() -> None:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            if smtp_starttls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())

    try:
        await asyncio.get_event_loop().run_in_executor(None, _send)
        logger.info("Verification email sent", to=to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send verification email", to=to_email, error=str(exc))
        return False