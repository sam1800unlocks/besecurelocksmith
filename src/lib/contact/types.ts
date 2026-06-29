export interface Submission {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactEnv {
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  SES_FROM?: string;
  CONTACT_EMAIL_TO?: string; // comma-separated; first = To, rest = CC
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
  CONTACT_SMS_TO?: string; // comma-separated numbers
  TURNSTILE_SECRET?: string;
  SHEET_WEBHOOK_URL?: string;
  SHEET_WEBHOOK_SECRET?: string;
  CONTACT_DRY_RUN?: string;
}

export interface SinkResult { name: string; ok: boolean; error?: string }
