import { motion, AnimatePresence } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';

export default function FilterPanel({ open, onClose }) {
  const { filters, allCategories, updateFilters, resetFilters } = usePyodideContext();

  const toggleCat = (cat) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    updateFilters({ categories: cats });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', zIndex: 198 }}
          />
          <motion.div
            className="filter-panel"
            initial={{ x: 340 }} animate={{ x: 0 }} exit={{ x: 340 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <h3>🔽 Filters</h3>

            <div className="filter-section">
              <label>Category</label>
              <div className="filter-pills">
                {allCategories.map(cat => (
                  <span key={cat} className={`filter-pill ${filters.categories.includes(cat) ? 'active' : ''}`}
                    onClick={() => toggleCat(cat)}>
                    {cat}
                    {filters.categories.includes(cat) && <span className="pill-x">×</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Price Range: <span className="filter-range-value">${filters.priceRange[0]} – ${filters.priceRange[1]}</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="range" className="filter-range" min={0} max={70} value={filters.priceRange[0]}
                  onChange={e => updateFilters({ priceRange: [Number(e.target.value), filters.priceRange[1]] })} />
                <input type="range" className="filter-range" min={0} max={70} value={filters.priceRange[1]}
                  onChange={e => updateFilters({ priceRange: [filters.priceRange[0], Number(e.target.value)] })} />
              </div>
            </div>

            <div className="filter-section">
              <label>Playtime Range: <span className="filter-range-value">{filters.playtimeRange[0]} – {filters.playtimeRange[1]} min</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="range" className="filter-range" min={0} max={5000} step={50} value={filters.playtimeRange[0]}
                  onChange={e => updateFilters({ playtimeRange: [Number(e.target.value), filters.playtimeRange[1]] })} />
                <input type="range" className="filter-range" min={0} max={5000} step={50} value={filters.playtimeRange[1]}
                  onChange={e => updateFilters({ playtimeRange: [filters.playtimeRange[0], Number(e.target.value)] })} />
              </div>
            </div>

            <div className="filter-section">
              <label>Review Count: <span className="filter-range-value">{filters.reviewRange[0].toLocaleString()} – {filters.reviewRange[1].toLocaleString()}</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="range" className="filter-range" min={0} max={100000} step={500} value={filters.reviewRange[0]}
                  onChange={e => updateFilters({ reviewRange: [Number(e.target.value), filters.reviewRange[1]] })} />
                <input type="range" className="filter-range" min={0} max={100000} step={500} value={filters.reviewRange[1]}
                  onChange={e => updateFilters({ reviewRange: [filters.reviewRange[0], Number(e.target.value)] })} />
              </div>
            </div>

            <div className="filter-section">
              <label>Show Free Games</label>
              <button className={`toggle-switch ${filters.showFree ? 'active' : ''}`}
                onClick={() => updateFilters({ showFree: !filters.showFree })}>
                <div className="toggle-knob" />
              </button>
            </div>

            <button className="filter-reset" onClick={resetFilters}>Reset All Filters</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
