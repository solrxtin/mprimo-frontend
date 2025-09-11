export const VENDOR_PRODUCT_RECEIVED_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Product Received Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #5187f1, #5187f6); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Product Received Confirmation</h1>
  </div>
  <div style="background-color: #f0fff0; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello <strong>{businessName}</strong>,</p>
    <p>This is to confirm that one of your products under order <strong>#{orderId}</strong> has been received at our warehouse and successfully checked in.</p>

    <p><strong>Product Name:</strong> {productName}</p>
    <p><strong>Received Date:</strong> {receivedDate}</p>

    <p>We will proceed with further processing, inspection, and preparation for fulfillment as per our standard operations. If there are any issues or further instructions related to this product, please let our logistics team know.</p>

    <p>Thank you for your collaboration and for ensuring timely delivery.</p>
    <p>Best regards,<br/>Mprimo Warehouse Receiving Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;