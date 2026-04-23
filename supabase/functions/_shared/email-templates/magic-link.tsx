/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="UMCIMBI" width="264" height="68" style={logo} />
        <Heading style={h1}>Your UMCIMBI sign-in link</Heading>
        <Text style={text}>
          Use this secure link to return to your UMCIMBI planning space. It will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Sign In
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const logoUrl = 'https://pnnckeqrzjglcwkyzzxg.supabase.co/storage/v1/object/public/email-assets/umcimbi-logo-email-white.png'
const logo = { backgroundColor: '#183d8b', borderRadius: '16px', display: 'block', margin: '0 0 28px', objectFit: 'contain' as const, padding: '12px 16px' }
const main = { backgroundColor: '#ffffff', fontFamily: 'Nunito, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 28px', border: '1px solid #e2e4ea', borderRadius: '16px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#172033',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#687386',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#183d8b',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '16px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#687386', margin: '30px 0 0' }
