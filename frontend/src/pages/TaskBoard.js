import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function TaskBoard() {
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', status: 'To do' });
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', status: 'To do' });


    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) return navigate('/login');
        const fetchTasks = async () => {

            try {
                const res = await api.get('/tasks', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTasks(res.data);
            } catch (err) {
                console.error('Loading tasks error:', err);
                alert('Unable to load tasks. Please log in again.');
                navigate('/login');
            }
        };

        fetchTasks();
    }, [navigate, token]);

    const startEdit = (task) => {
        setEditingId(task._id);
        setEditForm({
            title: task.title,
            description: task.description,
            status: task.status,
        });
    };


    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tasks', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTasks(prev => [...prev, res.data]);
            setFormData({ title: '', description: '', status: 'To do' });
        } catch (err) {
            alert('Could not create task: ' + (err.response?.data?.error || 'Unexpected error'));
        }
    };

    const saveEdit = async (id) => {
        try {
            const res = await api.put(`/tasks/${id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTasks(prev => prev.map(t => t._id === id ? res.data : t));
            setEditingId(null);
        } catch (err) {
            alert('No se pudo editar la tarea: ' + (err.response?.data?.error || 'Error inesperado'));
        }
    };


    return (
        <div>
            <h2>My Tasks</h2>

            <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
                <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
                <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="To do">To do</option>
                    <option value="In progress">In progress</option>
                    <option value="Completed">Completed</option>
                </select>
                <button type="submit">Create New Task</button>
            </form>
            <ul>
                {tasks.map(task => (
                    <li key={task._id}>
                        {editingId === task._id ? (
                            <>
                                <input
                                    name="title"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                />
                                <input
                                    name="description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                                <select
                                    name="status"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="To do">To do</option>
                                    <option value="In progress">In progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                <button onClick={() => saveEdit(task._id)}>Save</button>
                                <button onClick={() => setEditingId(null)}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <strong>{task.title}</strong> - {task.status}
                                <p>{task.description}</p>
                                <button onClick={() => startEdit(task)}>Edit</button>
                                <button onClick={async () => {
                                    try {
                                        await api.delete(`/tasks/${task._id}`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        setTasks(prev => prev.filter(t => t._id !== task._id));
                                    } catch (err) {
                                        alert('Could not delete task: ' + (err.response?.data?.error || 'Unexpected error'));
                                    }
                                }}>Delete</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TaskBoard;
