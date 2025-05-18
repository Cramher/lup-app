import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const COLORS = ['#0088FE', '#FF8042'];

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const metricKeys = {
        totalTasks: 'Total Tasks',
        completedTasks: 'Completed Tasks',
        pendingTasks: 'Pending Tasks',
        avgCompletionTimeMs: 'Avg Complete Time (min)',
        productivityByDay: 'Productivity By Day',
        abandonmentRate: 'Abandonment Rate'
    };

    const [visibleMetrics, setVisibleMetrics] = useState(
        Object.keys(metricKeys).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {})
    );


    const toggleMetric = (metricKey) => {
        setVisibleMetrics(prev => ({
            ...prev,
            [metricKey]: !prev[metricKey]
        }));
    };

    const [prediction, setPrediction] = useState(null);


    useEffect(() => {
        const token = localStorage.getItem('token');
        const expiry = localStorage.getItem('token_expiry');

        if (!token || Date.now() > expiry) {
            localStorage.removeItem('token');
            localStorage.removeItem('token_expiry');
            return navigate('/login');
        }

        const fetchMetrics = async () => {
            try {
                const res = await api.get('/tasks/metrics', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMetrics(res.data);
            } catch (err) {
                console.error('Error loading metrics:', err);
                alert('Error loading metrics');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        const fetchPrediction = async () => {
            try {
                const res = await api.get('/tasks/prediction', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPrediction(res.data);
            } catch (err) {
                console.error('Error loading prediction:', err);
            }
        };

        fetchPrediction();


        fetchMetrics();
    }, [navigate]);

    if (loading) return <p>Loading Metrics...</p>;
    if (!metrics) return <p>Could not load metrics</p>;

    const statusPieData = [
        { name: 'Completed', value: metrics.completedTasks },
        { name: 'To Do', value: metrics.pendingTasks }
    ];

    const productivityData = Object.entries(metrics.productivityByDay).map(([day, count]) => ({
        day,
        count
    }));
    console.log("📊 Datos de productividad:", productivityData);

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
        saveAs(blob, 'metrics.json');
    };

    const exportCSV = () => {
        const csv = Papa.unparse([metrics]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'metrics.csv');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <button onClick={() => navigate('/home')} style={{ marginBottom: '1rem' }}>
                ← Back to Home
            </button>

            <h2>Dashboard</h2>
            {prediction && prediction.estimatedTimeMinutes && (
                <p><strong>Tiempo estimado para nuevas tareas:</strong> {prediction.estimatedTimeMinutes} minutos</p>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <h4>Select metrics to display:</h4>
                {Object.entries(metricKeys).map(([key, label]) => (
                    <label key={key} style={{ marginRight: '1rem', display: 'inline-block' }}>
                        <input
                            type="checkbox"
                            checked={visibleMetrics[key]}
                            onChange={() => toggleMetric(key)}
                        />
                        {' '}{label}
                    </label>
                ))}

            </div>
            {(visibleMetrics.completedTasks || visibleMetrics.pendingTasks) && (
                <>
                    <h4>Task Status</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusPieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label
                            >
                                {statusPieData.map((_, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </>
            )}
            {visibleMetrics.productivityByDay && (
                <>
                    <h4>Productivity Day</h4>
                    {productivityData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productivityData}>
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                    ) : (
                        <p>No hay datos de productividad aún.</p>
                    )}
                </>
            )}
            <h4>Other Metrics</h4>
            <ul>
                {visibleMetrics.totalTasks && <li><strong>Total Tasks:</strong> {metrics.totalTasks}</li>}
                {visibleMetrics.completedTasks && <li><strong>Completed:</strong> {metrics.completedTasks}</li>}
                {visibleMetrics.pendingTasks && <li><strong>To do:</strong> {metrics.pendingTasks}</li>}
                {visibleMetrics.avgCompletionTimeMs && (
                    <li>
                        <strong>Average Time To Complete:</strong> {(metrics.avgCompletionTimeMs / 60000).toFixed(2)} min
                    </li>
                )}
                {visibleMetrics.abandonmentRate && (
                    <li><strong>Quitting Rate:</strong> {metrics.abandonmentRate.toFixed(2)}%</li>
                )}
            </ul>
            <div style={{ marginTop: '2rem' }}>
                <button onClick={exportJSON} style={{ marginRight: '1rem' }}>Export JSON</button>
                <button onClick={exportCSV}>Export CSV</button>
            </div>
        </div>
    );
}
