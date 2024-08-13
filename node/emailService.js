// emailService.js
import nodemailer from 'nodemailer';

// Configuração do transporte (exemplo com Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tsistemasdistribuidos@gmail.com',
    pass: 'v b a v t a n p i t z o u y k l' // Considere usar uma senha de aplicativo para segurança
  }
});

// Função para enviar um email
export const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'tsistemasdistribuidos@gmail.com',
    to: to,
    subject: subject,
    text: text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Erro ao enviar email:', error);
    }
    console.log('Email enviado:', info.response);
  });
};
