import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      navigate('/tasks');
    } catch (err) {
      alert('Log in Error: ' + (err.response?.data?.error || 'Unexpected Error'));
    }
  };

  return (
    <div>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Correo" value={formData.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;
