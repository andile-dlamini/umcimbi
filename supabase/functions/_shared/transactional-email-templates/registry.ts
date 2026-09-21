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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'launch-announcement': launchAnnouncement,
  'job-application-received': jobApplicationReceived,
}
