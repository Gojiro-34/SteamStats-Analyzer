import { useState, useEffect } from 'react';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { motion } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';
import { probabilityScript, normalCalcScript } from '../scripts/pythonScripts';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function ProgressRing({ value, label, color = '#2563eb', size = 120 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value, 1);
  return (
    <motion.div className="prob-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="prob-label">{label}</div>
      <div className="progress-ring" style={{ width: size, height: size, margin: '0 auto 8px' }}>
        <svg width={size} height={size}>
          <circle className="ring-bg" cx={size/2} cy={size/2} r={r} strokeWidth={6} />
          <motion.circle className="ring-fill" cx={size/2} cy={size/2} r={r} strokeWidth={6}
            stroke={color} strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="ring-text">
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{(pct * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div className="prob-pct">p = {value.toFixed(6)}</div>
    </motion.div>
  );
}

export default function Probability() {
  const { runPython, filterVersion } = usePyodideContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calcX, setCalcX] = useState('1000');
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    runPython(probabilityScript).then(r => { setData(r); setLoading(false); }).catch(e => { console.error(e); setLoading(false); });
  }, [runPython, filterVersion]);

  const handleCalc = async () => {
    if (!data) return;
    try {
      const r = await runPython(normalCalcScript, { calc_mu: data.mu, calc_sigma: data.sigma, calc_x: parseFloat(calcX) || 0 });
      setCalcResult(r);
    } catch (e) { console.error(e); }
  };

  if (loading || !data) {
    return <div className="page-loader"><div className="loader-spinner" /><p>Fitting probability distributions...</p></div>;
  }

  const p = data.probabilities;

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>🎲</span> Probability &amp; Distribution
      </motion.h2>

      <motion.div className="ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>📊 Normal Distribution Parameters</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="eq-metric"><div className="eq-metric-label">μ (Mean)</div><div className="eq-metric-value" style={{ color: 'var(--color-primary)' }}>{data.mu}</div></div>
          <div className="eq-metric"><div className="eq-metric-label">σ (Std Dev)</div><div className="eq-metric-value" style={{ color: '#7c3aed' }}>{data.sigma}</div></div>
        </div>
      </motion.div>

      <h3 className="section-title" style={{ fontSize: '1rem' }}><span>🎯</span> Computed Probabilities</h3>
      <div className="prob-grid">
        <ProgressRing value={p.p_playtime_gt_1000} label="P(Playtime > 1000 min)" color="#2563eb" />
        <ProgressRing value={p.p_price_lt_5} label="P(Price < $5)" color="#06b6d4" />
        <ProgressRing value={p.p_recs_gt_10000} label="P(Reviews > 10,000)" color="#10b981" />
      </div>

      <motion.div className="normal-calc ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3>🧮 Interactive Normal Calculator</h3>
        <div className="normal-calc-row">
          <div className="predictor-inputs">
            <div className="input-group">
              <label>Playtime Value (X)</label>
              <input type="number" value={calcX} onChange={e => setCalcX(e.target.value)} min="0" />
            </div>
            <button onClick={handleCalc}>Calculate</button>
          </div>
        </div>
        {calcResult && (
          <div className="normal-calc-result">
            <div className="calc-box">
              <div className="calc-label">P(X &lt; {calcResult.x})</div>
              <div className="calc-val">{(calcResult.p_less * 100).toFixed(4)}%</div>
            </div>
            <div className="calc-box">
              <div className="calc-label">P(X &gt; {calcResult.x})</div>
              <div className="calc-val">{(calcResult.p_greater * 100).toFixed(4)}%</div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
