/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Afrivogue"

interface ContactConfirmationProps {
  name?: string
  subject?: string
}

const ContactConfirmationEmail = ({ name, subject }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for reaching out to {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{SITE_NAME}</Text>
        <Hr style={divider} />
        <Heading style={h1}>
          {name ? `Thank you, ${name}!` : 'Thank you for reaching out!'}
        </Heading>
        <Text style={text}>
          We have received your message{subject ? ` regarding "${subject}"` : ''} and will get back to you as soon as possible.
        </Text>
        <Text style={text}>
          In the meantime, explore the latest cultural trends and editorials on our platform.
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Thanks for contacting Afrivogue',
  displayName: 'Contact form confirmation',
  previewData: { name: 'Jane', subject: 'Collaboration inquiry' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '18px', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 'bold' as const, color: '#D4A243', margin: '0 0 8px', letterSpacing: '0.5px' }
const divider = { borderColor: '#E8E0D4', margin: '16px 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1A1710', margin: '0 0 20px', fontFamily: "'Playfair Display', Georgia, serif" }
const text = { fontSize: '15px', color: '#6B6158', lineHeight: '1.6', margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#998F85', margin: '32px 0 0' }
