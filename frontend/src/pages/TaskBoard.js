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
        console.log("Drag ended", result);

        const { source, destination, draggableId } = result;

        if (!destination) {
            console.log("No destination, dropping outside");
            return;
        }

        if (source.droppableId === destination.droppableId) {
            console.log("Same column, no need to update");
            return;
        }

        const newStatus = statusMap[destination.droppableId];
        if (!newStatus) {
            console.warn("Status not found in map ", destination.droppableId);
            return;
        }

        const taskId = draggableId.toString();
        const draggedTask = tasks.find(task => task._id.toString() === taskId);

        if (!draggedTask) {
            console.error("No Task With ID:", taskId);
            return;
        }

        try {
            console.log("Uptading Task", taskId, "To", newStatus);

            await api.put(`/tasks/${taskId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTasks(prev =>
                prev.map(task =>
                    task._id.toString() === taskId ? { ...task, status: newStatus } : task
                )
            );
        } catch (err) {
            console.error("Moving Task Error", err);
            alert('Moving Task Error: ' + (err.response?.data?.error || 'Unexpected error'));
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
            alert('Could not Create the Task: ' + (err.response?.data?.error || 'Unexpected error'));
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
            alert('Could not edit Task: ' + (err.response?.data?.error || 'Unexpected error'));
        }
    };

    return (
        <div>
            <button
                onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('token_expiry');
                    navigate('/');
                }}
                style={{ marginBottom: '1rem', float: 'right' }}
            >
                Log out
            </button>
            <button onClick={() => navigate('/home')} style={{ marginBottom: '1rem' }}>
                ← Back to Home
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
                                                                {editingId === task._id ? (
                                                                    <form onSubmit={(e) => {
                                                                        e.preventDefault();
                                                                        saveEdit(task._id);
                                                                    }}>
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
                                                                        <button type="submit">Save</button>
                                                                        <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                                                                    </form>
                                                                ) : (
                                                                    <>
                                                                        <strong>{task.title}</strong>
                                                                        <p>{task.description}</p>
                                                                        <p><em>{task.status}</em></p>
                                                                        <div style={{ marginTop: '0.5rem' }}>
                                                                            <button onClick={() => startEdit(task)} style={{ marginRight: '0.5rem' }}>Edit</button>
                                                                            <button onClick={async () => {
                                                                                try {
                                                                                    await api.delete(`/tasks/${task._id}`, {
                                                                                        headers: { Authorization: `Bearer ${token}` },
                                                                                    });
                                                                                    setTasks(prev => prev.filter(t => t._id !== task._id));
                                                                                } catch (err) {
                                                                                    alert('Could not delete Task');
                                                                                }
                                                                            }}>Delete</button>
                                                                        </div>
                                                                    </>
                                                                )}
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
