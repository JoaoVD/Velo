import resend
import logging

logger = logging.getLogger(__name__)


def send_weekly_report_email(
    api_key: str,
    to_email: str,
    brand_name: str,
    geo_score: int,
    score_change: int,
    report_url: str,
    top_action: str,
) -> None:
    """Send weekly GEO Score report email via Resend. Never raises — logs errors."""
    resend.api_key = api_key
    change_text = f"↑ +{score_change}" if score_change >= 0 else f"↓ {score_change}"
    change_color = "#10b981" if score_change >= 0 else "#ef4444"

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Ve<span style="color:#3f6b4e;">l</span>o</span>
          <span style="float:right;font-size:12px;color:#64748b;line-height:2.2;">Relatório semanal</span>
        </td></tr>
        <tr><td style="padding:40px 40px 24px;text-align:center;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#94a3b8;">GEO SCORE · {brand_name}</p>
          <p style="margin:0;font-size:64px;font-weight:900;color:#0f172a;line-height:1;letter-spacing:-.03em;">{geo_score}</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:{change_color};">{change_text} pts vs. semana passada</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#3f6b4e;">Destaque da semana</p>
          <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.7;font-weight:600;">{top_action}</p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#3f6b4e;border-radius:6px;">
              <a href="{report_url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">Ver relatório completo →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© 2025 Velo</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    resend.Emails.send({
        "from": "Velo <noreply@velo.com.br>",
        "to": [to_email],
        "subject": f"Seu GEO Score da semana — {brand_name}",
        "html": html,
    })
    logger.info("Email de relatório enviado para %s", to_email)


ENGINE_LABELS = {"chatgpt": "ChatGPT", "gemini": "Gemini"}


def send_alert_email(
    api_key: str,
    to_email: str,
    brand_name: str,
    score_change: int,
    lost_keywords: list[dict],
    dashboard_url: str,
) -> None:
    """Send change alert email via Resend. lost_keywords: [{"term", "engine"}]."""
    resend.api_key = api_key

    reasons = []
    if score_change <= -10:
        reasons.append(
            f'<li style="margin:0 0 8px;font-size:14px;color:#0f172a;line-height:1.6;">'
            f'Seu GEO Score caiu <strong style="color:#b91c1c;">{score_change} pontos</strong> desde o último scan.</li>'
        )
    for lk in lost_keywords:
        engine_label = ENGINE_LABELS.get(lk["engine"], lk["engine"])
        reasons.append(
            f'<li style="margin:0 0 8px;font-size:14px;color:#0f172a;line-height:1.6;">'
            f'O {engine_label} <strong style="color:#b91c1c;">deixou de mencionar</strong> sua marca em '
            f'&ldquo;{lk["term"]}&rdquo;.</li>'
        )

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:28px 40px;">
          <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Ve<span style="color:#3f6b4e;">l</span>o</span>
          <span style="float:right;font-size:12px;color:#f87171;line-height:2.2;font-weight:600;">⚠ Alerta de mudança</span>
        </td></tr>
        <tr><td style="padding:36px 40px 8px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#b91c1c;">Mudança detectada · {brand_name}</p>
          <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0f172a;line-height:1.4;">Sua presença nas IAs mudou desde o último scan:</p>
          <ul style="margin:0 0 24px;padding-left:20px;">{"".join(reasons)}</ul>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#3f6b4e;border-radius:6px;">
              <a href="{dashboard_url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">Ver o que mudou →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 40px 28px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 Velo</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    resend.Emails.send({
        "from": "Velo <noreply@velo.com.br>",
        "to": [to_email],
        "subject": f"⚠ Mudança na sua presença nas IAs — {brand_name}",
        "html": html,
    })
    logger.info("Email de alerta enviado para %s", to_email)
