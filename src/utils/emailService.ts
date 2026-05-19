import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
  username?: string;
  type: 'reset' | 'newsletter';
}

export interface EmailSendResult {
  success: boolean;
  mode: 'real' | 'sandbox';
  error?: string;
}

/**
 * Fetch the EmailJS configuration from Firestore
 */
export async function getEmailConfig() {
  try {
    const configDoc = await getDoc(doc(db, 'config', 'emailjs'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      if (data.serviceId && data.templateId && data.publicKey) {
        return {
          serviceId: data.serviceId as string,
          templateId: data.templateId as string,
          publicKey: data.publicKey as string,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching EmailJS config:', error);
  }
  return null;
}

/**
 * Send an email using either EmailJS REST API (if configured) or a Firestore sandbox simulation.
 */
export async function sendEmail(params: EmailParams): Promise<EmailSendResult> {
  const { to, subject, body, username, type } = params;

  // 1. Fetch EmailJS config
  const config = await getEmailConfig();

  // 2. Attempt to send email
  if (config) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          template_params: {
            to_email: to,
            subject: subject,
            message: body,
            username: username || to.split('@')[0],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send email via EmailJS REST API');
      }

      // Save record in Firestore as sent
      await addDoc(collection(db, 'system_emails'), {
        to,
        subject,
        body,
        sentAt: serverTimestamp(),
        type,
        status: 'sent',
      });

      return { success: true, mode: 'real' };
    } catch (error: any) {
      console.error('EmailJS Send Error, falling back to Sandbox mode:', error);
      
      // Save record as failed-to-send but recorded in Firestore
      await addDoc(collection(db, 'system_emails'), {
        to,
        subject,
        body,
        sentAt: serverTimestamp(),
        type,
        status: 'sandbox_mode',
        error: error.message || 'EmailJS failed',
      });

      return { success: false, mode: 'sandbox', error: error.message };
    }
  } else {
    // 3. Sandbox / Demo Mode Fallback (Saves to Firestore system_emails collection)
    try {
      await addDoc(collection(db, 'system_emails'), {
        to,
        subject,
        body,
        sentAt: serverTimestamp(),
        type,
        status: 'sandbox_mode',
      });

      console.log(`[Email Sandbox] Email simulated to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);

      return { success: true, mode: 'sandbox' };
    } catch (error: any) {
      console.error('Failed to log simulated email in Firestore:', error);
      return { success: false, mode: 'sandbox', error: error.message };
    }
  }
}
