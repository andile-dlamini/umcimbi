import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'UMCIMBI'

interface JobApplicationReceivedProps {
  name?: string
}

const JobApplicationReceivedEmail = ({ name }: JobApplicationReceivedProps) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We've received your UMCIMBI application</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks for applying</Heading>

          <Text style={text}>{greeting}</Text>

          <Text style={text}>
            We've received your application for the Vendor Growth Manager role at UMCIMBI.
            We're reviewing it now and will be in touch by email either way — you don't need
            to follow up.
          </Text>

          <Text style={text}>Thanks for your interest in UMCIMBI.</Text>

          <Text style={signature}>Andile</Text>
          <Text style={signatureSub}>{SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: JobApplicationReceivedEmail,
  subject: "We've received your UMCIMBI application",
  displayName: 'Job application received',
  previewData: { name: 'Thandi' },
} satisfies TemplateEntry

// Styles mirror launch-announcement.tsx to keep emails visually consistent
const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
const signature: React.CSSProperties = { fontSize: '15px', color: '#3a3a3a', margin: '24px 0 0' }
const signatureSub: React.CSSProperties = { fontSize: '13px', color: '#8a8a8a', margin: '2px 0 0' }
