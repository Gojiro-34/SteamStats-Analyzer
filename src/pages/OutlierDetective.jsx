import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';
import { outlierScript } from '../scripts/pythonScripts';

const COLUMNS = [
  { key: 'price_usd', label: 'Price ($)', icon: '💰' },
  { key: 'recommendations', label: 'Reviews', icon: '⭐' },
  { key: 'avg_playtime_forever', label: 'Avg Playtime', icon: '⏱️' },
];

export default function OutlierDetective() {
  const { runPython, filterVersion } = usePyodideContext();
  const [activeCol, setActiveCol] = useState('avg_playtime_forever');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelectedGame(null);
    runPython(outlierScript, { outlier_column: activeCol })
      .then(r => { setData(r); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, [runPython, filterVersion, activeCol]);

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>🔎</span> Outlier Detective
      </motion.h2>

      {/* Column selector */}
      <div className="category-filter-bar" style={{ marginBottom: 20 }}>
        {COLUMNS.map(c => (
          <span key={c.key} className={`cat-pill ${activeCol === c.key ? 'active' : ''}`}
            onClick={() => setActiveCol(c.key)}>
            {c.icon} {c.label}
          </span>
        ))}
      </div>

      {loading && (
        <div className="page-loader"><div className="loader-spinner" /><p>Detecting outliers...</p></div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="outlier-summary-grid">
            <motion.div className="outlier-summary-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <div className="outlier-summary-icon">📊</div>
              <div className="outlier-summary-value">{data.total_games}</div>
              <div className="outlier-summary-label">Total Games</div>
            </motion.div>
            <motion.div className="outlier-summary-card ag-card alert" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="outlier-summary-icon">🚨</div>
              <div className="outlier-summary-value">{data.outlier_count}</div>
              <div className="outlier-summary-label">Outliers Found ({data.outlier_pct}%)</div>
            </motion.div>
            <motion.div className="outlier-summary-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="outlier-summary-icon">📏</div>
              <div className="outlier-summary-value">{data.iqr.toLocaleString()}</div>
              <div className="outlier-summary-label">IQR</div>
            </motion.div>
            <motion.div className="outlier-summary-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="outlier-summary-icon">🔻</div>
              <div className="outlier-summary-value">{data.lower_fence.toLocaleString()}</div>
              <div className="outlier-summary-label">Lower Fence</div>
            </motion.div>
            <motion.div className="outlier-summary-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="outlier-summary-icon">🔺</div>
              <div className="outlier-summary-value">{data.upper_fence.toLocaleString()}</div>
              <div className="outlier-summary-label">Upper Fence</div>
            </motion.div>
            <motion.div className="outlier-summary-card ag-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="outlier-summary-icon">📐</div>
              <div className="outlier-summary-value">Q1: {data.q1.toLocaleString()} | Q3: {data.q3.toLocaleString()}</div>
              <div className="outlier-summary-label">Quartiles</div>
            </motion.div>
          </div>

          {/* Outlier formula explanation */}
          <motion.div className="outlier-formula ag-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <span className="outlier-formula-label">IQR Method:</span>
            <span className="outlier-formula-text">
              Outlier if <strong>{data.column_label}</strong> &lt; Q1 − 1.5×IQR ({data.lower_fence.toLocaleString()}) or &gt; Q3 + 1.5×IQR ({data.upper_fence.toLocaleString()})
            </span>
          </motion.div>

          {/* Outlier table */}
          {data.outliers.length > 0 ? (
            <motion.div className="stats-table-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Game Name</th>
                    <th>{data.column_label}</th>
                    <th>Direction</th>
                    <th>Deviation (×IQR)</th>
                    <th>Price</th>
                    <th>Reviews</th>
                    <th>Playtime</th>
                  </tr>
                </thead>
                <tbody>
                  {data.outliers.map((o, i) => (
                    <motion.tr key={i}
                      className={`outlier-row ${selectedGame === i ? 'selected' : ''}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.02 }}
                      onClick={() => setSelectedGame(selectedGame === i ? null : i)}
                      style={{ cursor: 'pointer' }}>
                      <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: o.direction === 'high' ? '#dc2626' : '#2563eb' }}>
                        {o.outlier_value?.toLocaleString()}
                      </td>
                      <td>
                        <span className={`outlier-badge ${o.direction}`}>
                          {o.direction === 'high' ? '▲ High' : '▼ Low'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {o.deviation}×
                      </td>
                      <td>${o.price_usd?.toFixed(2)}</td>
                      <td>{o.recommendations?.toLocaleString()}</td>
                      <td>{o.avg_playtime_forever?.toLocaleString()} min</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div className="ag-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              ✅ No outliers detected for <strong>{data.column_label}</strong> with current filters.
            </motion.div>
          )}

          {/* Game detail card on click */}
          <AnimatePresence>
            {selectedGame !== null && data.outliers[selectedGame] && (
              <motion.div className="outlier-detail ag-card" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} transition={{ duration: 0.25 }}>
                <div className="outlier-detail-header">
                  <div>
                    <div className="outlier-detail-name">{data.outliers[selectedGame].name}</div>
                    <span className="compare-game-cat">{data.outliers[selectedGame].primary_category}</span>
                  </div>
                  <button className="compare-clear" onClick={() => setSelectedGame(null)} style={{ position: 'static', transform: 'none' }}>✕</button>
                </div>
                <div className="outlier-detail-stats">
                  {[
                    { label: 'Price', value: `$${data.outliers[selectedGame].price_usd?.toFixed(2)}`, icon: '💰' },
                    { label: 'Reviews', value: data.outliers[selectedGame].recommendations?.toLocaleString(), icon: '⭐' },
                    { label: 'Positive', value: `${data.outliers[selectedGame].rec_pct}%`, icon: '👍' },
                    { label: 'Playtime', value: `${data.outliers[selectedGame].avg_playtime_forever?.toLocaleString()} min`, icon: '⏱️' },
                    { label: 'Outlier In', value: data.column_label, icon: '🚨' },
                    { label: 'Deviation', value: `${data.outliers[selectedGame].deviation}× IQR ${data.outliers[selectedGame].direction === 'high' ? 'above' : 'below'}`, icon: data.outliers[selectedGame].direction === 'high' ? '🔺' : '🔻' },
                  ].map((s, i) => (
                    <div key={i} className="outlier-detail-stat">
                      <div className="outlier-detail-stat-icon">{s.icon}</div>
                      <div>
                        <div className="outlier-detail-stat-label">{s.label}</div>
                        <div className="outlier-detail-stat-value">{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
