const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: 'Educore <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

module.exports = sendEmail;