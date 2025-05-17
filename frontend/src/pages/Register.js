import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      navigate('/tasks');
    } catch (err) {
      alert('Register Error: ' + (err.response?.data?.error || 'Unexpected Error'));
    }
  };

  return (
    <div>
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" type="text" placeholder="Nombre" value={formData.name} onChange={handleChange} />
        <input name="email" type="email" placeholder="Correo" value={formData.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}

export default Register;
