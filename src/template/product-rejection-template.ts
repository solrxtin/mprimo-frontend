export const VENDOR_PRODUCT_REJECTION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Product Rejection Notice</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right,  #5187f1, #5187f6); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Product Rejection Notice</h1>
  </div>
  <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello <strong>{businessName}</strong>,</p>
    <p>We regret to inform you that one of your products submitted under order <strong>#{orderId}</strong> has not passed inspection at our warehouse.</p>

    <p><strong>Product ID:</strong> {productId}</p>
    <p><strong>Reason for Rejection:</strong> {reason}</p>

    <p><strong>Inspection Details:</strong></p>
    <blockquote style="margin: 20px 0; padding-left: 20px; border-left: 3px solid #5187f1;">
      {explanation}
    </blockquote>

    <p>This item has been marked as rejected and will not be processed for delivery. If corrective action is possible, please follow up with our logistics team promptly to initiate review or return protocols.</p>

    <p>We appreciate your attention to product compliance and quality standards. For further assistance, you may reach out to our support team.</p>

    <p>Best regards,<br/>Mprimo Warehouse Quality Assurance</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;