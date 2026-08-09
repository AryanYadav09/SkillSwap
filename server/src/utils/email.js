const nodemailer = require("nodemailer");
const env = require("../config/env");

/**
 * Configure the nodemailer transporter using Gmail SMTP.
 * Note: Gmail requires an "App Password" to be used here if 2FA is enabled.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.SMTP_EMAIL,
    pass: env.SMTP_PASSWORD,
  },
});

/**
 * Sends a password reset email to the user.
 * 
 * @param {string} to - The recipient's email address
 * @param {string} resetToken - The raw reset token to include in the link
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  // Use the first client URL available or fallback
  const clientUrl = env.CLIENT_URLS 
    ? env.CLIENT_URLS.split(",")[0] 
    : env.CLIENT_URL || "http://localhost:5173";

  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"SkillSwap Support" <${env.SMTP_EMAIL}>`,
    to,
    subject: "Reset Your SkillSwap Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #d4af37;">SkillSwap</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your SkillSwap account. Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #d4af37; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
        <p style="font-size: 12px; color: #888; margin-top: 40px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${resetLink}
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // Don't throw an error to the frontend, just log it. The user will see the generic success message.
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
};
