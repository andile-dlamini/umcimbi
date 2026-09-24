/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as launchAnnouncement } from './launch-announcement.tsx'
import { template as jobApplicationReceived } from './job-application-received.tsx'
import { template as jobApplicationDeclined } from './job-application-declined.tsx'
import { template as vendorWelcome } from './vendor-welcome.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'launch-announcement': launchAnnouncement,
  'job-application-received': jobApplicationReceived,
  'job-application-declined': jobApplicationDeclined,
  'vendor-welcome': vendorWelcome,
}
