/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Afrivogue"
const SITE_URL = "https://afrivogue.com"
const LOGO_URL = "https://mafitpqnezbkjmtaqcjq.supabase.co/storage/v1/object/public/email-assets/afrivogue-logo.png"

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your cultural pulse starts here</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="160" height="40" style={logo} />
        <Hr style={divider} />
        <Heading style={h1}>
          {name ? `Welcome, ${name}!` : 'Welcome to Afrivogue Pulse!'}
        </Heading>
        <Text style={text}>
          You're now part of a community that celebrates African culture, fashion, art, and design through a bold editorial lens.
        </Text>
        <Text style={text}>
          Explore trending stories, curated moodboards, cultural forecasts, and exclusive editorials — all in one place.
        </Text>
        <Button style={button} href={SITE_URL}>
          Start Exploring
        </Button>
        <Text style={footer}>
          We're glad to have you. — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Afrivogue Pulse',
  displayName: 'Welcome email',
  previewData: { name: 'Amara' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { objectFit: 'contain' as const, margin: '0 0 8px' }
const divider = { borderColor: '#E8E0D4', margin: '16px 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1A1710', margin: '0 0 20px', fontFamily: "'Playfair Display', Georgia, serif" }
const text = { fontSize: '15px', color: '#6B6158', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#D4A243', color: '#1A1710', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#998F85', margin: '32px 0 0' }
