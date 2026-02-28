# 💸 UPI Transaction Intelligence Dashboard

A full-stack fintech analytics platform for exploring **250,000+ UPI transactions**. Upload your dataset and instantly get interactive visualizations, fraud analysis, geographic insights, and AI-generated findings — all in a premium dark-themed dashboard inspired by Stripe and Razorpay.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Python](https://img.shields.io/badge/Backend-Flask-blue) ![React](https://img.shields.io/badge/Frontend-React-61dafb)

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Dataset Upload** | Drag-and-drop CSV upload with instant summary stats |
| 2 | **Executive Overview** | KPI cards, daily trends, category pie, state bars, hourly heatmap |
| 3 | **Category Analysis** | Top categories by volume/value, avg transaction size, monthly trends |
| 4 | **Time Analysis** | Peak hours, weekend vs weekday, hourly heatmap, daily distribution |
| 5 | **Geographic Analysis** | India bubble map, state-level volume, value, and fraud rates |
| 6 | **Device & Network** | Android vs iOS share, success rates, network reliability |
| 7 | **Fraud Analysis** | Fraud by category/state/hour/device, intensity heatmap |
| 8 | **Bank Analysis** | Sender/receiver volumes, cross-bank flows, success rates |
| 9 | **User Demographics** | Age group spending, category preferences, fraud risk by age |
| 10 | **AI Insights** | 10 auto-generated findings (peak hour, top category, fraud timing, etc.) |
| 11 | **Global Filters** | Filter by date range, state, category, device, network, age group |
| 12 | **Performance** | Server-side Pandas aggregation — only summary JSON sent to frontend |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python · Flask · Pandas · Flask-CORS |
| **Frontend** | React 18 · Vite · Recharts · React Router · Lucide Icons |
| **Map** | SVG India bubble map with state coordinates |
| **Styling** | Custom CSS design system (dark theme, glassmorphism, animations) |

---

## 📂 Project Structure

```
upi_data_analysis/
├── backend/
│   ├── app.py              # Flask API — upload, aggregation, insights
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # Proxy /api → Flask:5001
│   └── src/
│       ├── App.jsx           # Router, sidebar, filter context
│       ├── index.css          # Dark-themed design system
│       ├── main.jsx
│       ├── components/
│       │   ├── ChartCard.jsx
│       │   ├── FilterPanel.jsx
│       │   └── StatCard.jsx
│       └── pages/
│           ├── UploadPage.jsx
│           ├── OverviewPage.jsx
│           ├── CategoriesPage.jsx
│           ├── TimePage.jsx
│           ├── GeographyPage.jsx
│           ├── DevicesPage.jsx
│           ├── FraudPage.jsx
│           ├── BanksPage.jsx
│           ├── DemographicsPage.jsx
│           └── InsightsPage.jsx
└── .gitignore
```

---

## 📊 Dataset Schema

The dashboard expects a CSV with these columns (names are auto-inferred):

| Column | Example |
|--------|---------|
| `transaction id` | TXN0000000001 |
| `timestamp` | 2024-10-08 15:17:28 |
| `transaction type` | P2P / P2M |
| `merchant_category` | Entertainment, Grocery, Fuel |
| `amount (INR)` | 868 |
| `transaction_status` | SUCCESS / FAILED |
| `sender_age_group` | 26-35 |
| `receiver_age_group` | 18-25 |
| `sender_state` | Delhi |
| `sender_bank` | Axis, SBI, ICICI |
| `receiver_bank` | SBI, PNB |
| `device_type` | Android / iOS |
| `network_type` | 4G / 5G / WiFi |
| `fraud_flag` | 0 / 1 |
| `hour_of_day` | 15 |
| `day_of_week` | Tuesday |
| `is_weekend` | 0 / 1 |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** with `pip`
- **Node.js 18+** with `npm`

### Installation

```bash
# Clone the repo
git clone https://github.com/BighneshPadhi/UPI_Transactions_analysis.git
cd UPI_Transactions_analysis

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### Running

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 5001)
cd backend
python3 app.py
```

```bash
# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser, upload the CSV, and explore!

---

## 🖥️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload CSV file |
| `GET` | `/api/summary` | Total transactions, value, rates |
| `GET` | `/api/overview` | Time series, category/state distribution, heatmap |
| `GET` | `/api/categories` | Category volume, value, trends |
| `GET` | `/api/time` | Hourly, daily, weekend/weekday analysis |
| `GET` | `/api/geography` | State-level metrics and fraud rates |
| `GET` | `/api/devices` | Device and network breakdown |
| `GET` | `/api/fraud` | Fraud by category, state, hour, device |
| `GET` | `/api/banks` | Bank volumes, cross-bank flows, success rates |
| `GET` | `/api/demographics` | Age group spending and preferences |
| `GET` | `/api/insights` | Auto-generated text insights |
| `GET` | `/api/filters` | Available filter options |

All `GET` endpoints support query params: `date_start`, `date_end`, `state`, `category`, `device_type`, `network_type`, `age_group`

---
