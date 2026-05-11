import { motion } from 'framer-motion';

export default function ChartWrapper({ children, title, icon, loading, className = '' }) {
  return (
    <motion.div
      className={`chart-card ag-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {title && <h3>{icon && <span>{icon}</span>}{title}</h3>}
      <div className="chart-container" style={{ position: 'relative' }}>
        {loading && (
          <div className="chart-loading-overlay">
            <div className="pulse-spinner" />
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
