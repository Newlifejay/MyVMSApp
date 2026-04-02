"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendHostNotificationEmail, sendVisitorConfirmationEmail } from "./actions/notify";

// Helper to get current organization context
async function getOrgContext(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const { data: dbUser } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();
    
  if (!dbUser || !dbUser.org_id) throw new Error("No organization found for this user");
  return dbUser.org_id;
}

// ✅ CHECK-IN
export async function submitCheckIn(
  prevState: any,
  formData: FormData
) {
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const phone = formData.get("phone_number") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const hostId = formData.get("host_id") as string;
  const purpose = formData.get("purpose") as string;
  const ndaSigned = formData.get("nda_signed") === "on";
  const photoString = formData.get("photoString") as string;

  if (!firstName || !lastName || !phone || !hostId || !purpose || !company) {
    return { error: "Missing required fields", success: false };
  }

  const fullName = `${firstName} ${lastName}`;

  try {
    const supabase = createClient();
    const orgId = await getOrgContext(supabase);

    // Step 1: Check if visitor already exists in visitors table
    let visitorId;
    const { data: existingVisitor } = await supabase
      .from('visitors')
      .select('id, photo_url')
      .eq('org_id', orgId)
      .eq('phone', phone)
      .single();

    if (existingVisitor) {
      visitorId = existingVisitor.id;
      // Update missing details if needed
      await supabase.from('visitors').update({ 
        company, 
        nda_signed: ndaSigned,
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        photo_url: photoString || existingVisitor.photo_url
      }).eq('id', visitorId);
    } else {
      // Create new visitor
      const { data: newVisitor, error: vError } = await supabase
        .from('visitors')
        .insert([{
          org_id: orgId,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          company: company,
          nda_signed: ndaSigned,
          phone: phone,
          email: email || null,
          photo_url: photoString || null
        }])
        .select('id')
        .single();
        
      if (vError) throw vError;
      visitorId = newVisitor.id;
    }

    // Step 2: Check if active visit exists
    const { data: activeVisit } = await supabase
      .from('visits')
      .select('id')
      .eq('org_id', orgId)
      .eq('visitor_id', visitorId)
      .eq('status', 'active')
      .single();

    if (activeVisit) {
      return { error: "Visitor is already checked in", success: false };
    }

    // Step 3: Create the visit log
    const { error: visitError } = await supabase
      .from('visits')
      .insert([{
        org_id: orgId,
        visitor_id: visitorId,
        host_id: hostId,
        purpose: purpose,
        status: 'active'
      }]);

    if (visitError) throw visitError;

    // Step 4: Fire async simulated notifications (don't block UI for them)
    try {
      const { data: host } = await supabase.from('hosts').select('email').eq('id', hostId).single();
      if (host) sendHostNotificationEmail(host.email, fullName);
      if (email) sendVisitorConfirmationEmail(email, firstName);
    } catch(err) {
      console.warn("Silent notification failure:", err);
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Check-in Error:", err);
    return { error: err.message || "Failed to process check-in", success: false };
  }
}

// ✅ PRE-BOOK
export async function submitPreBook(
  prevState: any,
  formData: FormData
) {
  return { success: true };
}

// ✅ UPDATE SETTINGS
export async function updateOrganizationSettings(payload: { name: string, primaryColor: string, logoUrl: string }) {
  try {
    const supabase = createClient();
    const orgId = await getOrgContext(supabase);

    const { data: updatedOrg, error: updateErr } = await supabase
      .from('organizations')
      .update({
        name: payload.name,
        primary_color: payload.primaryColor,
        logo_url: payload.logoUrl
      })
      .eq('id', orgId)
      .select();

    if (updateErr) throw updateErr;
    if (!updatedOrg || updatedOrg.length === 0) {
      throw new Error("Supabase rejected the update silently! Ensure your database RLS policy has BOTH USING and WITH CHECK defined, or that you aren't somehow passing a different orgId from getOrgContext.");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/kiosk");

    return { success: true };
  } catch (err: any) {
    console.error("Settings Update Error:", err);
    return { error: err.message || "Failed to update settings", success: false };
  }
}