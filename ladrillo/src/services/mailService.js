const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendResetEmail = async (email, resetLink) => {

  await transporter.sendMail({
    from: `"Mascotas App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperar contraseña',
    html: `
      <h2>Recuperar contraseña</h2>

      <p>Haz clic en el siguiente enlace:</p>

      <a href="${resetLink}">
        Cambiar contraseña
      </a>

      <p>Este enlace expira en 15 minutos.</p>
    `
  });
};