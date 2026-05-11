import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';
import { correlationScript } from '../scripts/pythonScripts';

ChartJS.register(LinearScale, PointElement, Title, Tooltip, Legend);

export default function Explorer() {
  const { runPython, filteredData, filterVersion } = usePyodideContext();
  const [corrData, setCorrData] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState(70);
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const perPage = 10;

  useEffect(() => {
    runPython(correlationScript).then(r => setCorrData(r)).catch(e => console.error(e));
  }, [runPython, filterVersion]);

  const categories = useMemo(() => {
    if (!filteredData) return [];
    return ['All', ...[...new Set(filteredData.map(r => r.primary_category))].filter(Boolean).sort()];
  }, [filteredData]);

  const filtered = useMemo(() => {
    if (!filteredData) return [];
    let data = filteredData.filter(r => {
      if (search && !r.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'All' && r.primary_category !== catFilter) return false;
      if (r.price_usd > maxPrice) return false;
      return true;
    });
    if (sortCol) {
      data = [...data].sort((a, b) => {
        const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    return data;
  }, [filteredData, search, catFilter, maxPrice, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  useEffect(() => { setPage(0); }, [search, catFilter, maxPrice, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const getHeatColor = (val) => {
    if (val >= 0) return `rgba(${Math.round(16 + (1-val)*60)}, ${Math.round(185*val + 80*(1-val))}, ${Math.round(129*val + 80*(1-val))}, 0.85)`;
    const a = Math.abs(val);
    return `rgba(${Math.round(220*a + 80*(1-a))}, ${Math.round(80*(1-a))}, ${Math.round(80*(1-a))}, 0.85)`;
  };

  const cols = [
    { key: 'name', label: 'Game Name' },
    { key: 'price_usd', label: 'Price ($)' },
    { key: 'primary_category', label: 'Category' },
    { key: 'recommendations', label: 'Reviews' },
    { key: 'rec_pct', label: 'Rec %' },
    { key: 'avg_playtime_forever', label: 'Avg Playtime' },
  ];

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>🔍</span> Data Explorer
      </motion.h2>

      <div className="explorer-controls">
        <div className="control-group">
          <label>Search by Name</label>
          <input type="text" placeholder="Search games..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        </div>
        <div className="control-group">
          <label>Category</label>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Max Price: ${maxPrice}</label>
          <input type="range" min="0" max="70" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{ width: 200 }} />
        </div>
        <div style={{ fontSize: '.8rem', color: '#6b7280', alignSelf: 'flex-end', paddingBottom: 8 }}>{filtered.length} results</div>
      </div>

      <motion.div className="stats-table-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <table className="stats-table">
          <thead>
            <tr>
              <th>#</th>
              {cols.map(c => (
                <th key={c.key} className="sortable" onClick={() => handleSort(c.key)}>
                  {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td style={{ color: '#9ca3af' }}>{page * perPage + i + 1}</td>
                <td style={{ fontWeight: 500, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                <td>${r.price_usd?.toFixed(2)}</td>
                <td><span style={{ background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: 4, fontSize: '.8rem' }}>{r.primary_category}</span></td>
                <td>{r.recommendations?.toLocaleString()}</td>
                <td style={{ color: r.rec_pct > 70 ? '#10b981' : r.rec_pct > 40 ? '#f59e0b' : '#ef4444' }}>{r.rec_pct}%</td>
                <td>{r.avg_playtime_forever?.toLocaleString()} min</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <div className="pagination">
        <button disabled={page === 0} onClick={() => setPage(0)}>⟪</button>
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="page-info">Page {page + 1} of {totalPages || 1}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>⟫</button>
      </div>

      {corrData && (
        <>
          <h3 className="section-title" style={{ fontSize: '1rem', marginTop: 16 }}><span>🔥</span> Pearson Correlation Heatmap</h3>
          <div className="heatmap-wrapper">
            <table className="heatmap-table">
              <thead><tr><th></th>{corrData.labels.map(l => <th key={l}>{l}</th>)}</tr></thead>
              <tbody>
                {corrData.labels.map((rowLabel, i) => (
                  <tr key={rowLabel}>
                    <th style={{ textAlign: 'right', paddingRight: 16 }}>{rowLabel}</th>
                    {corrData.matrix[i].map((val, j) => (
                      <motion.td key={j} style={{ backgroundColor: getHeatColor(val), color: '#fff' }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (i * 3 + j) * 0.08 }}>
                        {val.toFixed(3)}
                        {corrData.pvalues && <span className="heatmap-pval">p={corrData.pvalues[i][j].toFixed(4)}</span>}
                      </motion.td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
