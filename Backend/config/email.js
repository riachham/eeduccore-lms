const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Educore" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
 } catch (error) {
  console.error("FULL EMAIL ERROR:");
  console.error(error);
  return false;
}
};

module.exports = sendEmail;