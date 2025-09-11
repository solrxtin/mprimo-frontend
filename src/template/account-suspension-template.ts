export const VENDOR_SUSPENSION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Suspension Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #5187f1, #5187f6); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Account Suspension Notice</h1>
  </div>
  <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello <strong>{businessName}</strong>,</p>
    <p>This message is to inform you that your vendor account has been temporarily suspended.</p>

    <p><strong>Reason for Suspension:</strong> {reason}</p>
    <p><strong>Details:</strong></p>
    <blockquote style="margin: 20px 0; padding-left: 20px; border-left: 3px solid #5187f6;">
      {explanation}
    </blockquote>

    <p><strong>Suspension Duration:</strong> {duration} days</p>

    <p>Please review the explanation above carefully and take the necessary corrective actions. Your account access will be restored on the stated date unless further violations occur.</p>

    <p>If you believe this action was taken in error or have questions regarding the suspension, kindly contact our compliance team for review.</p>

    <p>We appreciate your understanding and cooperation.</p>
    <p>Best regards,<br/>Mprimo Vendor Compliance Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const VENDOR_UNSUSPENSION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Reinstatement Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #5187f1, #5187f6); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Account Reinstatement Notice</h1>
  </div>
  <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello <strong>{businessName}</strong>,</p>
    <p>We’re pleased to inform you that your vendor account has been successfully reinstated and is now active.</p>

    <p><strong>Previous Suspension Reason:</strong> {reason}</p>
    <p><strong>Summary:</strong></p>
    <blockquote style="margin: 20px 0; padding-left: 20px; border-left: 3px solid #5187f6;">
      {explanation}
    </blockquote>

    <p>We trust that the necessary steps have been taken to address the issue. Please continue to adhere to our platform guidelines to ensure a smooth experience for both you and your customers.</p>

    <p>If you have any questions or require further assistance, feel free to reach out to our support or compliance team.</p>

    <p>Welcome back, and thank you for your cooperation.</p>
    <p>Best regards,<br/>Mprimo Vendor Compliance Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;