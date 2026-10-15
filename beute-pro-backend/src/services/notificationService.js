const emailService = require('./emailService');
const templates = require('../utils/emailTemplates');

/**
 * Send order confirmation to the customer.
 * Silent on failure — orders should never fail because email did.
 */
const sendOrderConfirmation = async (order) => {
  if (!order) return;
  try {
    const tpl = templates.orderConfirmation({ order, items: order.items || [] });
    await emailService.send({
      to: order.customer_email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.error('sendOrderConfirmation error:', err.message);
  }
};

const sendOrderShipped = async (order) => {
  if (!order) return;
  try {
    const tpl = templates.orderShipped({ order });
    await emailService.send({
      to: order.customer_email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.error('sendOrderShipped error:', err.message);
  }
};

const sendOrderDelivered = async (order) => {
  if (!order) return;
  try {
    const tpl = templates.orderDelivered({ order });
    await emailService.send({
      to: order.customer_email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.error('sendOrderDelivered error:', err.message);
  }
};

const sendOrderCancelled = async (order) => {
  if (!order) return;
  try {
    const tpl = templates.orderCancelled({ order });
    await emailService.send({
      to: order.customer_email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.error('sendOrderCancelled error:', err.message);
  }
};

/**
 * Contact form: acknowledge the sender + notify the admin.
 */
const sendContactAcknowledgement = async ({ name, email, message }) => {
  try {
    // 1. Auto-reply to the sender
    const ackTpl = templates.contactAcknowledgement({ name, message });
    await emailService.send({
      to: email,
      subject: ackTpl.subject,
      html: ackTpl.html,
      text: ackTpl.text,
      replyTo: process.env.EMAIL_ADMIN || undefined,
    });

    // 2. Notify admin
    const adminTo = process.env.EMAIL_ADMIN;
    if (adminTo) {
      const adminTpl = templates.contactAdminNotification({ name, email, message });
      await emailService.send({
        to: adminTo,
        subject: adminTpl.subject,
        html: adminTpl.html,
        text: adminTpl.text,
        replyTo: email,
      });
    }
  } catch (err) {
    console.error('sendContactAcknowledgement error:', err.message);
  }
};

const sendPasswordChanged = async (user) => {
  if (!user || !user.email) return;
  try {
    const tpl = templates.passwordChanged({ user });
    await emailService.send({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.error('sendPasswordChanged error:', err.message);
  }
};

/**
 * Map an order status to the right notification.
 * Fire-and-forget — callers should use `.then()` or `void` and not await
 * if they don't want email time to block the HTTP response.
 */
const notifyOrderStatusChange = (order, newStatus) => {
  switch (newStatus) {
    case 'shipped':   return sendOrderShipped(order);
    case 'delivered': return sendOrderDelivered(order);
    case 'cancelled': return sendOrderCancelled(order);
    default:          return Promise.resolve();
  }
};

module.exports = {
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderCancelled,
  sendContactAcknowledgement,
  sendPasswordChanged,
  notifyOrderStatusChange,
};