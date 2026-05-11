import { useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';
import { regressionScript, predictScript } from '../scripts/pythonScripts';
import ChartWrapper from '../components/ChartWrapper';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Regression() {
  const { runPython, filterVersion } = usePyodideContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState('19.99');
  const [reviewsInput, setReviewsInput] = useState('5000');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    setLoading(true);
    runPython(regressionScript).then(r => { setData(r); setLoading(false); }).catch(e => { console.error(e); setLoading(false); });
  }, [runPython, filterVersion]);

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const r = await runPython(predictScript, { input_price: parseFloat(priceInput) || 0, input_reviews: parseFloat(reviewsInput) || 0 });
      setPrediction(r.predicted_playtime);
    } catch (e) { console.error(e); }
    finally { setPredicting(false); }
  };

  if (loading || !data) {
    return <div className="page-loader"><div className="loader-spinner" /><p>Running regression analysis...</p></div>;
  }

  const s = data.simple;
  const m = data.multiple;

  const chartOpts = (title, xLabel, yLabel) => ({
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeOutQuart' },
    plugins: {
      title: { display: true, text: title, color: '#1e1b4b', font: { size: 13, weight: 600 } },
      legend: { labels: { color: '#1e1b4b', font: { size: 11 }, usePointStyle: true } },
      tooltip: { backgroundColor: '#fff', titleColor: '#1e1b4b', bodyColor: '#6b7280', borderColor: 'rgba(37,99,235,0.2)', borderWidth: 1, padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { type: 'linear', grid: { color: 'rgba(37,99,235,0.06)' }, ticks: { color: '#6b7280' }, title: { display: true, text: xLabel, color: '#6b7280' } },
      y: { grid: { color: 'rgba(37,99,235,0.06)' }, ticks: { color: '#6b7280' }, title: { display: true, text: yLabel, color: '#6b7280' } }
    }
  });

  const scatterData = {
    datasets: [
      { label: 'Games', data: s.scatter_x.map((x, i) => ({ x, y: s.scatter_y[i] })), backgroundColor: 'rgba(37,99,235,0.35)', pointRadius: 3 },
      { label: 'Regression Line', data: s.line_x.map((x, i) => ({ x, y: s.line_y[i] })), type: 'line', borderColor: '#10b981', borderWidth: 2.5, pointRadius: 0, fill: false }
    ]
  };

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>📐</span> Regression &amp; Prediction
      </motion.h2>

      <motion.div className="equation-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eq-formula">ŷ = {s.coef}x + {s.intercept} &nbsp;(Price → Playtime)</div>
        <div className="eq-metric"><div className="eq-metric-label">R²</div><div className="eq-metric-value">{s.r2.toFixed(4)}</div></div>
        <div className="eq-metric"><div className="eq-metric-label">RMSE</div><div className="eq-metric-value">{s.rmse.toFixed(2)}</div></div>
      </motion.div>

      <div className="charts-grid single">
        <ChartWrapper title="Simple Regression: Price vs Playtime" icon="📈">
          <div style={{ minHeight: 360 }}><Scatter data={scatterData} options={chartOpts('Price vs Avg Playtime', 'Price ($)', 'Avg Playtime (mins)')} /></div>
        </ChartWrapper>
      </div>

      <h3 className="section-title" style={{ fontSize: '1rem' }}><span>📋</span> Multiple Regression (Price + Reviews → Playtime)</h3>
      <motion.div className="equation-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eq-formula" style={{ flex: 'unset' }}>ŷ = {m.coefs.price_usd}·Price + {m.coefs.recommendations}·Reviews + {m.intercept}</div>
        <div className="eq-metric"><div className="eq-metric-label">R²</div><div className="eq-metric-value">{m.r2.toFixed(4)}</div></div>
        <div className="eq-metric"><div className="eq-metric-label">RMSE</div><div className="eq-metric-value">{m.rmse.toFixed(2)}</div></div>
      </motion.div>

      <div className="stats-table-wrapper" style={{ maxWidth: 500 }}>
        <table className="stats-table">
          <thead><tr><th>Variable</th><th>Coefficient</th></tr></thead>
          <tbody>
            <tr><td className="metric-name">Intercept</td><td>{m.intercept}</td></tr>
            <tr><td className="metric-name">Price ($)</td><td>{m.coefs.price_usd}</td></tr>
            <tr><td className="metric-name">Reviews</td><td>{m.coefs.recommendations}</td></tr>
          </tbody>
        </table>
      </div>

      <motion.div className="predictor-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3>🔮 Interactive Playtime Predictor</h3>
        <div className="predictor-inputs">
          <div className="input-group">
            <label>Price ($)</label>
            <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)} min="0" step="0.01" />
          </div>
          <div className="input-group">
            <label>Reviews</label>
            <input type="number" value={reviewsInput} onChange={e => setReviewsInput(e.target.value)} min="0" />
          </div>
          <button onClick={handlePredict} disabled={predicting}>{predicting ? 'Computing...' : 'Predict Playtime'}</button>
        </div>
        {prediction !== null && (
          <motion.div className="predictor-result" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="result-label">Predicted Avg Playtime</div>
            <div className="result-value">{prediction.toLocaleString()} mins</div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
