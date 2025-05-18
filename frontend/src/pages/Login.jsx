import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await api.post('/auth/login', form);
        console.log("Login response:", res.data);

        const token = res.data.token;
        if (!token) {
            alert("No token recieved");
            return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('token_expiry', Date.now() + 3600000);

        console.log("Token saved navigating to /tasks");
        window.location.href = '/home';

    } catch (err) {
        console.error("Log In Error:", err);
        alert('Log in Error: ' + (err.response?.data?.error || 'Unexpected error'));
    }
};


    return (
        <div style={{ padding: '2rem' }}>
            <h2>Log In Page</h2>
            <form onSubmit={handleSubmit}>
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
                <button type="submit">Log In</button>
            </form>
            <p>Do not have an account yet? <Link to="/register">Sign Up Here</Link></p>
        </div>
    );
}
