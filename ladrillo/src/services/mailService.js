const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT) || 2525,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
  }
});

const sendMailWithRetry = async (options, retries = 3, delayMs = 2000) => {
  try {
    return await transporter.sendMail(options);
  } catch (error) {
    const isRateLimit = error.responseCode === 550 || 
                        String(error.response || '').includes('550') || 
                        String(error.message || '').includes('Too many emails');
    if (retries > 0 && isRateLimit) {
      console.warn(`[Mailtrap] Rate limit alcanzado. Reintentando en ${delayMs}ms...`);
      await new Promise(res => setTimeout(res, delayMs));
      return sendMailWithRetry(options, retries - 1, delayMs * 1.5);
    }
    throw error;
  }
};

/**
 * Enviar correo de verificación de cuenta al registrarse
 */
exports.sendVerificationEmail = async (email, verificationLink, nombre = '') => {
  const fromAddress = process.env.EMAIL_FROM || '"Más Cuidado App" <no-reply@mascuidado.app>';
  const displayName = nombre ? `Hola ${nombre}` : '¡Hola!';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #374151; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: #2d9b96; padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 500; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; }
        .description { font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 28px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #2d9b96; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(45,155,150,0.35); }
        .btn:hover { background-color: #24827d; }
        .expiration { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 16px; }
        .link-alt { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; word-break: break-all; }
        .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 +Cuidado</h1>
          <p>Tu plataforma para el cuidado de tus mejores amigos</p>
        </div>
        <div class="content">
          <div class="greeting">${displayName}, ¡te damos la bienvenida!</div>
          <p class="description">
            Gracias por unirte a <strong>+Cuidado</strong>. Para garantizar la seguridad de tu cuenta y proteger el bienestar de tus mascotas, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:
          </p>
          <div class="btn-wrapper">
            <a href="${verificationLink}" class="btn" target="_blank">Verificar mi cuenta</a>
          </div>
          <p class="expiration">⏳ Este enlace es válido durante 24 horas.</p>
          <div class="link-alt">
            Si tienes problemas con el botón, copia y pega el siguiente enlace en tu navegador:<br />
            <a href="${verificationLink}" style="color: #2d9b96;">${verificationLink}</a>
          </div>
        </div>
        <div class="footer">
          Si no creaste una cuenta en +Cuidado, puedes desestimar este mensaje de forma segura.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMailWithRetry({
    from: fromAddress,
    to: email,
    subject: '🐾 Verifica tu correo en +Cuidado',
    html
  });
};

/**
 * Enviar correo para restablecer contraseña
 */
exports.sendResetEmail = async (email, resetLink, nombre = '') => {
  const fromAddress = process.env.EMAIL_FROM || '"Más Cuidado App" <no-reply@mascuidado.app>';
  const displayName = nombre ? `Hola ${nombre}` : '¡Hola!';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #374151; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background: #2d9b96; padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 14px; font-weight: 500; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; }
        .description { font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 28px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #2d9b96; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(45,155,150,0.35); }
        .btn:hover { background-color: #24827d; }
        .expiration { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 16px; }
        .link-alt { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; word-break: break-all; }
        .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 +Cuidado</h1>
          <p>Recuperación de Contraseña</p>
        </div>
        <div class="content">
          <div class="greeting">${displayName}</div>
          <p class="description">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>+Cuidado</strong>. Si realizaste esta solicitud, haz clic en el siguiente botón para definir una nueva contraseña:
          </p>
          <div class="btn-wrapper">
            <a href="${resetLink}" class="btn" target="_blank">Cambiar mi contraseña</a>
          </div>
          <p class="expiration">⏳ Este enlace expira en 15 minutos.</p>
          <div class="link-alt">
            Si no funciona el botón, puedes copiar este enlace en tu navegador:<br />
            <a href="${resetLink}" style="color: #2d9b96;">${resetLink}</a>
          </div>
        </div>
        <div class="footer">
          Si tú no solicitaste este cambio, puedes ignorar este correo sin problema; tu cuenta sigue segura.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMailWithRetry({
    from: fromAddress,
    to: email,
    subject: '🔑 Recupera tu contraseña en +Cuidado',
    html
  });
};
