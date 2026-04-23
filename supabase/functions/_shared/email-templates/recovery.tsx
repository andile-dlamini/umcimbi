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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} alt="UMCIMBI" width="132" height="32" style={logo} />
        <Heading style={h1}>Reset your UMCIMBI password</Heading>
        <Text style={text}>
          Choose a new password and keep your ceremony planning account secure.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const logoUrl = 'https://pnnckeqrzjglcwkyzzxg.supabase.co/storage/v1/object/public/email-assets/umcimbi-logo.png'
const logo = { margin: '0 0 28px' }
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
