/**
 * Form Type Definitions
 * Centralized form type constants used across the application
 */

export const FORM_TYPES = {
  CONTACT_US: 'contact_us',
  QUOTE_REQUEST: 'quote_request',
  PARTNERSHIP_INQUIRY: 'partnership_inquiry',
} as const;

export const VALID_FORM_TYPES = [
  FORM_TYPES.CONTACT_US,
  FORM_TYPES.QUOTE_REQUEST,
  FORM_TYPES.PARTNERSHIP_INQUIRY,
] as const;

export type FormType = typeof VALID_FORM_TYPES[number];

/**
 * Lead score mapping based on form type
 * Used to calculate lead priority for CRM
 */
export const LEAD_SCORE_MAP: Record<FormType, number> = {
  [FORM_TYPES.CONTACT_US]: 50,
  [FORM_TYPES.QUOTE_REQUEST]: 80,
  [FORM_TYPES.PARTNERSHIP_INQUIRY]: 70,
};

/**
 * Form type display labels
 * Used for UI and notifications
 */
export const FORM_TYPE_LABELS: Record<FormType, string> = {
  [FORM_TYPES.CONTACT_US]: 'Contact Us',
  [FORM_TYPES.QUOTE_REQUEST]: 'Quote Request',
  [FORM_TYPES.PARTNERSHIP_INQUIRY]: 'Partnership Inquiry',
};

/**
 * Get lead type for Lead model based on form type
 */
export const getLeadTypeForFormType = (formType: FormType): 'CONTACT_US' | 'QUOTE_REQUEST' | 'PARTNERSHIP_INQUIRY' => {
  switch (formType) {
    case FORM_TYPES.QUOTE_REQUEST:
      return 'QUOTE_REQUEST';
    case FORM_TYPES.PARTNERSHIP_INQUIRY:
      return 'PARTNERSHIP_INQUIRY';
    case FORM_TYPES.CONTACT_US:
    default:
      return 'CONTACT_US';
  }
};

/**
 * Get notification priority based on lead score
 */
export const getNotificationPriority = (score: number): string => {
  return score > 70 ? 'HIGH' : 'NORMAL';
};
