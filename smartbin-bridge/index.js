import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

/* --------------------
   SUPABASE
-------------------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* --------------------
   EXPRESS
-------------------- */
const app = express();

app.use(
  cors({
    origin: "*", // ngrok + vercel safe
  }),
);

app.use(express.json());

/* --------------------
   SESSION CONFIG
-------------------- */
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const WATCHDOG_INTERVAL_MS = 10 * 1000;

/* --------------------
   ACTIVE SESSION (single-bin prototype)
-------------------- */
let ACTIVE_SESSION = {
  citizenId: null,
  binId: null,
  startedAt: null,
  lastActivityAt: null,
};

/* --------------------
   HEALTH CHECK
-------------------- */
app.get("/health", (_, res) => {
  res.status(200).send("✅ SmartBin bridge online");
});

/* --------------------
   SESSION STATUS (FRONTEND + ESP32)
   ⚠️ MUST MATCH OLD PROTOTYPE
-------------------- */
app.get("/session-status/:binId", (req, res) => {
  const binId = Number(req.params.binId);

  if (ACTIVE_SESSION.citizenId && ACTIVE_SESSION.binId === binId) {
    return res.json({
      active: true,
      session: ACTIVE_SESSION,
    });
  }

  res.json({ active: false });
});

/* --------------------
   START SESSION (QR / FRONTEND)
-------------------- */
app.post("/start-session", (req, res) => {
  const { citizenId, binId } = req.body;

  if (!citizenId || !binId) {
    return res.status(400).json({
      success: false,
      error: "Missing session data",
    });
  }

  const numericBinId = Number(binId);

  // ✅ Idempotent: same user + same bin
  if (
    ACTIVE_SESSION.citizenId === citizenId &&
    ACTIVE_SESSION.binId === numericBinId
  ) {
    return res.json({
      success: true,
      session: ACTIVE_SESSION,
    });
  }

  // ❌ Bin already in use by another user
  if (
    ACTIVE_SESSION.citizenId &&
    ACTIVE_SESSION.binId === numericBinId &&
    ACTIVE_SESSION.citizenId !== citizenId
  ) {
    return res.status(409).json({
      success: false,
      error: "Bin already in use",
    });
  }

  // ✅ Start new session
  ACTIVE_SESSION = {
    citizenId,
    binId: numericBinId,
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  console.log("🟢 Session started:", ACTIVE_SESSION);

  res.json({
    success: true,
    session: ACTIVE_SESSION,
  });
});

/* --------------------
   ITEM ADDED (ESP32 → IR1 via HTTP)
-------------------- */
app.post("/item-added", async (req, res) => {
  const { binId } = req.body;
  const numericBinId = Number(binId);

  if (!ACTIVE_SESSION.citizenId || ACTIVE_SESSION.binId !== numericBinId) {
    return res.status(409).json({
      success: false,
      error: "No active session",
    });
  }

  ACTIVE_SESSION.lastActivityAt = Date.now();

  console.log("♻ Item added:", ACTIVE_SESSION);

  // ✅ Same RPC as old prototype
  const { error } = await supabase.rpc("process_bin_item", {
    p_citizen: ACTIVE_SESSION.citizenId,
    p_bin: numericBinId,
  });

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

/* --------------------
   END SESSION (FRONTEND BUTTON)
-------------------- */
app.post("/end-session", (_, res) => {
  if (ACTIVE_SESSION.citizenId) {
    console.log("🔴 Session ended:", ACTIVE_SESSION);
  }

  ACTIVE_SESSION = {
    citizenId: null,
    binId: null,
    startedAt: null,
    lastActivityAt: null,
  };

  res.json({ success: true });
});

/* --------------------
   SESSION WATCHDOG
-------------------- */
setInterval(() => {
  if (!ACTIVE_SESSION.citizenId) return;

  const inactiveFor = Date.now() - ACTIVE_SESSION.lastActivityAt;

  if (inactiveFor > SESSION_TIMEOUT_MS) {
    console.log("⏱ Session expired:", ACTIVE_SESSION);

    ACTIVE_SESSION = {
      citizenId: null,
      binId: null,
      startedAt: null,
      lastActivityAt: null,
    };
  }
}, WATCHDOG_INTERVAL_MS);

/* --------------------
   START SERVER
-------------------- */
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SmartBin bridge running on port ${PORT}`);
});
