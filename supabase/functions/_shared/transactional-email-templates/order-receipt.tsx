/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Afrivogue Pulse"
const LOGO_URL = "https://mafitpqnezbkjmtaqcjq.supabase.co/storage/v1/object/public/email-assets/afrivogue-logo.png"

interface OrderReceiptProps {
  orderNumber?: string
  total?: string
  items?: string
}

const OrderReceiptEmail = ({ orderNumber, total, items }: OrderReceiptProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} order confirmation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="160" height="40" style={logo} />
        <Hr style={divider} />
        <Heading style={h1}>Order Confirmed</Heading>
        <Text style={text}>
          Thank you for your purchase! Your order has been received and is being processed.
        </Text>
        {orderNumber && (
          <Section style={detailSection}>
            <Text style={detailLabel}>Order Number</Text>
            <Text style={detailValue}>#{orderNumber}</Text>
          </Section>
        )}
        {items && (
          <Section style={detailSection}>
            <Text style={detailLabel}>Items</Text>
            <Text style={detailValue}>{items}</Text>
          </Section>
        )}
        {total && (
          <Section style={detailSection}>
            <Text style={detailLabel}>Total</Text>
            <Text style={detailValue}>${total}</Text>
          </Section>
        )}
        <Hr style={divider} />
        <Text style={text}>
          We'll send you updates as your order progresses. If you have any questions, feel free to reach out.
        </Text>
        <Text style={footer}>Thank you for shopping with {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderReceiptEmail,
  subject: (data: Record<string, any>) =>
    data.orderNumber
      ? `Order #${data.orderNumber} confirmed`
      : 'Your order has been confirmed',
  displayName: 'Order receipt',
  previewData: { orderNumber: 'A7B3C9', total: '89.00', items: 'Ankara Print Tote x1, Gold Cuff x1' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { objectFit: 'contain' as const, margin: '0 0 8px' }
const divider = { borderColor: '#E8E0D4', margin: '16px 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1A1710', margin: '0 0 20px', fontFamily: "'Playfair Display', Georgia, serif" }
const text = { fontSize: '15px', color: '#6B6158', lineHeight: '1.6', margin: '0 0 24px' }
const detailSection = { margin: '0 0 8px' }
const detailLabel = { fontSize: '12px', color: '#998F85', margin: '0', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const detailValue = { fontSize: '16px', color: '#1A1710', fontWeight: 'bold' as const, margin: '2px 0 12px' }
const footer = { fontSize: '12px', color: '#998F85', margin: '32px 0 0' }
