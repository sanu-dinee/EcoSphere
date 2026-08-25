import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminSettings.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ecoLogo from "../assets/ECO.png";
import AdminPasswordRequests from "./AdminPasswordRequests";

export default function AdminSettings() {
  const [auditLog, setAuditLog] = useState([]);
  const [systemInfo, setSystemInfo] = useState({
    users: 0,
    bins: 0,
    councils: 0,
  });

  /* ================= AUDIT LOG (UI ONLY) ================= */

  const logAction = (action) => {
    setAuditLog((prev) => [
      {
        action,
        time: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  /* ================= SMART BIN CONTROLS ================= */

  const markAllBinsEmpty = async () => {
    if (!window.confirm("Mark ALL full bins as EMPTY?")) return;

    await supabase
      .from("smartbin")
      .update({ status: "empty" })
      .eq("status", "full");

    logAction("Marked all full bins as EMPTY");
  };

  const hideInactiveBins = async () => {
    if (!window.confirm("Hide ALL empty bins?")) return;

    await supabase
      .from("smartbin")
      .update({ status: "hidden" })
      .eq("status", "empty");

    logAction("Hid all inactive (empty) bins");
  };

  const unhideAllBins = async () => {
    if (!window.confirm("Unhide ALL hidden bins?")) return;

    await supabase
      .from("smartbin")
      .update({ status: "empty" })
      .eq("status", "hidden");

    logAction("Unhid all hidden bins");
  };

  /* ================= ANALYTICS CONTROLS ================= */

  const excludeIllegalReports = async () => {
    await supabase
      .from("illegalwastereport")
      .update({ status: "excluded" })
      .neq("status", "rejected");

    logAction("Excluded illegal waste reports from analytics");
  };

  const includeIllegalReports = async () => {
    await supabase
      .from("illegalwastereport")
      .update({ status: "pending" })
      .eq("status", "excluded");

    logAction("Re-included illegal waste reports into analytics");
  };

  /* ================= COUNCIL OPERATIONS ================= */

  const disableCouncilRoutes = async () => {
    if (!window.confirm("Disable ALL council operational routes?")) return;

    await supabase.from("council_routes").update({ radius_km: 0 });

    logAction("Disabled all council operational routes");
  };

  const restoreCouncilRoutes = async () => {
    await supabase.from("council_routes").update({ radius_km: 5 });

    logAction("Restored council operational routes to default radius");
  };

  /* ================= SYSTEM INFO ================= */

  useEffect(() => {
    const loadSystemInfo = async () => {
      const [
        { count: users },
        { count: bins },
        { count: councils },
        { count: admins },
        { count: recyclecenters },
        { count: partneredstores },
        { count: campaignnotice },
        { count: councilroutes },
        { count: garbagecollectors },
        { count: discountcodes },
        { count: treescompleted },
        { count: treesongoing },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("smartbin").select("*", { count: "exact", head: true }),
        supabase.from("council").select("*", { count: "exact", head: true }),
        supabase.from("admin").select("*", { count: "exact", head: true }),
        supabase
          .from("recyclecenter")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("partnerstore")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("campaignnotice")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("council_routes")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("garbagecollector")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("discountcodes")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("treecompleted")
          .select("*", { count: "exact", head: true }),
        supabase.from("treestatus").select("*", { count: "exact", head: true }),
      ]);

      setSystemInfo({
        users,
        bins,
        councils,
        admins,
        recyclecenters,
        partneredstores,
        campaignnotice,
        councilroutes,
        garbagecollectors,
        discountcodes,
        treescompleted,
        treesongoing,
      });
    };

    loadSystemInfo();
  }, []);
  const generateAdminReport = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    /* ===== HEADER ===== */
    doc.setFontSize(18);
    doc.text("EcoSphere – Admin System Report", 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);

    /* ===== OPTIONAL LOGO ===== */

    doc.addImage(ecoLogo, "PNG", pageWidth - 40, 10, 25, 25);

    /* ===== SYSTEM INFO TABLE ===== */
    autoTable(doc, {
      startY: 35,
      head: [["System Metric", "Value"]],
      body: [
        ["Total Users", systemInfo.users],
        ["Total Smart Bins", systemInfo.bins],
        ["Total Councils", systemInfo.councils],
        ["Total Admins", systemInfo.admins],
        ["Recycle Centers", systemInfo.recyclecenters],
        ["Partnered Stores", systemInfo.partneredstores],
        ["Campaign Notices", systemInfo.campaignnotice],
        ["Council Routes", systemInfo.councilroutes],
        ["Garbage Collectors", systemInfo.garbagecollectors],
        ["Discount Codes", systemInfo.discountcodes],
        ["Trees Planted (Completed)", systemInfo.treescompleted],
        ["Trees Planted (Ongoing)", systemInfo.treesongoing],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
      },
    });

    /* ===== AUDIT LOG ===== */
    const auditStartY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("Audit Log (Session)", 14, auditStartY);

    if (auditLog.length === 0) {
      doc.setFontSize(10);
      doc.text("No actions recorded in this session.", 14, auditStartY + 8);
    } else {
      autoTable(doc, {
        startY: auditStartY + 12,
        head: [["Time", "Action"]],
        body: auditLog.map((log) => [log.time, log.action]),
        theme: "striped",
        headStyles: {
          fillColor: [76, 175, 80],
          textColor: 255,
        },
      });
    }

    /* ===== FOOTER (ALL PAGES) ===== */
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(
        "EcoSphere Pvt. Ltd. © " + new Date().getFullYear(),
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
    }

    /* ===== SAVE ===== */
    doc.save(
      `EcoSphere_Admin_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };

  return (
    <div className="admin-settings-page">
      <h2>Admin Settings</h2>

      {/* ===== Smart Bin Controls ===== */}
      <section className="settings-section">
        <h3>Smart Bin Controls</h3>
        <div className="settings-actions">
          <button onClick={markAllBinsEmpty}>Mark All Full Bins Empty</button>
          <button onClick={hideInactiveBins}>Hide Inactive Bins</button>
          <button onClick={unhideAllBins}>Unhide All Bins</button>
        </div>
      </section>

      {/* ===== Analytics Controls ===== 
      <section className="settings-section">
        <h3>Analytics Controls</h3>
        <div className="settings-actions">
          <button onClick={excludeIllegalReports}>
            Exclude Illegal Reports
          </button>
          <button onClick={includeIllegalReports}>
            Include Illegal Reports
          </button>
        </div>
      </section>
      */}
      <AdminPasswordRequests />
      {/* ===== Council Operations ===== */}
      <section className="settings-section">
        <h3>Council Operations</h3>
        <div className="settings-actions">
          <button onClick={disableCouncilRoutes}>
            Disable All Council Routes
          </button>
          <button onClick={restoreCouncilRoutes}>Restore Council Routes</button>
        </div>
      </section>

      {/* ===== System Info ===== */}
      <section className="settings-section info">
        <h3>System Information</h3>
        <button className="export-btn" onClick={generateAdminReport}>
          Export Full System Report (PDF)
        </button>

        <ul>
          <li>Total Users: {systemInfo.users}</li>
          <li>Total Smart Bins: {systemInfo.bins}</li>
          <li>Total Councils: {systemInfo.councils}</li>
          <li>Total Admins: {systemInfo.admins}</li>
          <li>Total Recycle Centers: {systemInfo.recyclecenters}</li>
          <li>Total Partnered Stores: {systemInfo.partneredstores}</li>
          <li>Total Campaign Notices: {systemInfo.campaignnotice}</li>
          <li>Total Council Routes: {systemInfo.councilroutes}</li>
          <li>Total Garbage Collectors: {systemInfo.garbagecollectors}</li>
          <li>Total Discount Codes: {systemInfo.discountcodes}</li>
          <li>Total Trees Planted (Completed): {systemInfo.treescompleted}</li>
          <li>Total Trees Planted (Ongoing): {systemInfo.treesongoing}</li>
        </ul>
      </section>

      {/* ===== Audit Log (UI ONLY) ===== */}
      <section className="settings-section audit">
        <h3>Audit Log (Session Only)</h3>

        {auditLog.length === 0 && (
          <p className="empty-log">No actions performed yet.</p>
        )}

        <ul className="audit-log">
          {auditLog.map((log, i) => (
            <li key={i}>
              <span className="time">{log.time}</span>
              <span className="action">{log.action}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
