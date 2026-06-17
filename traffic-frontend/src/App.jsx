import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  MapPin,
  ShieldAlert,
  Clock,
  TrendingUp,
  BarChart3,
  Sun,
  Moon,
  Search,
  Sliders,
  Car,
  Download,
  CheckCircle,
  ShieldCheck,
  Zap,
  Coins,
} from "lucide-react";

export default function App() {
  const [rawRecords, setRawRecords] = useState([]);
  const [analytics, setAnalytics] = useState({
    hotspots: [],
    hourlyTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState(null);

  // Base Interactive Controls
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // NEW SIMULATION SANDBOX STATES
  const [fineAmount, setFineAmount] = useState(1000); // Default fine in ₹
  const [enforcementRigor, setEnforcementRigor] = useState(0); // 0% to 80% reduction simulation

  useEffect(() => {
    // Yeh automatically check karega ki local chal raha hai ya GitHub Pages par
    const csvPath = `${import.meta.env.BASE_URL}bengaluru_traffic_violations.csv`;

    fetch(csvPath)
      .then((res) => {
        if (!res.ok) throw new Error(`CSV file not found at path: ${csvPath}`);
        return res.text();
      })
      .then((text) => {
        // ... rest of your code remains exactly the same
        if (!res.ok) throw new Error("CSV file not found in public folder");
        return res.text();
      })
      .then((text) => {
        const lines = text.split("\n").map((line) => line.split(","));
        const headers = lines[0].map((h) => h.trim().toLowerCase());

        const locIdx = headers.findIndex(
          (h) => h.includes("location") || h.includes("place"),
        );
        const violIdx = headers.findIndex(
          (h) => h.includes("violation") || h.includes("type"),
        );
        const timeIdx = headers.findIndex(
          (h) => h.includes("time") || h.includes("date"),
        );
        const vehIdx = headers.findIndex((h) => h.includes("vehicle"));

        if (locIdx === -1 || violIdx === -1)
          throw new Error("Critical data columns missing from CSV.");

        const validRecords = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row || row.length < headers.length) continue;

          let location = row[locIdx]?.replace(/^["']|["']$/g, "").trim();
          const violation = row[violIdx]?.toUpperCase() || "";
          const timestamp = row[timeIdx] || "";
          const vehicle = row[vehIdx]?.toUpperCase() || "";

          if (!location || !violation.includes("PARK")) continue;
          validRecords.push({ location, violation, timestamp, vehicle });
        }
        setRawRecords(validRecords);
        setLoading(false);
      })
      .catch((err) => {
        setErrorLog(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (rawRecords.length === 0) return;

    const hotspotMap = {};
    const hourlyCounts = Array(24).fill(0);

    rawRecords.forEach((row) => {
      if (
        vehicleFilter === "HEAVY" &&
        !row.vehicle.includes("BUS") &&
        !row.vehicle.includes("TRUCK") &&
        !row.vehicle.includes("TANKER")
      )
        return;
      if (
        vehicleFilter === "LIGHT" &&
        (row.vehicle.includes("BUS") ||
          row.vehicle.includes("TRUCK") ||
          row.vehicle.includes("TANKER"))
      )
        return;
      if (
        searchTerm &&
        !row.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return;

      let weight = 1.5;
      if (row.vehicle.includes("CAR") || row.vehicle.includes("FOUR"))
        weight = 2.5;
      else if (row.vehicle.includes("TWO") || row.vehicle.includes("SCOOT"))
        weight = 1.0;
      else if (row.vehicle.includes("BUS") || row.vehicle.includes("TRUCK"))
        weight = 4.5;

      if (!hotspotMap[row.location]) {
        hotspotMap[row.location] = {
          location: row.location,
          total_violations: 0,
          pciScore: 0,
          breakdown: { heavy: 0, light: 0 },
        };
      }
      hotspotMap[row.location].total_violations += 1;
      hotspotMap[row.location].pciScore += weight;

      if (row.vehicle.includes("BUS") || row.vehicle.includes("TRUCK")) {
        hotspotMap[row.location].breakdown.heavy += 1;
      } else {
        hotspotMap[row.location].breakdown.light += 1;
      }

      try {
        const match = row.timestamp
          .replace(/^["']|["']$/g, "")
          .match(/(\d{1,2}):\d{2}/);
        if (match) {
          const hour = parseInt(match[1], 10);
          if (hour >= 0 && hour < 24) hourlyCounts[hour] += 1;
        }
      } catch (e) {}
    });

    // Apply simulation impact parameters dynamic computation
    const hotspots = Object.values(hotspotMap)
      .map((h) => {
        const basePCI = h.pciScore;
        // Reduce PCI score based on simulated enforcement efficacy level
        const simulatedPCI = Math.max(
          5,
          basePCI * (1 - enforcementRigor / 100),
        );
        const shortName =
          h.location.length > 12
            ? h.location.substring(0, 12) + "..."
            : h.location;

        return {
          ...h,
          shortName,
          basePCI,
          congestionIndex: Math.min(100, Math.round(simulatedPCI)),
          simulatedRevenue: h.total_violations * fineAmount,
        };
      })
      .sort((a, b) => b.congestionIndex - a.congestionIndex)
      .slice(0, visibleLimit);

    const hourlyTrends = hourlyCounts.map((count, hour) => ({
      hour,
      violationsCount: Math.max(
        0,
        Math.round(count * (1 - enforcementRigor / 100)),
      ),
    }));

    setAnalytics({ hotspots, hourlyTrends });

    if (hotspots.length > 0 && !selectedHotspot) {
      setSelectedHotspot(hotspots[0]);
    }
  }, [
    rawRecords,
    searchTerm,
    visibleLimit,
    vehicleFilter,
    fineAmount,
    enforcementRigor,
  ]);

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(analytics, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      "flipkart_gridlock_predictive_suite.json",
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  if (loading)
    return (
      <div
        style={{
          background: darkMode ? "#0f172a" : "#f8fafc",
          color: darkMode ? "#fff" : "#0f172a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Running Simulation Ingestion Nodes...</h2>
      </div>
    );
  if (errorLog)
    return (
      <div
        style={{
          background: "#0f172a",
          color: "#ef4444",
          minHeight: "100vh",
          padding: "40px",
        }}
      >
        <h2>❌ Data Pipeline Crash</h2>
        <p>{errorLog}</p>
      </div>
    );

  const theme = {
    bg: darkMode ? "#0f172a" : "#f1f5f9",
    cardBg: darkMode ? "#1e293b" : "#ffffff",
    text: darkMode ? "#f8fafc" : "#0f172a",
    subText: darkMode ? "#94a3b8" : "#64748b",
    border: darkMode ? "#334155" : "#e2e8f0",
    innerCard: darkMode ? "#0f172a" : "#f8fafc",
    gridLines: darkMode ? "#334155" : "#cbd5e1",
  };

  // Calculate Total Simulated Revenue for the Top Nodes
  const totalRevenue = analytics.hotspots.reduce(
    (sum, h) => sum + h.simulatedRevenue,
    0,
  );

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "sans-serif",
        transition: "all 0.2s",
      }}
    >
      {/* Header Utilities */}
      <header
        style={{
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: "16px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: 0,
            }}
          >
            <ShieldAlert color="#ef4444" size={28} /> Flipkart Gridlock 2.0:
            Predictive Decision Suite
          </h1>
          <p
            style={{
              color: theme.subText,
              margin: "4px 0 0 0",
              fontSize: "14px",
            }}
          >
            Simulation-sandbox evaluating smart towing optimization strategies.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleExport}
            style={{
              backgroundColor: "#22c55e",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            {exportSuccess ? <CheckCircle size={18} /> : <Download size={18} />}{" "}
            {exportSuccess ? "Data Exported!" : "Export Pipeline Data"}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              backgroundColor: theme.cardBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {darkMode ? <Sun size={18} color="#eab308" /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* CORE LIVE CONTROL SANDBOX PANEL */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.8fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Left Side: Standard Filter Sets */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "20px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              margin: 0,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#3b82f6",
            }}
          >
            <Sliders size={16} /> PRIMARY DATA CONTROLS
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <input
              type="text"
              placeholder="Search location nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: theme.innerCard,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                padding: "10px",
                borderRadius: "6px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["ALL", "HEAVY", "LIGHT"].map((type) => (
              <button
                key={type}
                onClick={() => setVehicleFilter(type)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "bold",
                  backgroundColor:
                    vehicleFilter === type ? "#3b82f6" : theme.innerCard,
                  color: vehicleFilter === type ? "#fff" : theme.text,
                }}
              >
                {type === "ALL"
                  ? "All Classes"
                  : type === "HEAVY"
                    ? "Logistics"
                    : "Commuters"}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <span>
              Limit Nodes: <b>{visibleLimit}</b>
            </span>
            <input
              type="range"
              min="3"
              max="25"
              value={visibleLimit}
              onChange={(e) => setVisibleLimit(parseInt(e.target.value))}
              style={{ width: "60%" }}
            />
          </div>
        </div>

        {/* Right Side: PREDICTIVE SIMULATION COMPLEX WIDGET */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "20px",
            borderRadius: "8px",
            border: "1px dashed #22c55e",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              margin: 0,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#22c55e",
            }}
          >
            <Zap size={16} /> ACTIVE SIMULATION & URBAN PLANNING SANDBOX
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "12px", color: theme.subText }}>
                Enforcement Rigor (Simulate Towing/Fines Efficacy):{" "}
                <b>{enforcementRigor}%</b>
              </label>
              <input
                type="range"
                min="0"
                max="80"
                value={enforcementRigor}
                onChange={(e) => setEnforcementRigor(parseInt(e.target.value))}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "10px", color: "#22c55e" }}>
                Improves PCI structural scores dynamically in real-time.
              </span>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "12px", color: theme.subText }}>
                Proposed Base Fine Architecture: <b>₹{fineAmount}</b>
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={fineAmount}
                onChange={(e) => setFineAmount(parseInt(e.target.value))}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "10px", color: "#eab308" }}>
                Calculates simulated municipal fund collection structures.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Display Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ color: theme.subText, fontSize: "14px" }}>
            <MapPin size={16} /> Targeted Cluster Radius
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px" }}
          >
            {analytics.hotspots.length} Priority Nodes
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ color: theme.subText, fontSize: "14px" }}>
            <ShieldCheck size={16} color="#ef4444" /> Peak Vulnerability Point
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginTop: "12px",
              color: "#ef4444",
            }}
          >
            {analytics.hotspots[0]?.location || "No Matches"}
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ color: theme.subText, fontSize: "14px" }}>
            <Coins size={16} color="#22c55e" /> Projected Pool Generation
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginTop: "8px",
              color: "#22c55e",
            }}
          >
            ₹{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.8fr",
          gap: "24px",
        }}
      >
        {/* Left List Module */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: "8px",
            padding: "20px",
            border: `1px solid ${theme.border}`,
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle color="#eab308" size={18} /> Priority Hotspots
            (Inspect Data Nodes)
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "460px",
              overflowY: "auto",
            }}
          >
            {analytics.hotspots.map((zone, index) => {
              const isSelected = selectedHotspot?.location === zone.location;
              return (
                <div
                  key={index}
                  onClick={() => setSelectedHotspot(zone)}
                  style={{
                    backgroundColor: isSelected ? "#3b82f6" : theme.innerCard,
                    padding: "14px",
                    borderRadius: "6px",
                    borderLeft: isSelected
                      ? "4px solid #fff"
                      : "4px solid #3b82f6",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "13px",
                        color: isSelected ? "#fff" : theme.text,
                      }}
                    >
                      {zone.location}
                    </strong>
                    <span
                      style={{
                        color: isSelected ? "#fff" : "#3b82f6",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      PCI: {zone.congestionIndex}
                    </span>
                  </div>
                  <div
                    style={{
                      color: isSelected ? "#e0f2fe" : theme.subText,
                      fontSize: "11px",
                    }}
                  >
                    Violations Stacked: {zone.total_violations}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Graphs Suite */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Deep Selected Info Node */}
          {selectedHotspot && (
            <div
              style={{
                backgroundColor: theme.cardBg,
                padding: "16px",
                borderRadius: "8px",
                border: "2px solid #3b82f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontWeight: "bold",
                  }}
                >
                  SELECTED NODE TARGET PROFILE
                </span>
                <h3
                  style={{
                    margin: "6px 0 2px 0",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {selectedHotspot.location}
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  textAlign: "right",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    borderRight: `1px solid ${theme.border}`,
                    paddingRight: "20px",
                  }}
                >
                  <div style={{ color: theme.subText }}>HEAVY FREIGHT</div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#eab308",
                    }}
                  >
                    {selectedHotspot.breakdown?.heavy || 0} Units
                  </div>
                </div>
                <div>
                  <div style={{ color: theme.subText }}>LIGHT COMMUTERS</div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#38bdf8",
                    }}
                  >
                    {selectedHotspot.breakdown?.light || 0} Units
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Rendering */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: "8px",
              padding: "20px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <h4 style={{ fontSize: "14px", margin: "0 0 12px 0" }}>
              <BarChart3 size={16} color="#3b82f6" /> Obstruction Structural
              Distribution Index (Global Suite View)
            </h4>
            <div style={{ width: "100%", height: "150px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hotspots}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.gridLines}
                  />
                  <XAxis
                    dataKey="shortName"
                    stroke={theme.subText}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis stroke={theme.subText} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  />
                  <Bar
                    dataKey="congestionIndex"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart Rendering */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: "8px",
              padding: "20px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <h4 style={{ fontSize: "14px", margin: "0 0 12px 0" }}>
              <TrendingUp size={16} color="#22c55e" /> Temporal Flow Degradation
              (Violations by Hour)
            </h4>
            <div style={{ width: "100%", height: "150px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.hourlyTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.gridLines}
                  />
                  <XAxis
                    dataKey="hour"
                    stroke={theme.subText}
                    tickFormatter={(h) => `${h}:00`}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke={theme.subText} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="violationsCount"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
