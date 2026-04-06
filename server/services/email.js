'use strict';
const nodemailer = require('nodemailer');
const db = require('../config/database');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Build HTML for welcome email
 */
function buildWelcomeEmail(data) {
  const name = data.name || 'Valued Customer';
  const siteUrl = process.env.SITE_URL || 'https://afrivogue.com';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #000; }
        .container { max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px; }
        .header { text-align: center; border-bottom: 3px solid #D4A853; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #D4A853; letter-spacing: 2px; }
        .content { color: #fff; line-height: 1.6; }
        .content h2 { color: #D4A853; font-size: 20px; margin-top: 0; }
        .btn { display: inline-block; background: #D4A853; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
        .unsubscribe { font-size: 11px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AfriVogue</div>
        </div>
        <div class="content">
          <h2>Welcome to AfriVogue, ${name}!</h2>
          <p>We're thrilled to have you join our community of African fashion enthusiasts and style pioneers.</p>
          <p>Explore our curated collections, discover emerging designers, and stay updated with the latest trends in African fashion.</p>
          <a href="${siteUrl}" class="btn">Explore AfriVogue</a>
          <p>If you have any questions, feel free to reach out to our team.</p>
          <p>Happy styling,<br>The AfriVogue Team</p>
        </div>
        <div class="footer">
          <p>AfriVogue | Celebrating African Fashion</p>
          <p class="unsubscribe">You're receiving this because you signed up for AfriVogue. <a href="${process.env.SITE_URL}/unsubscribe?token=${data.unsubscribeToken || ''}" style="color: #D4A853;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build HTML for order receipt email
 */
function buildOrderReceiptEmail(data) {
  const orderId = data.orderId || 'N/A';
  const items = data.items || [];
  const total = data.total || '0.00';
  const siteUrl = process.env.SITE_URL || 'https://afrivogue.com';

  const itemsHtml = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #333;">
      <td style="padding: 12px; color: #fff;">${item.name}</td>
      <td style="padding: 12px; color: #fff; text-align: right;">Qty: ${item.quantity}</td>
      <td style="padding: 12px; color: #D4A853; text-align: right;">$${parseFloat(item.price).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #000; }
        .container { max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px; }
        .header { text-align: center; border-bottom: 3px solid #D4A853; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #D4A853; letter-spacing: 2px; }
        .content { color: #fff; line-height: 1.6; }
        .content h2 { color: #D4A853; font-size: 20px; margin-top: 0; }
        .order-info { background: #111; padding: 15px; border-left: 3px solid #D4A853; margin: 20px 0; }
        .order-info p { margin: 5px 0; color: #ccc; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total-row { font-weight: bold; font-size: 18px; }
        .btn { display: inline-block; background: #D4A853; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
        .unsubscribe { font-size: 11px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AfriVogue</div>
        </div>
        <div class="content">
          <h2>Order Confirmation</h2>
          <div class="order-info">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <h3 style="color: #D4A853; font-size: 16px;">Order Details</h3>
          <table>
            <thead>
              <tr style="border-bottom: 2px solid #D4A853;">
                <th style="text-align: left; padding: 12px; color: #D4A853;">Item</th>
                <th style="text-align: right; padding: 12px; color: #D4A853;">Quantity</th>
                <th style="text-align: right; padding: 12px; color: #D4A853;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="text-align: right; padding: 12px 0; border-top: 2px solid #D4A853;">
            <p class="total-row" style="color: #D4A853; margin: 10px 0;">Total: $${parseFloat(total).toFixed(2)}</p>
          </div>
          <p>Thank you for your purchase! We're processing your order and will send you a shipping update soon.</p>
          <a href="${siteUrl}/orders/${orderId}" class="btn">View Order</a>
        </div>
        <div class="footer">
          <p>AfriVogue | Celebrating African Fashion</p>
          <p class="unsubscribe"><a href="${process.env.SITE_URL}/unsubscribe?token=${data.unsubscribeToken || ''}" style="color: #D4A853;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build HTML for contact confirmation email
 */
function buildContactConfirmationEmail(data) {
  const name = data.name || 'Valued Customer';
  const email = data.email || '';
  const siteUrl = process.env.SITE_URL || 'https://afrivogue.com';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #000; }
        .container { max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px; }
        .header { text-align: center; border-bottom: 3px solid #D4A853; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #D4A853; letter-spacing: 2px; }
        .content { color: #fff; line-height: 1.6; }
        .content h2 { color: #D4A853; font-size: 20px; margin-top: 0; }
        .btn { display: inline-block; background: #D4A853; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
        .unsubscribe { font-size: 11px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AfriVogue</div>
        </div>
        <div class="content">
          <h2>We Received Your Message, ${name}!</h2>
          <p>Thank you for reaching out to AfriVogue. We've received your message and will get back to you as soon as possible.</p>
          <p><strong>Confirmation Details:</strong></p>
          <ul>
            <li>Email: ${email}</li>
            <li>Received: ${new Date().toLocaleString()}</li>
          </ul>
          <p>Our team typically responds within 24 hours during business days. In the meantime, feel free to explore our latest collections.</p>
          <a href="${siteUrl}" class="btn">Back to AfriVogue</a>
          <p>Best regards,<br>The AfriVogue Team</p>
        </div>
        <div class="footer">
          <p>AfriVogue | Celebrating African Fashion</p>
          <p class="unsubscribe"><a href="${process.env.SITE_URL}/unsubscribe?token=${data.unsubscribeToken || ''}" style="color: #D4A853;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build HTML for newsletter email (uses provided subject and body_html)
 */
function buildNewsletterEmail(data) {
  const subject = data.subject || 'AfriVogue Newsletter';
  const bodyHtml = data.body_html || '<p>Check out the latest from AfriVogue!</p>';
  const siteUrl = process.env.SITE_URL || 'https://afrivogue.com';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #000; }
        .container { max-width: 600px; margin: 0 auto; background: #000; padding: 40px 20px; }
        .header { text-align: center; border-bottom: 3px solid #D4A853; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #D4A853; letter-spacing: 2px; }
        .content { color: #fff; line-height: 1.6; }
        .content h2 { color: #D4A853; font-size: 18px; margin-top: 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
        .unsubscribe { font-size: 11px; color: #666; }
        a { color: #D4A853; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">AfriVogue</div>
        </div>
        <div class="content">
          <h2>${subject}</h2>
          ${bodyHtml}
        </div>
        <div class="footer">
          <p>AfriVogue | Celebrating African Fashion</p>
          <p class="unsubscribe">You're receiving this because you're subscribed to AfriVogue newsletters. <a href="${process.env.SITE_URL}/unsubscribe?token=${data.unsubscribeToken || ''}">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send a raw email
 */
async function sendEmail({ to, subject, html, text, from }) {
  try {
    const fromAddress = from || `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send a template-based email
 */
async function sendTemplate(templateName, recipientEmail, data = {}) {
  try {
    let subject = '';
    let html = '';

    switch (templateName) {
      case 'welcome':
        subject = 'Welcome to AfriVogue!';
        html = buildWelcomeEmail(data);
        break;

      case 'order-receipt':
        subject = `Order Confirmation - #${data.orderId || 'N/A'}`;
        html = buildOrderReceiptEmail(data);
        break;

      case 'contact-confirmation':
        subject = 'We Received Your Message';
        html = buildContactConfirmationEmail(data);
        break;

      case 'newsletter':
        subject = data.subject || 'AfriVogue Newsletter';
        html = buildNewsletterEmail(data);
        break;

      default:
        throw new Error(`Unknown template: ${templateName}`);
    }

    return await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending template email:', error);
    throw error;
  }
}

/**
 * Send newsletter campaign to all pending subscribers
 */
async function sendNewsletterCampaign(campaignId) {
  try {
    // Get pending sends for this campaign
    const [pendingSends] = await db.query(
      'SELECT id, email FROM newsletter_sends WHERE campaign_id = ? AND status = ?',
      [campaignId, 'pending']
    );

    if (pendingSends.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    // Get campaign details
    const [campaigns] = await db.query(
      'SELECT subject, body_html FROM newsletter_campaigns WHERE id = ?',
      [campaignId]
    );

    if (campaigns.length === 0) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const campaign = campaigns[0];
    let sent = 0;
    let failed = 0;

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < pendingSends.length; i += batchSize) {
      const batch = pendingSends.slice(i, i + batchSize);

      for (const send of batch) {
        try {
          // Check if email is suppressed
          const [suppressed] = await db.query(
            'SELECT id FROM suppressed_emails WHERE email = ?',
            [send.email]
          );

          if (suppressed.length > 0) {
            // Mark as failed/skipped
            await db.query(
              'UPDATE newsletter_sends SET status = ? WHERE id = ?',
              ['skipped', send.id]
            );
            continue;
          }

          // Get unsubscribe token
          const [subscribers] = await db.query(
            'SELECT unsubscribe_token FROM newsletter_subscribers WHERE email = ?',
            [send.email]
          );

          const unsubscribeToken = subscribers[0]?.unsubscribe_token || '';

          // Send email
          await sendTemplate('newsletter', send.email, {
            subject: campaign.subject,
            body_html: campaign.body_html,
            unsubscribeToken,
          });

          // Mark as sent
          await db.query(
            'UPDATE newsletter_sends SET status = ? WHERE id = ?',
            ['sent', send.id]
          );

          sent++;
        } catch (error) {
          console.error(`Failed to send newsletter to ${send.email}:`, error);

          // Mark as failed
          await db.query(
            'UPDATE newsletter_sends SET status = ?, error_message = ? WHERE id = ?',
            ['failed', error.message, send.id]
          );

          failed++;
        }
      }

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < pendingSends.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Update campaign recipient count
    await db.query(
      'UPDATE newsletter_campaigns SET recipient_count = recipient_count + ? WHERE id = ?',
      [sent, campaignId]
    );

    return { success: true, sent, failed };
  } catch (error) {
    console.error('Error sending newsletter campaign:', error);
    throw error;
  }
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Error verifying SMTP connection:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendTemplate,
  sendNewsletterCampaign,
  verifyConnection,
};
