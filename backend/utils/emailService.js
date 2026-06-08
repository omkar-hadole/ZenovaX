const nodemailer = require('nodemailer');
const logger = require('./logger');
// import logo from 
// Configure transporter
// In production, these should be env variables. 
// For dev, if not provided, it will log to console or fallback to ethereal if we wanted, 
// but here we'll try to use provided creds or warn.
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            logger.warn("Email credentials not found in environment. Email NOT sent.");
            logger.debug("Email simulation", { to, subject });
            return;
        }

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"ZenovaX Support" <noreply@zenovax.com>',
            to,
            subject,
            html
        });
        // console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        logger.error("Failed to send email:", error);
        // Don't throw, just log. We don't want to break the auth flow if email fails (though ideally we would handle it).
    }
};

/**
 * Send verification email
 * @param {string} email - User email
 * @param {string} token - Verification token
 */
exports.sendVerificationEmail = async (email, token) => {
    // Determine frontend URL (dev or prod)
    // Assuming frontend runs on localhost:5173 for dev
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const subject = "Verify your ZenovaX Account";
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6fb; font-family: Arial, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb; padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; padding:32px; box-shadow:0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0; font-size:28px; color:#7A79E6;">
                ZenovaX
              </h1>
              <p style="margin:8px 0 0; color:#6b7280; font-size:14px;">
                Learn. Mentor. Grow.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="color:#111827; font-size:16px; line-height:1.6;">
              <p style="margin-top:0;">Hey 👋</p>

              <p>
                Thanks for signing up on <strong>ZenovaX</strong>.
                To activate your account, please verify your email address.
              </p>

              <!-- Button -->
              <div style="text-align:center; margin:32px 0;">
                <a href="${verificationLink}"
                   style="
                     display:inline-block;
                     background:#7A79E6;
                     color:#ffffff;
                     text-decoration:none;
                     padding:14px 32px;
                     border-radius:8px;
                     font-size:16px;
                     font-weight:600;
                   ">
                  Verify Email
                </a>
              </div>

              <p style="font-size:14px; color:#6b7280;">
                This link will expire in <strong>24 hours</strong>.
              </p>

              <p style="font-size:14px; color:#6b7280;">
                If the button doesn’t work, copy and paste this link:
              </p>

              <p style="word-break:break-all; font-size:13px;">
                <a href="${verificationLink}" style="color:#7A79E6;">
                  ${verificationLink}
                </a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 0;">
              <hr style="border:none; border-top:1px solid #e5e7eb;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="font-size:12px; color:#9ca3af; text-align:center;">
              <p style="margin:0;">
                If you didn’t create an account, you can safely ignore this email.
              </p>
              <p style="margin:8px 0 0;">
                © ${new Date().getFullYear()} ZenovaX. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>
`;

    await sendEmail(email, subject, html);
};
