'use server';

/**
 * Placeholder Server Action for Email Notifications
 * For the MVP, we assume integration with Resend or Nodemailer.
 */

export async function sendHostNotificationEmail(hostEmail: string, visitorName: string) {
  try {
    console.log(`[EMAIL MOCK] Sending notification to ${hostEmail}...`);
    console.log(`[EMAIL MOCK] Subject: Your visitor ${visitorName} has arrived!`);
    
    // Example Resend Integration
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'visits@yourdomain.com',
      to: hostEmail,
      subject: `Your visitor ${visitorName} has arrived`,
      html: `<p>Please come to the reception to greet <strong>${visitorName}</strong>.</p>`
    });
    */
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export async function sendVisitorConfirmationEmail(visitorEmail: string, visitorName: string) {
  try {
    if (!visitorEmail) return { success: false, skipped: true };
    console.log(`[EMAIL MOCK] Sending confirmation to visitor: ${visitorEmail}...`);
    console.log(`[EMAIL MOCK] Subject: Welcome to the Organization, ${visitorName}!`);
    console.log(`[EMAIL MOCK] Body: Thank you for checking in. Your NDA and visit details have been successfully recorded.`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send visitor email:', error);
    return { success: false, error: 'Failed to send visitor email' };
  }
}

/**
 * Microsoft 365 Graph API Integration Mock
 * Synchronizes the `hosts` table from Azure AD
 */

export async function syncHostsFromMicrosoft365(tenantId: string) {
  console.log(`[GRAPH API MOCK] Syncing users from Entra ID for tenant ${tenantId}...`);
  // Real implementation requires:
  // 1. Client Credentials flow to get access token for Graph API
  // 2. Fetching https://graph.microsoft.com/v1.0/users?$select=displayName,userPrincipalName,jobTitle
  // 3. Upserting into Supabase `hosts` table where org_id = tenantId.

  return { success: true, count: 154 };
}
