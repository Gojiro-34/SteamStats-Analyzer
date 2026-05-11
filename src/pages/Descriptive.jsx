import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import { Chart } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';
import { descriptiveScript, boxPlotScript } from '../scripts/pythonScripts';
import ChartWrapper from '../components/ChartWrapper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BoxPlotController, BoxAndWiskers);

export default function Descriptive() {
  const { runPython, filterVersion } = usePyodideContext();
  const [data, setData] = useState(null);
  const [boxData, setBoxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);

  const topCats = ['Single-player', 'Multi-player'];

  useEffect(() => {
    setLoading(true);
    async function run() {
      try {
        const [r, box] = await Promise.all([
          runPython(descriptiveScript, { filter_category: activeCat || '' }),
          runPython(boxPlotScript, { filter_category: activeCat || '' })
        ]);
        setData(r);
        setBoxData(box);
      } catch (e) {
        console.error('Descriptive error:', e);
      }
      setLoading(false);
    }
    run();
  }, [runPython, filterVersion, activeCat]);

  if (loading || !data) {
    return <div className="page-loader"><div className="loader-spinner" /><p>Computing descriptive statistics...</p></div>;
  }

  const metrics = ['Mean','Median','Mode','Std Dev','Variance','Min','Max','Q1','Q3','IQR','Skewness','Kurtosis'];
  const variables = data.table ? Object.keys(data.table) : [];

  const makeHistChart = (histData, label, color) => {
    const labels = histData?.labels || [];
    const counts = histData?.counts || [];
    return {
      labels: labels.map(l => { try { return parseFloat(l.split('-')[0]).toFixed(0); } catch { return l; } }),
      datasets: [{ label, data: counts, backgroundColor: color + '80', borderColor: color, borderWidth: 1, borderRadius: 4 }]
    };
  };

  const histOpts = (title, xLabel) => ({
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, color: '#0f172a', font: { size: 13, weight: 600 } },
      tooltip: { backgroundColor: '#fff', titleColor: '#0f172a', bodyColor: '#475569', borderColor: 'rgba(37,99,235,0.2)', borderWidth: 1, padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { color: 'rgba(37,99,235,0.06)' }, ticks: { color: '#475569', font: { size: 10 }, maxRotation: 45, maxTicksLimit: 12 }, title: { display: true, text: xLabel, color: '#475569' } },
      y: { grid: { color: 'rgba(37,99,235,0.06)' }, ticks: { color: '#475569', font: { size: 10 } }, title: { display: true, text: 'Frequency', color: '#475569' } }
    }
  });

  // Real Box Plot using @sgratzl/chartjs-chart-boxplot
  const boxLabels = boxData ? Object.keys(boxData) : [];
  const boxPlotChartData = boxLabels.length > 0 ? {
    labels: boxLabels.map(l => l.length > 18 ? l.slice(0, 18) + '…' : l),
    datasets: [{
      label: 'Avg Playtime Distribution',
      data: boxLabels.map(cat => boxData[cat]),
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderColor: '#2563eb',
      borderWidth: 2,
      outlierBackgroundColor: 'rgba(244,114,182,0.6)',
      outlierBorderColor: '#f472b6',
      outlierRadius: 3,
      medianColor: '#059669',
      meanBackgroundColor: '#f59e0b',
      meanBorderColor: '#f59e0b',
      meanRadius: 4,
      itemRadius: 0,
      padding: 16,
    }]
  } : null;

  const boxPlotOpts = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1200 },
    plugins: {
      title: { display: true, text: 'Box Plot — Avg Playtime by Category', color: '#0f172a', font: { size: 14, weight: 700 } },
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff', titleColor: '#0f172a', bodyColor: '#475569',
        borderColor: 'rgba(37,99,235,0.2)', borderWidth: 1, padding: 12, cornerRadius: 10,
        callbacks: {
          label: function(ctx) {
            const v = ctx.parsed;
            if (!v) return '';
            return [
              `Min: ${Math.round(v.min)}`,
              `Q1: ${Math.round(v.q1)}`,
              `Median: ${Math.round(v.median)}`,
              `Q3: ${Math.round(v.q3)}`,
              `Max: ${Math.round(v.max)}`,
            ];
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#0f172a', font: { size: 11, weight: 600 } } },
      y: {
        grid: { color: 'rgba(37,99,235,0.06)' },
        ticks: { color: '#475569' },
        title: { display: true, text: 'Avg Playtime (mins)', color: '#475569', font: { size: 12 } }
      }
    }
  };

  const hasHist = data.histograms?.price?.labels?.length > 0;

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>📈</span> Descriptive Statistics {activeCat && <span style={{ fontSize: '.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>— {activeCat}</span>}
      </motion.h2>

      <div className="category-filter-bar">
        <span className={`cat-pill ${!activeCat ? 'active' : ''}`} onClick={() => setActiveCat(null)}>All</span>
        {topCats.map(c => (
          <span key={c} className={`cat-pill ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(activeCat === c ? null : c)}>{c}</span>
        ))}
      </div>

      {variables.length === 0 ? (
        <div className="ag-card" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Not enough data for this category.
        </div>
      ) : (
        <>
          <motion.div className="stats-table-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <table className="stats-table">
              <thead><tr><th>Metric</th>{variables.map(v => <th key={v}>{v}</th>)}</tr></thead>
              <tbody>
                {metrics.map((m, idx) => (
                  <motion.tr key={m} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                    <td className="metric-name">{m}</td>
                    {variables.map(v => <td key={v}>{data.table[v]?.[m]?.toLocaleString?.() ?? '—'}</td>)}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <h3 className="section-title" style={{ fontSize: '1rem' }}><span>🎯</span> 95% Confidence Intervals for Mean</h3>
          <div className="ci-grid">
            {variables.map((v, i) => (
              <motion.div className="ci-card ag-card" key={v} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="ci-label">{v}</div>
                <div className="ci-value">[{data.ci?.[v]?.lower?.toLocaleString?.() ?? '—'}, {data.ci?.[v]?.upper?.toLocaleString?.() ?? '—'}]</div>
                <div className="ci-conf">μ = {data.ci?.[v]?.mean?.toLocaleString?.() ?? '—'} | 95% CI</div>
              </motion.div>
            ))}
          </div>

          {hasHist && (
            <>
              <h3 className="section-title" style={{ fontSize: '1rem' }}><span>📊</span> Frequency Distributions</h3>
              <div className="charts-grid">
                <ChartWrapper title="Price Distribution" icon="💰">
                  <div style={{ minHeight: 280 }}><Bar data={makeHistChart(data.histograms.price, 'Price', '#2563eb')} options={histOpts('Price Distribution', 'Price ($)')} /></div>
                </ChartWrapper>
                <ChartWrapper title="Reviews Distribution" icon="⭐">
                  <div style={{ minHeight: 280 }}><Bar data={makeHistChart(data.histograms.reviews, 'Reviews', '#059669')} options={histOpts('Reviews Distribution', 'Reviews')} /></div>
                </ChartWrapper>
              </div>
              <div className="charts-grid single">
                <ChartWrapper title="Avg Playtime Distribution" icon="⏱️">
                  <div style={{ minHeight: 280 }}><Bar data={makeHistChart(data.histograms.playtime, 'Playtime', '#0ea5e9')} options={histOpts('Avg Playtime Distribution', 'Playtime (mins)')} /></div>
                </ChartWrapper>
              </div>
            </>
          )}

          {boxPlotChartData && (
            <div className="charts-grid single">
              <ChartWrapper title="Box Plot — Avg Playtime by Category" icon="📦">
                <div style={{ minHeight: 380 }}>
                  <Chart type="boxplot" data={boxPlotChartData} options={boxPlotOpts} />
                </div>
              </ChartWrapper>
            </div>
          )}
        </>
      )}
    </>
  );
}
