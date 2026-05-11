import { useMemo } from 'react';
import { motion } from 'framer-motion';

const SHAPES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  type: ['circle', 'triangle', 'hexagon'][i % 3],
  size: 12 + Math.random() * 30,
  left: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 8 + Math.random() * 10,
  color: ['#2563eb', '#06b6d4', '#10b981', '#f472b6'][i % 4],
}));

function Shape({ shape }) {
  const style = {
    position: 'absolute',
    left: `${shape.left}%`,
    bottom: '-40px',
    width: shape.size,
    height: shape.size,
    opacity: 0.18,
    animation: `float-drift ${shape.duration}s linear ${shape.delay}s infinite`,
  };

  if (shape.type === 'circle') {
    return <div style={{ ...style, borderRadius: '50%', background: shape.color }} />;
  }
  if (shape.type === 'triangle') {
    return (
      <div style={{ ...style, background: 'transparent', width: 0, height: 0,
        borderLeft: `${shape.size / 2}px solid transparent`,
        borderRight: `${shape.size / 2}px solid transparent`,
        borderBottom: `${shape.size}px solid ${shape.color}`,
      }} />
    );
  }
  return (
    <div style={{ ...style, background: shape.color, borderRadius: '4px', transform: 'rotate(30deg)' }} />
  );
}

export default function LoadingScreen({ progress, status }) {
  return (
    <div className="loading-screen">
      {SHAPES.map(s => <Shape key={s.id} shape={s} />)}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', zIndex: 1 }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⚙️</div>
        <h2>Initializing Python Engine...</h2>
        <p>Setting up Pyodide with pandas, numpy, scipy, and scikit-learn for real statistical analysis in your browser.</p>
        <div className="progress-bar-container" style={{ margin: '20px auto 0' }}>
          <motion.div className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="loading-status" style={{ marginTop: 12 }}>{status}</div>
      </motion.div>
    </div>
  );
}
