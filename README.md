# 📊 SteamStats Analyzer

A premium, multi-page statistical analysis dashboard built with **React**, **Pyodide** (Python in-browser), and **Chart.js** — analyzing a Steam top games dataset with real-time computation, no backend required.

> All statistical computations (descriptive stats, probability distributions, regression models) run **entirely in the browser** via Pyodide, using pandas, NumPy, SciPy, and scikit-learn.

---

## ✨ Features

### 🏠 Dashboard Overview
- KPI cards showing total games, average price, playtime, and review counts
- Top 10 games by average playtime (horizontal bar chart)
- Game distribution by category (doughnut chart)

### 📈 Descriptive Statistics
- Full statistics table (mean, median, mode, std dev, variance, quartiles, skewness, kurtosis)
- 95% confidence intervals for each variable
- Frequency distribution histograms (price, reviews, playtime)
- **Real box-and-whisker plot** showing playtime distribution grouped by category (powered by `@sgratzl/chartjs-chart-boxplot`)
- Category filter (All / Single-player / Multi-player)

### 🎲 Probability & Distribution
- Normal distribution parameter fitting (μ, σ) on playtime data
- Computed probabilities with animated progress rings
- Interactive normal calculator — input any X value and get P(X < x) and P(X > x)

### 📐 Regression & Prediction
- Simple linear regression (Price → Playtime) with scatter plot and regression line
- Multiple regression (Price + Reviews → Playtime) with coefficient table
- Interactive playtime predictor — enter price and reviews to predict playtime

### 🔍 Data Explorer
- Searchable, sortable, paginated data table
- Category and price filters
- Pearson correlation heatmap with p-values

### ⚔️ Game Comparison Tool
- Two searchable dropdowns to select any game from the dataset (including free games)
- Side-by-side stat comparison with visual win/loss highlighting
- Compares price, reviews, rating, playtime, and category

### 🔽 Global Filters
- Slide-out filter panel with category pills, price/playtime/review range sliders
- Free games toggle
- All charts and analyses update reactively on filter change

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router, Framer Motion |
| **Styling** | Tailwind CSS 4 (theme tokens), Vanilla CSS |
| **Charts** | Chart.js 4 + react-chartjs-2, @sgratzl/chartjs-chart-boxplot |
| **Python Runtime** | Pyodide 0.25 (WASM) |
| **Python Packages** | pandas, NumPy, SciPy, scikit-learn |
| **CSV Parsing** | PapaParse |
| **Build Tool** | Vite 6 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Gojiro-34/SteamStats-Analyzer.git
cd SteamStats-Analyzer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173`. On first load, Pyodide will download and initialize the Python runtime and packages (~30s depending on connection speed).

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── App.jsx                    # Root layout, routing
├── main.jsx                   # Entry point
├── index.css                  # Global styles & design system
├── components/
│   ├── ChartWrapper.jsx       # Glassmorphic chart container
│   ├── FilterPanel.jsx        # Slide-out global filter panel
│   ├── Header.jsx             # Top header bar
│   ├── KPICard.jsx            # Animated KPI metric card
│   ├── LoadingScreen.jsx      # Pyodide loading screen
│   └── Sidebar.jsx            # Navigation sidebar
├── context/
│   └── PyodideContext.jsx     # Pyodide runtime, data loading, filtering
├── pages/
│   ├── Dashboard.jsx          # Overview with KPIs and charts
│   ├── Descriptive.jsx        # Descriptive stats, histograms, box plot
│   ├── Probability.jsx        # Probability distributions & calculator
│   ├── Regression.jsx         # Linear regression & predictor
│   ├── Explorer.jsx           # Data table & correlation heatmap
│   └── GameCompare.jsx        # Side-by-side game comparison tool
├── scripts/
│   └── pythonScripts.js       # All Python analysis scripts
public/
├── steam_top_games_2026.csv   # Dataset
└── favicon.svg
```

---

## 📊 Dataset

The dashboard analyzes `steam_top_games_2026.csv` containing top Steam games with columns:
- `name` — Game title
- `price_usd` — Price in USD (including free games at $0)
- `categories` — Game categories/tags
- `recommendations` — Total review count
- `positive_reviews` — Positive review count
- `avg_playtime_forever` — Average playtime in minutes

---

## 👥 Team

Developed for **Probability & Statistics — Spring 2026** at **FAST-NUCES**.

---

## 📄 License

This project is for educational purposes.
