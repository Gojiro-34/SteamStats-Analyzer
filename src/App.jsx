import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePyodideContext } from './context/PyodideContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import FilterPanel from './components/FilterPanel';
import Dashboard from './pages/Dashboard';
import Descriptive from './pages/Descriptive';
import Probability from './pages/Probability';
import Regression from './pages/Regression';
import Explorer from './pages/Explorer';
import GameCompare from './pages/GameCompare';
import OutlierDetective from './pages/OutlierDetective';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function AnimatedPage({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ flex: 1 }}>
      {children}
    </motion.div>
  );
}

function App() {
  const { loading, progress, status } = usePyodideContext();
  const location = useLocation();
  const [filterOpen, setFilterOpen] = useState(false);

  if (loading) {
    return <LoadingScreen progress={progress} status={status} />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
              <Route path="/descriptive" element={<AnimatedPage><Descriptive /></AnimatedPage>} />
              <Route path="/probability" element={<AnimatedPage><Probability /></AnimatedPage>} />
              <Route path="/regression" element={<AnimatedPage><Regression /></AnimatedPage>} />
              <Route path="/explorer" element={<AnimatedPage><Explorer /></AnimatedPage>} />
              <Route path="/compare" element={<AnimatedPage><GameCompare /></AnimatedPage>} />
              <Route path="/outliers" element={<AnimatedPage><OutlierDetective /></AnimatedPage>} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
      <button className="filter-toggle" onClick={() => setFilterOpen(v => !v)} title="Filters">
        🔽
      </button>
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}

export default App;
