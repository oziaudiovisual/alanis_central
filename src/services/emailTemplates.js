// Alanis — Transactional Email Templates (HTML inline CSS)

const LOGO_URL = 'https://central.alanis.digital/logo.webp';

function baseLayout(content) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#121212;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#121212;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${LOGO_URL}" alt="Alanis" width="140" style="display:block;max-width:140px;height:auto;">
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555555;line-height:1.5;">
                © 2026 Alanis · Todos os direitos reservados
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#444444;">
                Este é um e-mail automático. Não responda diretamente.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeEmail(name, licenseKey, plan) {
    const firstName = (name || 'Cliente').split(' ')[0];
    const content = `
              <!-- Accent bar -->
              <div style="height:4px;background:linear-gradient(90deg,#04ffc2,#03dcb5,#00c9a7);"></div>
              
              <!-- Body -->
              <div style="padding:40px 36px;">
                <!-- Greeting -->
                <h1 style="margin:0 0 8px;font-family:'Outfit','Inter',sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                  Bem-vindo à Alanis! 🎉
                </h1>
                <p style="margin:0 0 28px;font-size:16px;color:#a3a3a3;line-height:1.6;">
                  Olá, <strong style="color:#ffffff;">${firstName}</strong>! Sua compra foi aprovada e sua licença está pronta.
                </p>

                <!-- Plan badge -->
                <div style="margin-bottom:24px;">
                  <span style="display:inline-block;padding:6px 16px;background:rgba(4,255,194,0.1);border:1px solid rgba(4,255,194,0.2);border-radius:20px;font-size:13px;font-weight:600;color:#04ffc2;text-transform:uppercase;letter-spacing:0.05em;">
                    ${plan || 'Alanis'}
                  </span>
                </div>

                <!-- License Key Box -->
                <div style="background:#121212;border:1px solid #333333;border-radius:12px;padding:24px;margin-bottom:28px;">
                  <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:0.08em;">
                    Sua Chave de Licença
                  </p>
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#04ffc2;letter-spacing:0.08em;word-break:break-all;">
                    ${licenseKey}
                  </p>
                </div>

                <!-- Instructions -->
                <div style="background:#1f1f1f;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">📋 Como usar sua licença:</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#a3a3a3;line-height:1.5;">
                        <span style="color:#04ffc2;font-weight:700;">1.</span> Copie a chave acima
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#a3a3a3;line-height:1.5;">
                        <span style="color:#04ffc2;font-weight:700;">2.</span> Acesse o painel do seu site
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#a3a3a3;line-height:1.5;">
                        <span style="color:#04ffc2;font-weight:700;">3.</span> Cole a chave nas configurações
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Recover link -->
                <p style="margin:0;font-size:13px;color:#737373;line-height:1.5;">
                  Perdeu sua chave? Recupere em 
                  <a href="https://licenca.alanis.digital/license/recover" style="color:#04ffc2;text-decoration:none;font-weight:500;">licenca.alanis.digital</a>
                </p>
              </div>`;

    return baseLayout(content);
}

function chargebackEmail(name) {
    const firstName = (name || 'Cliente').split(' ')[0];
    const content = `
              <!-- Accent bar (warning) -->
              <div style="height:4px;background:linear-gradient(90deg,#ffbe0b,#fb923c,#ff4d6a);"></div>
              
              <!-- Body -->
              <div style="padding:40px 36px;">
                <h1 style="margin:0 0 8px;font-family:'Outfit','Inter',sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                  Identificamos um Chargeback
                </h1>
                <p style="margin:0 0 28px;font-size:16px;color:#a3a3a3;line-height:1.6;">
                  Olá, <strong style="color:#ffffff;">${firstName}</strong>. Recebemos uma notificação de chargeback referente à sua assinatura.
                </p>

                <!-- Alert box -->
                <div style="background:rgba(255,190,11,0.08);border:1px solid rgba(255,190,11,0.2);border-radius:12px;padding:24px;margin-bottom:28px;">
                  <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#ffbe0b;">
                    ⚠️ Atenção
                  </p>
                  <p style="margin:0;font-size:14px;color:#d4d4d4;line-height:1.6;">
                    Sua licença foi <strong style="color:#ff4d6a;">cancelada</strong> e seu site será desativado em <strong style="color:#ffffff;">24 horas</strong>.
                  </p>
                </div>

                <!-- Explanation -->
                <div style="background:#1f1f1f;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">O que aconteceu?</p>
                  <p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.7;">
                    Um chargeback é quando a operadora do cartão reverte o pagamento a pedido do titular. 
                    Isso cancela automaticamente o acesso à plataforma.
                  </p>
                </div>

                <!-- Resolution -->
                <div style="background:#1f1f1f;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#ffffff;">Como resolver?</p>
                  <p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.7;">
                    Se isso foi um engano, entre em contato conosco o mais rápido possível para regularizar a situação 
                    e evitar a desativação do seu site.
                  </p>
                </div>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td align="center">
                      <a href="mailto:suporte@alanis.digital" style="display:inline-block;padding:14px 32px;background:#ffbe0b;color:#000000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                        Falar com Suporte
                      </a>
                    </td>
                  </tr>
                </table>
              </div>`;

    return baseLayout(content);
}

function refundEmail(name) {
    const firstName = (name || 'Cliente').split(' ')[0];
    const content = `
              <!-- Accent bar (neutral) -->
              <div style="height:4px;background:linear-gradient(90deg,#fb923c,#ffbe0b,#fcd34d);"></div>
              
              <!-- Body -->
              <div style="padding:40px 36px;">
                <h1 style="margin:0 0 8px;font-family:'Outfit','Inter',sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                  Reembolso Processado
                </h1>
                <p style="margin:0 0 28px;font-size:16px;color:#a3a3a3;line-height:1.6;">
                  Olá, <strong style="color:#ffffff;">${firstName}</strong>. Confirmamos que seu reembolso foi processado com sucesso.
                </p>

                <!-- Info box -->
                <div style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.2);border-radius:12px;padding:24px;margin-bottom:28px;">
                  <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#fb923c;">
                    📋 O que muda
                  </p>
                  <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#d4d4d4;line-height:1.8;">
                    <li>Sua licença foi <strong style="color:#ffffff;">cancelada</strong></li>
                    <li>O valor será devolvido pela forma de pagamento original</li>
                    <li>Seu site será desativado em <strong style="color:#ffffff;">24 horas</strong></li>
                  </ul>
                </div>

                <!-- Message -->
                <div style="background:#1f1f1f;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                  <p style="margin:0;font-size:14px;color:#a3a3a3;line-height:1.7;">
                    Lamentamos que a Alanis não atendeu às suas expectativas. Se houver algo que possamos melhorar 
                    ou se quiser compartilhar o motivo, ficaremos felizes em ouvir.
                  </p>
                </div>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td align="center">
                      <a href="mailto:suporte@alanis.digital" style="display:inline-block;padding:14px 32px;background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.3);color:#fb923c;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                        Falar com a gente
                      </a>
                    </td>
                  </tr>
                </table>
              </div>`;

    return baseLayout(content);
}

module.exports = { welcomeEmail, chargebackEmail, refundEmail };
