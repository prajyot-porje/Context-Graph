interface SendOTPOptions {
  email: string
  otp: string
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email' | string
}

/**
 * Send a verification OTP email via Resend HTTP API.
 */
export async function sendVerificationOTPEmail({ email, otp, type }: SendOTPOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'ContextGraph <onboarding@resend.dev>'

  let subject = `Your ContextGraph verification code: ${otp}`
  let headline = 'Verify your email address'
  let subtext = 'Enter the 6-digit verification code below to confirm your email and secure your context graph.'

  if (type === 'sign-in') {
    subject = `Your ContextGraph sign-in code: ${otp}`
    headline = 'Sign in to ContextGraph'
    subtext = 'Enter the 6-digit code below to securely sign in to your context graph.'
  } else if (type === 'forget-password') {
    subject = `Reset your ContextGraph password: ${otp}`
    headline = 'Reset your password'
    subtext = 'Enter the 6-digit code below to reset your ContextGraph account password.'
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ededed;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0d0e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #131618; border: 1px solid #23272b; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1e2226;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #1a1e22; border: 1px solid #2c3238; border-radius: 6px; width: 32px; height: 32px; text-align: center; vertical-align: middle;">
                    <span style="color: #B3EC13; font-weight: 800; font-size: 16px;">⬡</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">Context<span style="color: #B3EC13;">Graph</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                ${headline}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #9da6b0;">
                ${subtext}
              </p>
              <div style="background-color: #171b1e; border: 1px solid #282f36; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #B3EC13;">
                  ${otp}
                </span>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #6b7580;">
                This code expires in <strong>5 minutes</strong>. If you did not request this verification code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 32px; background-color: #0e1012; border-top: 1px solid #1c2024; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #525a63;">
                ContextGraph · Cross-AI Personal Context Engine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `${headline}\n\n${subtext}\n\nYour verification code: ${otp}\n\nThis code expires in 5 minutes.\nIf you did not request this, please ignore this email.\n\nContextGraph`

  if (!apiKey) {
    console.warn(`[lib/email] RESEND_API_KEY is not configured. Verification code for ${email} is: ${otp}`)
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[lib/email] Resend API error (${response.status}):`, errorText)
      console.warn(`[lib/email] Resend delivery failed (${response.status}). Development fallback OTP for ${email} is: ${otp}`)
    } else {
      console.log(`[lib/email] Verification OTP email dispatched successfully to ${email}`)
    }
  } catch (error) {
    console.error('[lib/email] Failed to send email via Resend:', error)
    console.warn(`[lib/email] Network exception. Development fallback OTP for ${email} is: ${otp}`)
  }
}
