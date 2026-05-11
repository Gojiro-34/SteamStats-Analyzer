import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { usePyodideContext } from '../context/PyodideContext';
import { dashboardScript } from '../scripts/pythonScripts';
import KPICard from '../components/KPICard';
import ChartWrapper from '../components/ChartWrapper';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { runPython, filterVersion } = usePyodideContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    runPython(dashboardScript).then(r => { setData(r); setLoading(false); }).catch(e => { console.error(e); setLoading(false); });
  }, [runPython, filterVersion]);

  if (loading || !data) {
    return <div className="page-loader"><div className="loader-spinner" /><p>Running Python analysis...</p></div>;
  }

  const palette = ['#2563eb','#06b6d4','#10b981','#f472b6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#64748b'];

  const barData = {
    labels: data.top10_playtime.map(g => g.name.length > 25 ? g.name.slice(0, 25) + '…' : g.name),
    datasets: [{
      label: 'Avg Playtime (mins)',
      data: data.top10_playtime.map(g => g.avg_playtime_forever),
      backgroundColor: 'rgba(37,99,235,0.6)',
      borderColor: '#2563eb',
      borderWidth: 1, borderRadius: 6,
    }]
  };

  const barOpts = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#fff', titleColor: '#1e1b4b', bodyColor: '#6b7280', borderColor: 'rgba(37,99,235,0.2)', borderWidth: 1, padding: 12, cornerRadius: 10 }
    },
    scales: {
      x: { grid: { color: 'rgba(37,99,235,0.06)' }, ticks: { color: '#6b7280', font: { size: 11 } }, title: { display: true, text: 'Minutes', color: '#6b7280' } },
      y: { grid: { display: false }, ticks: { color: '#1e1b4b', font: { size: 11 } } }
    }
  };

  const catLabels = Object.keys(data.category_counts);
  const doughnutData = {
    labels: catLabels,
    datasets: [{ data: Object.values(data.category_counts), backgroundColor: palette.slice(0, catLabels.length), borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }]
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    animation: { animateRotate: true, duration: 1000 },
    plugins: {
      legend: { position: 'right', labels: { color: '#1e1b4b', font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 } },
      tooltip: { backgroundColor: '#fff', titleColor: '#1e1b4b', bodyColor: '#6b7280', borderColor: 'rgba(37,99,235,0.2)', borderWidth: 1, padding: 12, cornerRadius: 10 }
    },
    cutout: '60%',
  };

  return (
    <>
      <motion.h2 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span>🏠</span> Dashboard Overview
      </motion.h2>

      <div className="kpi-grid">
        <KPICard icon="🎮" label="Total Games" value={data.total_games} sub="After data cleaning" index={0} />
        <KPICard icon="💰" label="Avg Price" value={data.avg_price} sub="Across all games" index={1} prefix="$" />
        <KPICard icon="⏱️" label="Avg Playtime" value={data.avg_playtime} sub="Average forever playtime" index={2} suffix="min" />
        <KPICard icon="⭐" label="Avg Reviews" value={data.avg_recs} sub="Recommendations per game" index={3} />
      </div>

      <div className="charts-grid">
        <ChartWrapper title="Top 10 Games by Avg Playtime" icon="📊">
          <div style={{ minHeight: 380 }}><Bar data={barData} options={barOpts} /></div>
        </ChartWrapper>
        <ChartWrapper title="Games by Category" icon="🍩">
          <div style={{ minHeight: 380 }}><Doughnut data={doughnutData} options={doughnutOpts} /></div>
        </ChartWrapper>
      </div>
    </>
  );
}
