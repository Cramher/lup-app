import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/tasks/metrics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMetrics(res.data);
            } catch (err) {
                alert('Error al cargar las métricas');
                console.error(err);
            }
        };
        fetchMetrics();
    }, []);

    if (!metrics) return <p>Cargando métricas...</p>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>📊 Dashboard Analítico</h2>
            <ul>
                <li><strong>Total de tareas:</strong> {metrics.totalTasks}</li>
                <li><strong>Completadas:</strong> {metrics.completedTasks}</li>
                <li><strong>Pendientes:</strong> {metrics.pendingTasks}</li>
                <li><strong>% Completadas:</strong> {metrics.completionRate}%</li>
                <li><strong>Tasa de abandono:</strong> {metrics.abandonmentRate}%</li>
                <li><strong>Tiempo promedio para completar:</strong> {metrics.averageCompletionTime}</li>
                <li><strong>Días de mayor productividad:</strong>
                    <ul>
                        {Object.entries(metrics.productivityByDay).map(([day, count]) => (
                            <li key={day}>{day}: {count} completadas</li>
                        ))}
                    </ul>
                </li>
            </ul>
        </div>
    );
}
