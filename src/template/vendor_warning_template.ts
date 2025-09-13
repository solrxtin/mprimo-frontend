export const VENDOR_WARNING_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Warning</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #5187f1, #5187f6); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Account Warning Notice</h1>
  </div>
  <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello <strong>{businessName}</strong>,</p>
    <p>This is an official notice regarding a compliance issue on your vendor account <strong>#{vendorId}</strong>.</p>
    
    <p><strong>Warning Type:</strong> {type}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="margin: 20px 0; padding-left: 20px; border-left: 3px solid #5187f6;">
      {message}
    </blockquote>

    <p>Please address this issue promptly to avoid further action. If you believe this warning was issued in error, feel free to contact us.</p>
    
    <p>We appreciate your cooperation.</p>
    <p>Best regards,<br/>Mprimo Vendor Compliance Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;