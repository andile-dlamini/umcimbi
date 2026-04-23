/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="UMCIMBI" width="264" height="68" style={logo} />
        <Heading style={h1}>Confirm it’s you</Heading>
        <Text style={text}>Use the code below to confirm your identity and continue securely.</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#172033',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#687386', margin: '30px 0 0' }
