import crypto from 'crypto';

export interface LeadRecord {
  id: string;
  email: string;
  hashedEmail: string;
  maskedEmail: string;
  tier: 'pro_29k';
  featureInterest?: 'deep_interview' | 'ats_rewrite' | 'general';
  createdAt: number;
}

export const CV_TAILORED_INTERVIEW_KEY = 'airoastcv_custom_interview_questions';
export const AI_ROAST_CV_CONTEXT_KEY = 'ai_roast_cv_context';

export const leadStore: LeadRecord[] = [];
export const leadsBuffer = leadStore;
const MAX_LEADS_CAPACITY = 1000;

export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [localPart, domain] = parts;
  const maskedLocal =
    localPart.length > 2
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : `${localPart[0]}***`;
  return `${maskedLocal}@${domain}`;
}

export function saveFakeDoorLead(
  email: string,
  tier: 'pro_29k' = 'pro_29k',
  featureInterest: 'deep_interview' | 'ats_rewrite' | 'general' = 'general'
): { success: boolean; duplicated: boolean; lead: LeadRecord } {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedEmail = crypto.createHash('sha256').update(normalizedEmail).digest('hex');

  // Check duplicate
  const existing = leadStore.find((lead) => lead.hashedEmail === hashedEmail);
  if (existing) {
    return { success: true, duplicated: true, lead: existing };
  }

  const masked = maskEmail(normalizedEmail);

  // Evict oldest if buffer reaches capacity (FIFO ring buffer)
  if (leadStore.length >= MAX_LEADS_CAPACITY) {
    leadStore.shift();
  }

  const newLead: LeadRecord = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    hashedEmail,
    maskedEmail: masked,
    tier,
    featureInterest,
    createdAt: Date.now(),
  };

  leadStore.push(newLead);
  return { success: true, duplicated: false, lead: newLead };
}

export function getLeadsCount(): number {
  return leadStore.length;
}

export function clearLeads(): void {
  leadStore.length = 0;
}
