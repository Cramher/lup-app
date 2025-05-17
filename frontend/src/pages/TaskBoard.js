import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function TaskBoard() {
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', status: 'To do' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', status: 'To do' });
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    const statusMap = {
        todo: 'To do',
        inprogress: 'In progress',
        completed: 'Completed'
    };

    const columns = [
        { id: 'todo', name: 'To do' },
        { id: 'inprogress', name: 'In progress' },
        { id: 'completed', name: 'Completed' }
    ];

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const expiry = parseInt(localStorage.getItem('token_expiry'), 10);
        if (!token || !expiry || Date.now() > expiry) {
            localStorage.removeItem('token');
            localStorage.removeItem('token_expiry');
            navigate('/login');
            return;
        }

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
            } finally {
                setLoading(false); // <-- MUY IMPORTANTE
            }
        };

        fetchTasks();
    }, [navigate, token]);


    if (loading) return <p style={{ padding: '2rem' }}>Cargando tareas...</p>;


    const onDragEnd = async (result) => {
        console.log("📦 Drag ended", result);

        const { source, destination, draggableId } = result;

        if (!destination) {
            console.log("🚫 Sin destino (cancelado o soltado afuera)");
            return;
        }

        if (source.droppableId === destination.droppableId) {
            console.log("➡️ Mismo contenedor, sin acción");
            return;
        }

        const newStatus = statusMap[destination.droppableId];
        if (!newStatus) {
            console.warn("⚠️ Estado no encontrado en el mapa:", destination.droppableId);
            return;
        }

        const taskId = draggableId.toString();
        const draggedTask = tasks.find(task => task._id.toString() === taskId);

        if (!draggedTask) {
            console.error("❌ No se encontró la tarea con ID:", taskId);
            return;
        }

        try {
            console.log("🔄 Actualizando tarea", taskId, "a estado", newStatus);

            await api.put(`/tasks/${taskId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTasks(prev =>
                prev.map(task =>
                    task._id.toString() === taskId ? { ...task, status: newStatus } : task
                )
            );
        } catch (err) {
            console.error("❌ Error al mover tarea", err);
            alert('Error al mover tarea: ' + (err.response?.data?.error || 'Error inesperado'));
        }
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
            alert('No se pudo crear la tarea: ' + (err.response?.data?.error || 'Error inesperado'));
        }
    };

    const startEdit = (task) => {
        setEditingId(task._id);
        setEditForm({
            title: task.title,
            description: task.description,
            status: task.status,
        });
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
            <button
                onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('token_expiry');
                    navigate('/login');
                }}
                style={{ marginBottom: '1rem', float: 'right' }}
            >
                Log out
            </button>
            <h2 style={{ marginBottom: '1rem' }}><strong>My Tasks</strong></h2>

            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                <input name="title" placeholder="Título" value={formData.title} onChange={handleChange} required />
                <input name="description" placeholder="Descripción" value={formData.description} onChange={handleChange} />
                <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="To do">To do</option>
                    <option value="In progress">In progress</option>
                    <option value="Completed">Completed</option>
                </select>
                <button type="submit">Create Task</button>
            </form>

            {tasks.length > 0 && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {columns.map(col => (
                            <Droppable
                                key={col.id}
                                droppableId={col.id}
                                isDropDisabled={false}
                                isCombineEnabled={false}
                                ignoreContainerClipping={false}
                            >
                                {(provided) => {
                                    const columnTasks = tasks.filter(task => task.status === statusMap[col.id]);

                                    return (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{
                                                flex: 1,
                                                border: '1px solid #ccc',
                                                padding: '1rem',
                                                minHeight: '300px',
                                                background: '#f9f9f9'
                                            }}
                                        >
                                            <h3>{col.name}</h3>
                                            {columnTasks.map((task, index) => {
                                                const taskId = task._id?.toString();
                                                if (!taskId) {
                                                    console.warn("Task without an ID will not render as Draggable", task);
                                                    return null;
                                                }

                                                console.log("Rendering Task", taskId);

                                                return (
                                                    <Draggable key={taskId} draggableId={taskId} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    border: '1px solid #eee',
                                                                    marginBottom: '1rem',
                                                                    padding: '0.5rem',
                                                                    background: '#fff',
                                                                }}
                                                            >
                                                                <strong>{task.title}</strong>
                                                                <p>{task.description}</p>
                                                                <p><em>{task.status}</em></p>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}

                                            {provided.placeholder}
                                        </div>
                                    );
                                }}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
}

export default TaskBoard;
