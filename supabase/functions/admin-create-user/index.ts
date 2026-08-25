import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

/* ================= CORS ================= */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let uuid: string | null = null;

  try {
    /* ================= PARSE PAYLOAD ================= */
    const payload = await req.json();

    const {
      userType,
      common,
      council,
      center,
      store,
      admin,
      passwordChangeCode,
    } = payload;

    const role = Number(userType);

    /* ================= BASIC VALIDATION ================= */
    if (!role || !common?.email || !common?.username) {
      return jsonError("Missing common user details", 400);
    }

    if (![1, 3, 4, 5].includes(role)) {
      return jsonError("Invalid user type", 400);
    }

    if (!common.password && !passwordChangeCode) {
      return jsonError(
        "Password or password change code required",
        400,
      );
    }

    /* ================= ROLE-SPECIFIC VALIDATION ================= */

    if (role === 1) {
      if (!admin?.role || !admin?.managedarea) {
        return jsonError("Incomplete admin data", 400);
      }
    }

    if (role === 3) {
      if (
        !council?.councilname ||
        !council?.division ||
        !council?.nearestCity ||
        council.latitude == null ||
        council.longitude == null
      ) {
        return jsonError("Incomplete council data", 400);
      }
    }

    if (role === 4) {
      if (
        !center?.centername ||
        !center?.nearestCity ||
        center.latitude == null ||
        center.longitude == null ||
        !Array.isArray(center.wastetypes) ||
        center.wastetypes.length === 0
      ) {
        return jsonError("Incomplete recycle center data", 400);
      }
    }

    if (role === 5) {
      if (
        !store?.storename ||
        !store?.nearestCity ||
        store.latitude == null ||
        store.longitude == null ||
        !store?.category
      ) {
        return jsonError("Incomplete partner store data", 400);
      }
    }

    /* ================= CREATE AUTH USER ================= */
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin
      .createUser({
        email: common.email,
        password: common.password || passwordChangeCode,
        email_confirm: true,
      });

    if (authError) throw new Error(authError.message);

    uuid = authData.user.id;

    /* ================= INSERT USERS TABLE ================= */
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: uuid,
      username: common.username,
      email: common.email,
      contactnumber: common.contactnum,
      usertype: role,
      passwordchangecode: passwordChangeCode,
    });

    if (userError) throw new Error(userError.message);

    /* ================= ROLE TABLE INSERTS ================= */

    if (role === 1) {
      await safeInsert(supabaseAdmin, "admin", {
        adminid: uuid,
        role: admin.role,
        managedarea: admin.managedarea,
      });
    }

    if (role === 3) {
      await safeInsert(supabaseAdmin, "council", {
        councilid: uuid,
        councilname: council.councilname,
        division: council.division,
        location: council.nearestCity,
        latitude: council.latitude,
        longitude: council.longitude,
      });
    }

    if (role === 4) {
      await safeInsert(supabaseAdmin, "recyclecenter", {
        centerid: uuid,
        centername: center.centername,
        location: center.nearestCity,
        latitude: center.latitude,
        longitude: center.longitude,
      });

      const wasteRows = center.wastetypes.map((w: string) => ({
        centerid: uuid,
        wastetype: w,
      }));

      await safeInsert(supabaseAdmin, "recyclecenterwaste", wasteRows);
    }

    if (role === 5) {
      await safeInsert(supabaseAdmin, "partnerstore", {
        storeid: uuid,
        storename: store.storename,
        location: store.nearestCity,
        latitude: store.latitude,
        longitude: store.longitude,
        category: store.category,
        loyalty: "Standard",
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    /* ================= FULL ROLLBACK ================= */
    if (uuid) {
      await supabaseAdmin.from("recyclecenterwaste").delete().eq(
        "centerid",
        uuid,
      );
      await supabaseAdmin.from("recyclecenter").delete().eq("centerid", uuid);
      await supabaseAdmin.from("partnerstore").delete().eq("storeid", uuid);
      await supabaseAdmin.from("council").delete().eq("councilid", uuid);
      await supabaseAdmin.from("admin").delete().eq("adminid", uuid);
      await supabaseAdmin.from("users").delete().eq("id", uuid);
      await supabaseAdmin.auth.admin.deleteUser(uuid);
    }
    const message = err instanceof Error
      ? err.message
      : "Unexpected server error";
    return jsonError(message, 500);
  }
});

/* ================= HELPERS ================= */

function jsonError(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: corsHeaders },
  );
}

async function safeInsert(client: any, table: string, data: any) {
  const { error } = await client.from(table).insert(data);
  if (error) throw new Error(`${table}: ${error.message}`);
}
