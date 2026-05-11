import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { cleanDataScript } from '../scripts/pythonScripts';

const PyodideContext = createContext(null);

export function usePyodideContext() {
  return useContext(PyodideContext);
}

const DEFAULT_FILTERS = {
  categories: [],
  priceRange: [0, 70],
  playtimeRange: [0, 5000],
  reviewRange: [0, 100000],
  showFree: true,
};

export function PyodideProvider({ children }) {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [cleanData, setCleanData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [allCategories, setAllCategories] = useState([]);
  const [filterVersion, setFilterVersion] = useState(0);
  const pyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function waitForPyodide() {
      for (let i = 0; i < 60; i++) {
        if (typeof window.loadPyodide === 'function') return;
        await new Promise(r => setTimeout(r, 300));
      }
      throw new Error('Pyodide CDN failed to load. Check your internet connection.');
    }

    async function init() {
      try {
        setStatus('Loading Pyodide runtime...');
        setProgress(5);
        await waitForPyodide();
        setProgress(10);
        const py = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        if (cancelled) return;

        setProgress(30);
        setStatus('Installing Python packages...');
        await py.loadPackage(['pandas', 'numpy', 'scipy', 'scikit-learn']);
        if (cancelled) return;

        setProgress(60);
        setStatus('Loading dataset...');
        const resp = await fetch('/steam_top_games_2026.csv');
        const csvText = await resp.text();
        if (cancelled) return;

        setProgress(70);
        setStatus('Parsing CSV data...');
        const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
        const jsonString = JSON.stringify(parsed.data);
        setRawData(parsed.data);

        setProgress(80);
        setStatus('Cleaning data in Python...');
        py.globals.set('csv_json', jsonString);
        const cleanResult = py.runPython(cleanDataScript);
        py.globals.set('clean_data_json', cleanResult);
        const cleanedArr = JSON.parse(cleanResult);
        setCleanData(cleanedArr);
        setFilteredData(cleanedArr);

        const catCounts = {};
        cleanedArr.forEach(r => {
          const cat = r.primary_category || 'Unknown';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(e => e[0]);
        setAllCategories(sorted);

        if (cancelled) return;
        setProgress(100);
        setStatus('Ready!');
        pyRef.current = py;
        setPyodide(py);
        setTimeout(() => { if (!cancelled) setLoading(false); }, 600);
      } catch (err) {
        console.error('Pyodide init error:', err);
        setStatus(`Error: ${err.message}`);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!cleanData) return;
    const f = filters;
    const result = cleanData.filter(r => {
      if (f.categories.length > 0 && !f.categories.includes(r.primary_category)) return false;
      if (r.price_usd < f.priceRange[0] || r.price_usd > f.priceRange[1]) return false;
      if (r.avg_playtime_forever < f.playtimeRange[0] || r.avg_playtime_forever > f.playtimeRange[1]) return false;
      if (r.recommendations < f.reviewRange[0] || r.recommendations > f.reviewRange[1]) return false;
      if (!f.showFree && r.price_usd === 0) return false;
      return true;
    });
    setFilteredData(result);
    setFilterVersion(v => v + 1);

    if (pyRef.current) {
      pyRef.current.globals.set('clean_data_json', JSON.stringify(result));
    }
  }, [filters, cleanData]);

  const runPython = useCallback(async (script, globals = {}) => {
    const py = pyRef.current;
    if (!py) throw new Error('Pyodide not ready');
    for (const [key, value] of Object.entries(globals)) {
      py.globals.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    const result = py.runPython(script);
    try { return JSON.parse(result); } catch { return result; }
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <PyodideContext.Provider value={{
      pyodide, loading, progress, status,
      cleanData, rawData, filteredData, filters, allCategories,
      filterVersion, runPython, updateFilters, resetFilters,
    }}>
      {children}
    </PyodideContext.Provider>
  );
}
