/**
 * HTML email templates for Béute Pro.
 * Plain HTML — no framework, no external assets. Inline styles only so
 * the emails render consistently across Gmail / Outlook / Apple Mail.
 */

const BRAND = {
  green: '#0F2A1D',
  green2: '#17402C',
  gold: '#C9A44C',
  ivory: '#F7F4EC',
  ivory2: '#EFEADD',
  ink: '#132018',
  soft: '#5C7A68',
};

const wrap = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.ivory};font-family:'Helvetica Neue',Arial,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.ivory};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,42,29,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND.green};padding:24px 32px;">
              <h1 style="margin:0;color:${BRAND.ivory};font-size:22px;font-weight:800;letter-spacing:-0.02em;">Béute Pro</h1>
              <p style="margin:4px 0 0;color:${BRAND.gold};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Nurtured, not manufactured</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:${BRAND.ivory2};padding:20px 32px;color:${BRAND.soft};font-size:12px;line-height:1.6;text-align:center;">
              Béute Pro · Faisalabad, Pakistan<br>
              Questions? Reply to this email or write to sales@beutepro.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ------------------------------------------------------------
// ORDER CONFIRMATION
// ------------------------------------------------------------
const orderConfirmation = ({ order, items }) => {
  const itemsHtml = items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${BRAND.ivory2};color:${BRAND.ink};">
            ${it.product_id}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid ${BRAND.ivory2};color:${BRAND.soft};text-align:center;">
            ×${it.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid ${BRAND.ivory2};color:${BRAND.ink};text-align:right;font-weight:600;">
            Rs ${parseFloat(it.unit_price_pkr).toFixed(2)}
          </td>
        </tr>`
    )
    .join('');

  const discountRow = order.discount_amount > 0
    ? `<tr>
         <td colspan="2" style="padding:8px 0 4px;color:${BRAND.soft};text-align:right;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}</td>
         <td style="padding:8px 0 4px;color:#a8443c;text-align:right;font-weight:600;">−Rs ${parseFloat(order.discount_amount).toFixed(2)}</td>
       </tr>`
    : '';

  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">Thank you for your order!</h2>
    <p style="margin:0 0 20px;color:${BRAND.soft};line-height:1.6;">
      Hi ${order.customer_name}, we've received your order and it's being prepared.
    </p>

    <div style="background:${BRAND.ivory2};border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${BRAND.soft};">Order number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.green};">${order.order_number}</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:12px;color:${BRAND.soft};text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;border-bottom:2px solid ${BRAND.gold};">Item</th>
          <th style="text-align:center;font-size:12px;color:${BRAND.soft};text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;border-bottom:2px solid ${BRAND.gold};">Qty</th>
          <th style="text-align:right;font-size:12px;color:${BRAND.soft};text-transform:uppercase;letter-spacing:0.05em;padding-bottom:8px;border-bottom:2px solid ${BRAND.gold};">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${discountRow}
        <tr>
          <td colspan="2" style="padding:12px 0 0;font-weight:700;color:${BRAND.green};">Total</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:800;font-size:16px;color:${BRAND.gold};">Rs ${parseFloat(order.total_amount_pkr).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin:24px 0 4px;color:${BRAND.soft};font-size:13px;">Shipping to</p>
    <p style="margin:0;color:${BRAND.ink};line-height:1.5;">${order.shipping_address}</p>

    <p style="margin:24px 0 4px;color:${BRAND.soft};font-size:13px;">Payment method</p>
    <p style="margin:0;color:${BRAND.ink};text-transform:uppercase;font-size:13px;font-weight:600;">${order.payment_method}</p>

    <p style="margin:32px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      We'll email you again when your order ships. If you have any questions, simply reply to this email.
    </p>
  `;

  return {
    subject: `Order confirmed — ${order.order_number}`,
    html: wrap('Order confirmed', body),
    text: `Thank you for your order! Order ${order.order_number}. Total: Rs ${parseFloat(order.total_amount_pkr).toFixed(2)}.`,
  };
};

// ------------------------------------------------------------
// ORDER SHIPPED
// ------------------------------------------------------------
const orderShipped = ({ order }) => {
  const tracking = order.tracking_number
    ? `
      <div style="background:${BRAND.ivory2};border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:${BRAND.soft};text-transform:uppercase;letter-spacing:0.05em;">Tracking</p>
        <p style="margin:0;font-size:15px;color:${BRAND.ink};font-weight:700;">${order.courier_name || 'Courier'}</p>
        <p style="margin:4px 0 0;font-size:14px;color:${BRAND.green};font-family:monospace;">${order.tracking_number}</p>
      </div>`
    : '';

  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">Your order is on the way 🚚</h2>
    <p style="margin:0 0 20px;color:${BRAND.soft};line-height:1.6;">
      Hi ${order.customer_name}, order <b>${order.order_number}</b> has been shipped.
    </p>

    ${tracking}

    <p style="margin:24px 0 4px;color:${BRAND.soft};font-size:13px;">Delivering to</p>
    <p style="margin:0;color:${BRAND.ink};line-height:1.5;">${order.shipping_address}</p>

    <p style="margin:32px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      You can track your order any time from our website using order number <b>${order.order_number}</b>.
    </p>
  `;

  return {
    subject: `Shipped — ${order.order_number}`,
    html: wrap('Order shipped', body),
    text: `Your order ${order.order_number} has shipped.`,
  };
};

// ------------------------------------------------------------
// ORDER DELIVERED
// ------------------------------------------------------------
const orderDelivered = ({ order }) => {
  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">Delivered ✓</h2>
    <p style="margin:0 0 20px;color:${BRAND.soft};line-height:1.6;">
      Hi ${order.customer_name}, order <b>${order.order_number}</b> has been delivered. We hope you love it.
    </p>
    <p style="margin:24px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      If anything is wrong, just reply to this email and we'll make it right.
    </p>
  `;

  return {
    subject: `Delivered — ${order.order_number}`,
    html: wrap('Order delivered', body),
    text: `Your order ${order.order_number} has been delivered.`,
  };
};

// ------------------------------------------------------------
// ORDER CANCELLED
// ------------------------------------------------------------
const orderCancelled = ({ order }) => {
  const body = `
    <h2 style="margin:0 0 8px;color:#a8443c;font-size:20px;">Order cancelled</h2>
    <p style="margin:0 0 20px;color:${BRAND.soft};line-height:1.6;">
      Hi ${order.customer_name}, your order <b>${order.order_number}</b> has been cancelled.
    </p>
    ${order.admin_notes
      ? `<p style="margin:16px 0;padding:12px 16px;background:${BRAND.ivory2};border-left:3px solid ${BRAND.gold};border-radius:6px;color:${BRAND.ink};font-size:14px;">${order.admin_notes}</p>`
      : ''}
    <p style="margin:24px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      If this was a mistake or you'd like to place a new order, just reply and we'll help.
    </p>
  `;

  return {
    subject: `Order cancelled — ${order.order_number}`,
    html: wrap('Order cancelled', body),
    text: `Your order ${order.order_number} has been cancelled.`,
  };
};

// ------------------------------------------------------------
// CONTACT FORM ACKNOWLEDGEMENT
// ------------------------------------------------------------
const contactAcknowledgement = ({ name, message }) => {
  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">Thanks for reaching out, ${name}!</h2>
    <p style="margin:0 0 20px;color:${BRAND.soft};line-height:1.6;">
      We've received your message and our team will get back to you within 1–2 business days.
    </p>

    <div style="background:${BRAND.ivory2};border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:${BRAND.soft};text-transform:uppercase;letter-spacing:0.05em;">Your message</p>
      <p style="margin:0;color:${BRAND.ink};line-height:1.6;white-space:pre-wrap;">${message}</p>
    </div>

    <p style="margin:24px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      In a hurry? You can also reach us on WhatsApp or reply directly to this email.
    </p>
  `;

  return {
    subject: 'We got your message — Béute Pro',
    html: wrap('Message received', body),
    text: `Thanks for reaching out, ${name}. We'll get back to you soon.`,
  };
};

