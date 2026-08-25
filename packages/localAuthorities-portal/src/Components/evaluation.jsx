import React, { useState, useEffect } from "react";
import "./evaluation.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import imageBase64 from "../assets/images/logo.png";

function Evaluate({ showGraph }) {
  const [selectT, setSelectT] = useState("submission");
  const [selectN, setSelectN] = useState("footprint");
  const [duration, setDuration] = useState("week");
  const [duration1, setDuration1] = useState("week");

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [selectedWeek1, setSelectedWeek1] = useState(1);
  const [selectedMonth1, setSelectedMonth1] = useState(new Date().getMonth());
  const [selectedYear1, setSelectedYear1] = useState(new Date().getFullYear());

  const [data, setData] = useState([]);
  const [councilName, setCouncilName] = useState("");
  const [treeData, setTreeData] = useState([]);
  const [councilRoutes, setCouncilRoutes] = useState([]);
  const [error, setError] = useState(null);

  const WASTE_TYPES = ["paper", "plastic", "glass", "wood", "organic"];

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
  const YEARS = [
    2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
  ];
  const WEEKS = [1, 2, 3, 4, 5];

  const WASTE_CO2 = { paper: 1, plastic: 3, glass: 0.5, wood: 2, organic: 0.2 };
  const REPORT_CO2 = 2;

  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchCouncilRoutes = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Council not logged in");

      const { data, error } = await supabase
        .from("council_routes")
        .select("*")
        .eq("council_id", session.user.id);

      if (error) throw error;
      setCouncilRoutes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.from("ecopoints").select(`
        datepoint,
        smartbin (
          latitude,
          longitude,
          wastetype
        )
      `);

      if (error) throw error;

      return data
        .filter((r) => r.smartbin)
        .map((r) => {
          const lat = parseFloat(r.smartbin.latitude);
          const lng = parseFloat(r.smartbin.longitude);

          const insideCouncil = councilRoutes.some(
            (route) =>
              getDistanceKm(lat, lng, route.center_lat, route.center_lng) <=
              route.radius_km,
          );

          if (!insideCouncil) return null;

          return {
            date: r.datepoint,
            wasteType: r.smartbin.wastetype?.toLowerCase(),
          };
        })
        .filter(Boolean);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchIllegalReports = async () => {
    const { data: reports, error } = await supabase
      .from("illegalwastereport")
      .select("*")
      .eq("status", "in-progress");

    if (error) throw error;

    return reports
      .map((r) => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);

        const insideCouncil = councilRoutes.some(
          (route) =>
            getDistanceKm(lat, lng, route.center_lat, route.center_lng) <=
            route.radius_km,
        );

        if (!insideCouncil) return null;

        return { date: r.dateposted };
      })
      .filter(Boolean);
  };
  useEffect(() => {
    if (!councilRoutes.length || data.length) return;

    const loadStatisticsData = async () => {
      const submissions = await fetchSubmissions();
      const illegalReports = await fetchIllegalReports();
      setData([...submissions, ...illegalReports]);
    };

    loadStatisticsData();
  }, [councilRoutes]);

  useEffect(() => {
    fetchCouncilRoutes();
  }, []);

  const fetchCouncilName = async () => {
    try {
      const {
        data: { session: councilSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!councilSession) throw new Error("Council not logged in");

      const councilId = councilSession.user.id;

      const { data: councilData, error: councilError } = await supabase
        .from("council")
        .select("councilname")
        .eq("councilid", councilId)
        .single();

      if (councilError) throw councilError;
      setCouncilName(councilData.councilname);
    } catch (err) {
      console.error("Error fetching council:", err.message);
      setError(err.message);
    }
  };

  const fetchTrees = async () => {
    try {
      const { data: trees, error } = await supabase
        .from("treecompleted")
        .select("completeddate, citizenno")
        .gte("treelevel", 99.9)
        .lte("treelevel", 100.1);

      if (error) throw error;

      const citizenIds = [...new Set(trees.map((t) => t.citizenno))];

      const { data: citizens } = await supabase
        .from("citizen")
        .select("citizenid, nearestcouncil")
        .in("citizenid", citizenIds);

      const councilMap = Object.fromEntries(
        citizens.map((c) => [c.citizenid, c.nearestcouncil]),
      );

      setTreeData(
        trees
          .filter((t) => councilMap[t.citizenno] === councilName)
          .map((t) => ({ dateT: t.completeddate })),
      );
    } catch (err) {
      setError(err.message);
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchCouncilName();
  }, []);

  useEffect(() => {
    if (!councilName || treeData.length) return;
    fetchTrees();
  }, [councilName]);

  const getWeekRange = (weekNum, month, year) => {
    const firstDayOfMonth = new Date(year, month, 1);

    let start = new Date(firstDayOfMonth);
    start.setDate(1 + (weekNum - 1) * 7);

    let end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const monthEnd = new Date(year, month + 1, 0);

    if (end > monthEnd) {
      end = monthEnd;
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const getMonthRange = (month, year) => ({
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999),
  });

  const getYearRange = (year) => ({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  });

  let range = {};
  if (duration === "week")
    range = getWeekRange(selectedWeek, selectedMonth, selectedYear);
  else if (duration === "month")
    range = getMonthRange(selectedMonth, selectedYear);
  else if (duration === "year") range = getYearRange(selectedYear);

  let relevantData = [];

  if (selectT === "submission" || selectT === "wasteClassification") {
    relevantData = data.filter((item) => item && item.wasteType);
  } else if (selectT === "report") {
    relevantData = data.filter((item) => item && !item.wasteType);
  }

  const temp = {};
  relevantData.forEach((item) => {
    const d = new Date(item.date);
    d.setHours(0, 0, 0, 0);

    if (d < range.start || d > range.end) return;

    if (selectT === "wasteClassification") {
      temp[item.wasteType] = (temp[item.wasteType] || 0) + 1;
    } else {
      let label = "";
      if (duration === "week")
        label = d.toLocaleString("default", { weekday: "short" });
      if (duration === "month") label = d.getDate();
      if (duration === "year")
        label = d.toLocaleString("default", { month: "short" });
      temp[label] = (temp[label] || 0) + 1;
    }
  });

  let filteredData = [];
  if (selectT === "wasteClassification") {
    filteredData = WASTE_TYPES.map((type) => ({
      label: type,
      count: temp[type] || 0,
    }));
  } else {
    let labels = [];
    if (duration === "week")
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    else if (duration === "month")
      labels = Array.from({ length: 31 }, (_, i) => i + 1);
    else if (duration === "year") labels = MONTHS;

    filteredData = labels.map((label) => ({
      label,
      count: temp[label] || 0,
    }));
  }

  let range1 = {};
  if (duration1 === "week")
    range1 = getWeekRange(selectedWeek1, selectedMonth1, selectedYear1);
  else if (duration1 === "month")
    range1 = getMonthRange(selectedMonth1, selectedYear1);
  else if (duration1 === "year") range1 = getYearRange(selectedYear1);

  let secondChartData = [];

  if (selectN === "treeGrown") {
    const tempTree = {};
    treeData.forEach((item) => {
      const d = new Date(item.dateT);
      d.setHours(0, 0, 0, 0);

      if (d < range1.start || d > range1.end) return;

      let label1 = "";
      if (duration1 === "week")
        label1 = d.toLocaleString("default", { weekday: "short" });
      if (duration1 === "month") label1 = d.getDate();
      if (duration1 === "year")
        label1 = d.toLocaleString("default", { month: "short" });

      tempTree[label1] = (tempTree[label1] || 0) + 1;
    });

    let labels1 = [];
    if (duration1 === "week")
      labels1 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    else if (duration1 === "month")
      labels1 = Array.from({ length: 31 }, (_, i) => i + 1);
    else if (duration1 === "year") labels1 = MONTHS;

    secondChartData = labels1.map((label1) => ({
      label1,
      count: tempTree[label1] || 0,
    }));
  }

  if (selectN === "footprint") {
    const tempCO2 = {};

    data.forEach((item) => {
      const d = new Date(item.date);
      d.setHours(0, 0, 0, 0);

      if (d < range1.start || d > range1.end) return;

      let co2 = 0;
      if (item.wasteType) {
        co2 = WASTE_CO2[item.wasteType] || 0;
      } else {
        co2 = REPORT_CO2;
      }

      let label1 = "";
      if (duration1 === "week")
        label1 = d.toLocaleString("default", { weekday: "short" });
      if (duration1 === "month") label1 = d.getDate();
      if (duration1 === "year")
        label1 = d.toLocaleString("default", { month: "short" });

      tempCO2[label1] = (tempCO2[label1] || 0) + co2;
    });

    let labels1 = [];
    if (duration1 === "week")
      labels1 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    else if (duration1 === "month")
      labels1 = Array.from({ length: 31 }, (_, i) => i + 1);
    else if (duration1 === "year") labels1 = MONTHS;

    secondChartData = labels1.map((label1) => ({
      label1,
      count: tempCO2[label1] || 0,
    }));
  }
  const generateReport = (title, chartData, dataLabel, typeLabel) => {
    const doc = new jsPDF();

    doc.setDrawColor(3, 88, 18);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    const imageWidth = 25;
    const imageHeight = 25;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.addImage(
      imageBase64,
      "PNG",
      pageWidth - imageWidth - 10,
      10,
      imageWidth,
      imageHeight,
    );

    doc.setFontSize(18);
    doc.text(`${councilName} - Environmental Report`, 14, 20);
    doc.setFontSize(15);

    if (selectT === "submission") {
      doc.text("Garbage Submissions", 14, 33);
    } else if (selectT === "report") {
      doc.text("Illegal Waste Reports", 14, 33);
    } else if (selectT === "wasteClassification") {
      doc.text("Types of Waste Disposal", 14, 33);
    } else if (selectN === "footprint") {
      doc.text("CO2 Footprint", 14, 33);
    } else if (selectN === "treeGrown") {
      doc.text("Reforestation", 14, 33);
    }
    doc.setFontSize(12);
    doc.text(
      `${duration === "week" ? `Week ${selectedWeek || selectedWeek1}, ${MONTHS[selectedMonth || selectedMonth1]} ${selectedYear || selectedYear1}` : duration === "month" ? `${MONTHS[selectedMonth || selectedMonth1]} ${selectedYear || selectedYear1}` : `Yearly Report ${selectedYear || selectedYear1}`}`,
      14,
      41,
    );
    doc.setFontSize(10);
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 49);

    const tableColumn = [typeLabel, dataLabel];
    const tableRows = chartData.map((item) => [
      item.label || item.label1,
      item.count,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: "grid",
      headStyles: {
        fillColor: [30, 161, 52],
        textColor: [255, 255, 255],
        lineColor: [3, 88, 18],
      },
    });

    const fileName = `${title.replace(/\s+/g, "_")}_Report.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="InfoGarbage">
      {showGraph === "graph1" && (
        <div className="statistics">
          <div className="body">
            <h2 className="eHead">Statistics Overview</h2>

            <div className="reportButton">
              <button
                className="reportGenerate"
                onClick={() =>
                  generateReport(
                    "Statistics Overview",
                    filteredData,
                    "Count",
                    "Time Period/Type",
                  )
                }
              >
                Generate Report
              </button>
            </div>
            <label>Choose Data Type:</label>
            <select
              value={selectT}
              onChange={(e) => setSelectT(e.target.value)}
            >
              <option value="submission">Garbage Submissions</option>
              <option value="report">Illegal Waste Reports</option>
              <option value="wasteClassification">
                Types of Waste Disposal
              </option>
            </select>
            <br />

            <label className="date">Select Duration:</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>

            {duration === "week" && (
              <>
                <label>Week:</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                >
                  {WEEKS.map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>

                <label>Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>

                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {duration === "month" && (
              <>
                <label>Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>

                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {duration === "year" && (
              <>
                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            <br />

            <BarChart
              className="barchart"
              width={700}
              height={630}
              data={filteredData}
            >
              <CartesianGrid strokeDasharray="3 5" />
              <XAxis dataKey="label" interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                className="barkey"
                dataKey="count"
                fill="#1ea134"
                stroke="none"
              />
            </BarChart>
          </div>
        </div>
      )}

      {showGraph === "graph2" && (
        <div className="reduction">
          <div className="body">
            <h2 className="eHead">Pollution Reduction</h2>
            <div className="reportButton">
              <button
                className="reportGenerate"
                onClick={() =>
                  generateReport(
                    "Pollution Reduction",
                    secondChartData,
                    selectN === "footprint" ? "CO2 (kg)" : "Trees",
                    "Time Period",
                  )
                }
              >
                Generate Report
              </button>
            </div>
            <label>Choose Data Type:</label>
            <select
              value={selectN}
              onChange={(e) => setSelectN(e.target.value)}
            >
              <option value="footprint">CO2 Footprint</option>
              <option value="treeGrown">Reforestation</option>
            </select>
            <br />

            <label className="date">Select Duration:</label>
            <select
              value={duration1}
              onChange={(e) => setDuration1(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>

            {duration1 === "week" && (
              <>
                <label>Week:</label>
                <select
                  value={selectedWeek1}
                  onChange={(e) => setSelectedWeek1(Number(e.target.value))}
                >
                  {WEEKS.map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>

                <label>Month:</label>
                <select
                  value={selectedMonth1}
                  onChange={(e) => setSelectedMonth1(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>

                <label>Year:</label>
                <select
                  value={selectedYear1}
                  onChange={(e) => setSelectedYear1(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {duration1 === "month" && (
              <>
                <label>Month:</label>
                <select
                  value={selectedMonth1}
                  onChange={(e) => setSelectedMonth1(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>

                <label>Year:</label>
                <select
                  value={selectedYear1}
                  onChange={(e) => setSelectedYear1(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {duration1 === "year" && (
              <>
                <label>Year:</label>
                <select
                  value={selectedYear1}
                  onChange={(e) => setSelectedYear1(Number(e.target.value))}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            <br />

            <BarChart
              className="barchartOther"
              width={700}
              height={630}
              padding={4}
              data={secondChartData}
            >
              <CartesianGrid strokeDasharray="3 5" />
              <XAxis dataKey="label1" interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                className="barkey"
                dataKey="count"
                fill="#6dd11b"
                stroke="none"
              />
            </BarChart>
          </div>
        </div>
      )}
    </div>
  );
}

export default Evaluate;
