import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function KPICard({ icon, label, value, sub, index = 0, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * numVal);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [numVal]);

  const formatted = numVal >= 1 ? Math.round(display).toLocaleString() : display.toFixed(2);

  return (
    <motion.div
      className="kpi-card ag-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{prefix}{formatted}{suffix && <span style={{fontSize:'.9rem',fontWeight:400}}> {suffix}</span>}</div>
      <div className="kpi-sub">{sub}</div>
    </motion.div>
  );
}
