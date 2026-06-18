# 🚀 Flipkart Gridlock Suite v2: Real-Time Parking Congestion Analytics & Fleet Routing Optimizer

**Submission Category:** Traffic Intelligence & Last-Mile Logistics Optimization  
**Team Name:** MonoMode  
**Developer:** Khushboo Rawat  
**Deployment Status:** Production Ready (Serverless Edge Architecture)  

---

## 🔗 Live Production Links
*   **Live Interactive Dashboard:** [https://khushboo992.github.io/flipkart-gridlock-v2/](https://khushboo992.github.io/flipkart-gridlock-v2/)
*   **Production Deployment:** Fully hosted and running on GitHub Pages.

---

## 💡 Problem Statement & Solution Overview
Traditional traffic engines rely on raw volumetric vehicle counting, failing to measure the actual spatial footprint and structural degradation that unauthorized parking causes on active commercial lanes. 

**Flipkart Gridlock Suite v2** addresses this data visibility gap. Engineered using real-world traffic logs, it calculates a dynamic **Parking Congestion Index (PCI)** by mapping Passenger Car Equivalent (PCE) weights. This intelligence stream flags high-risk bottleneck corridors in real-time, outputting immediate telemetry to divert last-mile delivery fleets away from chronic bottlenecks before dispatch.

---

## 🛠️ Core Functional Features

*   **Dynamic Data Class Segregation:** Instantly switches and filters between **Logistics** and **Commuters** telemetry streams to evaluate independent vehicle footprint impacts.
*   **Geospatial Search Rig:** Includes a live search engine to isolate specific bottleneck sectors and trigger profile expansions instantaneously.
*   **Granular Profile Breakdowns:** Interaction-driven cards that expand to reveal localized structural road capacity degradation arrays.
*   **Adaptive Dual-Environment UI:** Complete high-contrast **Light and Dark Mode toggle** optimized for field operators working under unpredictable lighting conditions.
*   **Policy Simulation Sandbox:** Integrated sliders to manipulate enforcement parameters in real-time, forcing immediate client-side chart re-rendering.
*   **Strict Audit-Ready Telemetry:** Built with a high-performance vector rendering engine configured to maintain strict, **full numerical Y-axis formatting** (e.g., displaying complete values like `10000` instead of abbreviated formats like `10k`) for precise operational auditing.
*   **Export Pipeline Integration:** A one-click data pipeline export that packages calculated data states into clean JSON payloads, ready for webhook synchronization with **Flipkart's last-mile fleet routing engines**.

---

## 💻 Instructions to Run & Test

### 📍 Method 1: Instant Online Testing (No Setup Required)
Launch the fully compiled edge deployment instantly in any modern web browser:  
👉 **[https://khushboo992.github.io/flipkart-gridlock-v2/](https://khushboo992.github.io/flipkart-gridlock-v2/)**

### 💻 Method 2: Local Machine Setup
Copy, paste, and execute this single command chain in your terminal to completely clone, install, and launch the application locally (Requires Node.js 18+):

```bash
git clone [https://github.com/khushboo992/flipkart-gridlock-v2.git](https://github.com/khushboo992/flipkart-gridlock-v2.git) && cd flipkart-gridlock-v2 && npm install && npm run dev
Once initialized, open your browser and navigate to: http://localhost:5173

## ⚙️ Core Technical Stack & Architecture
Frontend Engine: React 18, Vite (State-driven reactive rendering layer)
Data Visualization: SVG-driven Recharts vector engine
Wrangling & Analytics Layer: Python 3.x, Pandas (Used for parsing raw traffic log patterns and computing localized structural degradation metrics)
To evaluate or execute the core Python data processing algorithms locally:
python process_traffic_logs.py
