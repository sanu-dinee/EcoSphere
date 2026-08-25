import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    /* ===== 1️⃣ GET PASSWORD CHANGE REQUEST ===== */
    const { data: request, error: reqError } =
      await supabaseAdmin
        .from("passwordChangeRequest")
        .select("changecode, status")
        .eq("id", requestId)
        .single();

    if (reqError || !request) {
      throw new Error("Password change request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Request already processed");
    }

    /* ===== 2️⃣ FIND USER BY CHANGE CODE ===== */
    const { data: user, error: userError } =
      await supabaseAdmin
        .from("users")
        .select("email")
        .eq("passwordchangecode", request.changecode)
        .single();

    if (userError || !user) {
      throw new Error("User not found for change code");
    }

    /* ===== 3️⃣ SEND RESET EMAIL ===== */
    const { error: resetError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: user.email,
        options: {
          redirectTo: "https://your-citizen-app.vercel.app/reset-password",
        },
      });

    if (resetError) {
      throw resetError;
    }

    /* ===== 4️⃣ UPDATE REQUEST STATUS ===== */
    await supabaseAdmin
      .from("passwordChangeRequest")
      .update({ status: "sent" })
      .eq("id", requestId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: corsHeaders },
    );
  }
});
