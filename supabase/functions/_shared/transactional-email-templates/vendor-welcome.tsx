import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'UMCIMBI'
const WHATSAPP_URL = 'https://chat.whatsapp.com/DNgVHc9z8bn4g2PlbMi8T1?mode=gi_t'

interface VendorWelcomeProps {
  name?: string
  businessName?: string
}

const VendorWelcomeEmail = ({ name, businessName }: VendorWelcomeProps) => {
  const greeting = name ? `Sawubona ${name},` : 'Sawubona,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to UMCIMBI — and an invite to our vendor community</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to UMCIMBI</Heading>

          <Text style={text}>{greeting}</Text>

          <Text style={text}>
            Thank you for joining UMCIMBI{businessName ? ` with ${businessName}` : ''}. We are
            excited to have your business on board.
          </Text>

          <Text style={text}>
            Once your profile has been reviewed, families planning traditional ceremonies will be
            able to find you, message you and request quotations directly through the platform.
          </Text>

          <Section style={roleBlock}>
            <Text style={roleLabel}>Vendor community</Text>
            <Text style={roleBody}>
              We run an optional UMCIMBI Vendor Community WhatsApp group, where vendors learn from
              each other, ask questions, give feedback about the platform and celebrate successes.
              Joining is optional, and please note that other members can see your number.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={WHATSAPP_URL} style={button}>
              Join the WhatsApp group →
            </Button>
          </Section>

          <Text style={text}>Any questions? Just reply to this email.</Text>

          <Text style={signature}>Andile</Text>
          <Text style={signatureSub}>{SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: VendorWelcomeEmail,
  subject: 'Welcome to UMCIMBI',
  displayName: 'Vendor welcome',
  previewData: { name: 'Thandi', businessName: 'Thandi Catering' },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px',
}

const h1: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: '28px',
  fontWeight: 600,
  color: '#3F2A56',
  margin: '0 0 24px',
  lineHeight: 1.2,
}

const text: React.CSSProperties = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: 1.65,
  margin: '0 0 16px',
}

const roleBlock: React.CSSProperties = {
  background: '#F7F4EF',
  borderLeft: '3px solid #B85C38',
  borderRadius: '6px',
  padding: '14px 16px',
  margin: '14px 0',
}

const roleLabel: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: '13px',
  fontWeight: 600,
  color: '#B85C38',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 0 6px',
}

const roleBody: React.CSSProperties = {
  fontSize: '14px',
  color: '#3a3a3a',
  lineHeight: 1.6,
  margin: 0,
}

const button: React.CSSProperties = {
  backgroundColor: '#3F2A56',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}

const signature: React.CSSProperties = {
  fontSize: '15px',
  color: '#3a3a3a',
  margin: '24px 0 0',
}

const signatureSub: React.CSSProperties = {
  fontSize: '13px',
  color: '#888',
  margin: '2px 0 0',
}
