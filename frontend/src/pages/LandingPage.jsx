import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Welcome</h2>
            <p>What Would You lLike To do?</p>
            <div style={{ marginTop: '1rem' }}>
                <button onClick={() => navigate('/tasks')} style={{ marginRight: '1rem' }}>Go To Tasks</button>
                <button onClick={() => navigate('/dashboard')}>Go To Dashboard</button>
            </div>
        </div>
    );
}
