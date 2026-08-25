import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./evaluation.css";

export default function AdminCouncilAnalytics() {
  const [councils, setCouncils] = useState([]);
  const [selectedCouncil, setSelectedCouncil] = useState("ALL");
  const [metric, setMetric] = useState("submission");
  const [chartData, setChartData] = useState([]);

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const WASTE_CO2 = { paper: 1, plastic: 3, glass: 0.5, wood: 2, organic: 0.2 };
  const REPORT_CO2 = 2;

  /* ================= FETCH COUNCILS ================= */
  useEffect(() => {
    const fetchCouncils = async () => {
      const { data } = await supabase
        .from("council")
        .select("councilid, councilname");

      setCouncils(data || []);
    };
    fetchCouncils();
  }, []);

  /* ================= FETCH ANALYTICS ================= */
  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: submissions } = await supabase
        .from("ecopoints")
        .select("*");
      const { data: reports } = await supabase
        .from("illegalwastereport")
        .select("*")
        .neq("status", "rejected");
      const { data: trees } = await supabase
        .from("treecompleted")
        .select("*")
        .gte("treelevel", 99.9);

      let aggregated = {};

      if (metric === "submission") {
        submissions?.forEach((s) => {
          const label = MONTHS[new Date(s.datepoint).getMonth()];
          aggregated[label] = (aggregated[label] || 0) + 1;
        });
      }

      if (metric === "illegal") {
        reports?.forEach((r) => {
          const label = MONTHS[new Date(r.dateposted).getMonth()];
          aggregated[label] = (aggregated[label] || 0) + 1;
        });
      }

      if (metric === "footprint") {
        submissions?.forEach((s) => {
          const label = MONTHS[new Date(s.datepoint).getMonth()];
          aggregated[label] =
            (aggregated[label] || 0) + (WASTE_CO2[s.wastetype] || 0);
        });

        reports?.forEach((r) => {
          const label = MONTHS[new Date(r.dateposted).getMonth()];
          aggregated[label] = (aggregated[label] || 0) + REPORT_CO2;
        });
      }

      if (metric === "trees") {
        trees?.forEach((t) => {
          const label = MONTHS[new Date(t.completeddate).getMonth()];
          aggregated[label] = (aggregated[label] || 0) + 1;
        });
      }

      setChartData(
        MONTHS.map((m) => ({
          label: m,
          count: aggregated[m] || 0,
        })),
      );
    };

    fetchAnalytics();
  }, [metric, selectedCouncil]);

  const hasData = chartData.some((d) => d.count > 0);

  /* ================= PDF EXPORT ================= */
  const generateReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Admin Council Analytics Report", 14, 20);

    autoTable(doc, {
      head: [["Month", "Value"]],
      body: chartData.map((d) => [d.label, d.count]),
      startY: 30,
    });

    doc.save("Council_Analytics_Report.pdf");
  };

  return (
    <div className="admin-analytics">
      <h2>National Council Analytics</h2>

      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Council</label>
          <select
            value={selectedCouncil}
            onChange={(e) => setSelectedCouncil(e.target.value)}
          >
            <option value="ALL">All Councils</option>
            {councils.map((c) => (
              <option key={c.councilid} value={c.councilid}>
                {c.councilname}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Metric</label>
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="submission">Garbage Submissions</option>
            <option value="illegal">Illegal Dump Reports</option>
            <option value="footprint">CO₂ Footprint</option>
            <option value="trees">Trees Planted</option>
          </select>
        </div>

        <button className="report-btn" onClick={generateReport}>
          Generate Report
        </button>
      </div>

      {!hasData && (
        <p className="no-data-msg">
          No analytics data available for the selected council.
        </p>
      )}

      <BarChart width={900} height={450} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#2e7d32" />
      </BarChart>
    </div>
  );
}
