import nodemailer from "nodemailer";
import crypto from "crypto";

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP verification email to user
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 * @param {string} otp - 6-digit OTP
 * @returns {Promise} Promise that resolves when email is sent
 */
export const sendVerificationEmail = async (email, fullName, otp) => {
  const mailOptions = {
    from: `"VideoChat" <${process.env.EMAIL_ID}>`,
    to: email,
    subject: "Verify Your Email - VideoChat",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 10px;
            }
            .otp-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 48px;
              font-weight: bold;
              color: #ffffff;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eeeeee;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚢 VideoChat</div>
              <h2 style="margin: 0; color: #333;">Verify Your Email</h2>
            </div>
            
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <p>Thank you for signing up for VideoChat! To complete your registration, please use the following One-Time Password (OTP):</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important:</strong> This OTP will expire in <strong>10 minutes</strong>.</p>
            </div>
            
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Never share this OTP with anyone</li>
              <li>VideoChat staff will never ask for your OTP</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} VideoChat. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${fullName},
      
      Thank you for signing up for VideoChat!
      
      Your verification OTP is: ${otp}
      
      This OTP will expire in 10 minutes.
      
      Security Tips:
      - Never share this OTP with anyone
      - VideoChat staff will never ask for your OTP
      - If you didn't request this, please ignore this email
      
      © ${new Date().getFullYear()} VideoChat. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

/**
 * Validate password strength
 * Password must be at least 8 characters and contain:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!hasNumber) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one special character (@$!%*?&)",
    };
  }

  return {
    isValid: true,
    message: "Password is strong",
  };
};
