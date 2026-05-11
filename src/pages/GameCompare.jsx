import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';

function SearchDropdown({ label, games, selected, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return games.slice(0, 50);
    const q = query.toLowerCase();
    return games.filter(g => g.name?.toLowerCase().includes(q)).slice(0, 50);
  }, [games, query]);

  return (
    <div className="compare-search" ref={ref}>
      <label className="compare-search-label">{label}</label>
      <div className="compare-search-input-wrap">
        <input
          type="text"
          placeholder={placeholder}
          value={selected ? selected.name : query}
          onChange={e => { setQuery(e.target.value); onSelect(null); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="compare-search-input"
        />
        {selected && (
          <button className="compare-clear" onClick={() => { onSelect(null); setQuery(''); }}>✕</button>
        )}
      </div>
      <AnimatePresence>
        {open && !selected && (
          <motion.ul className="compare-dropdown" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {filtered.length === 0 && <li className="compare-dropdown-empty">No games found</li>}
            {filtered.map((g, i) => (
              <li key={i} className="compare-dropdown-item" onClick={() => { onSelect(g); setOpen(false); setQuery(''); }}>
                <span className="compare-dropdown-name">{g.name}</span>
                <span className="compare-dropdown-meta">${g.price_usd?.toFixed(2)} · {g.primary_category}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const STAT_ROWS = [
  { key: 'price_usd', label: 'Price', format: v => `$${(v ?? 0).toFixed(2)}`, higher: false },
  { key: 'primary_category', label: 'Category', format: v => v || '—', compare: false },
  { key: 'recommendations', label: 'Reviews', format: v => (v ?? 0).toLocaleString(), higher: true },
  { key: 'rec_pct', label: 'Positive Rating', format: v => `${v ?? 0}%`, higher: true },
  { key: 'avg_playtime_forever', label: 'Avg Playtime', format: v => `${(v ?? 0).toLocaleString()} min`, higher: true },
];

function getWinner(a, b, key, higherBetter) {
  const av = a?.[key] ?? 0, bv = b?.[key] ?? 0;
  if (av === bv) return 'tie';
  if (higherBetter) return av > bv ? 'a' : 'b';
  return av < bv ? 'a' : 'b';
}

export default function GameCompare() {
  const { cleanData } = usePyodideContext();
  const [gameA, setGameA] = useState(null);
  const [gameB, setGameB] = useState(null);

  const games = useMemo(() => {
    if (!cleanData) return [];
    return [...cleanData].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [cleanData]);

  const bothSelected = gameA && gameB;

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>⚔️</span> Game Comparison Tool
      </motion.h2>

      <div className="compare-selectors">
        <SearchDropdown label="Game A" games={games} selected={gameA} onSelect={setGameA} placeholder="Search for a game..." />
        <div className="compare-vs">VS</div>
        <SearchDropdown label="Game B" games={games} selected={gameB} onSelect={setGameB} placeholder="Search for a game..." />
      </div>

      <AnimatePresence>
        {bothSelected && (
          <motion.div className="compare-results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            {/* Header cards */}
            <div className="compare-header-row">
              <motion.div className="compare-name-card ag-card" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="compare-game-icon">🎮</div>
                <div className="compare-game-name">{gameA.name}</div>
                <div className="compare-game-cat">{gameA.primary_category}</div>
              </motion.div>
              <div className="compare-vs-badge">⚔️</div>
              <motion.div className="compare-name-card ag-card" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="compare-game-icon">🎮</div>
                <div className="compare-game-name">{gameB.name}</div>
                <div className="compare-game-cat">{gameB.primary_category}</div>
              </motion.div>
            </div>

            {/* Stat rows */}
            <div className="compare-stats">
              {STAT_ROWS.map((stat, idx) => {
                const winner = stat.compare === false ? 'tie' : getWinner(gameA, gameB, stat.key, stat.higher !== false);
                return (
                  <motion.div key={stat.key} className="compare-stat-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.06 }}>
                    <div className={`compare-stat-val left ${winner === 'a' ? 'winner' : winner === 'b' ? 'loser' : ''}`}>
                      {stat.format(gameA[stat.key])}
                      {winner === 'a' && <span className="compare-crown">👑</span>}
                    </div>
                    <div className="compare-stat-label">{stat.label}</div>
                    <div className={`compare-stat-val right ${winner === 'b' ? 'winner' : winner === 'a' ? 'loser' : ''}`}>
                      {stat.format(gameB[stat.key])}
                      {winner === 'b' && <span className="compare-crown">👑</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!bothSelected && (
        <motion.div className="compare-placeholder ag-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select two games to compare</div>
          <div style={{ fontSize: '.82rem', color: 'var(--color-text-muted)', marginTop: 6 }}>Use the search boxes above to find and select games from the dataset</div>
        </motion.div>
      )}
    </>
  );
}