// ------------------------------------------------------------
// CONTACT FORM — ADMIN NOTIFICATION
// ------------------------------------------------------------
const contactAdminNotification = ({ name, email, message }) => {
  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">New contact form submission</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="padding:6px 0;color:${BRAND.soft};width:80px;">Name</td><td style="padding:6px 0;color:${BRAND.ink};font-weight:600;">${name}</td></tr>
      <tr><td style="padding:6px 0;color:${BRAND.soft};">Email</td><td style="padding:6px 0;color:${BRAND.ink};font-weight:600;">${email}</td></tr>
    </table>
    <div style="background:${BRAND.ivory2};border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:${BRAND.ink};line-height:1.6;white-space:pre-wrap;">${message}</p>
    </div>
    <p style="margin:24px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      Reply directly to this email to respond to ${name}.
    </p>
  `;

  return {
    subject: `New message from ${name}`,
    html: wrap('New message', body),
    text: `New message from ${name} (${email}): ${message}`,
  };
};

// ------------------------------------------------------------
// PASSWORD CHANGED
// ------------------------------------------------------------
const passwordChanged = ({ user }) => {
  const body = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">Your password was changed</h2>
    <p style="margin:0 0 20px;color:${BRAND.soft};line-height:1.6;">
      Hi ${user.full_name || 'there'}, the password on your Béute Pro account was just changed.
    </p>
    <p style="margin:24px 0 0;color:${BRAND.soft};line-height:1.6;font-size:14px;">
      If this wasn't you, reply to this email immediately and we'll help you secure your account.
    </p>
  `;

  return {
    subject: 'Your password was changed — Béute Pro',
    html: wrap('Password changed', body),
    text: 'Your Béute Pro password was just changed. If this was not you, contact us immediately.',
  };
};

module.exports = {
  orderConfirmation,
  orderShipped,
  orderDelivered,
  orderCancelled,
  contactAcknowledgement,
  contactAdminNotification,
  passwordChanged,
};