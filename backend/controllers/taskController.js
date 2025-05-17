const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id });
  res.json(tasks);
};

exports.getMetrics = async (req, res) => {
  const userId = req.user.id;

  try {
    const allTasks = await Task.find({ user: userId });
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'Completed');
    const pending = allTasks.filter(t => t.status !== 'Completed');

    const percentCompleted = total > 0 ? (completed.length / total) * 100 : 0;
    const percentPending = total > 0 ? (pending.length / total) * 100 : 0;

    const avgTime = completed.length > 0
      ? completed.reduce((acc, task) => {
          if (task.completedAt && task.createdAt) {
            return acc + (new Date(task.completedAt) - new Date(task.createdAt));
          }
          return acc;
        }, 0) / completed.length
      : 0;

    const productivityByDay = {};
    completed.forEach(task => {
      if (task.completedAt) {
        const day = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
        productivityByDay[day] = (productivityByDay[day] || 0) + 1;
      }
    });

    const abandonmentRate = 0;

    res.json({
      totalTasks: total,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      percentCompleted,
      percentPending,
      avgCompletionTimeMs: avgTime,
      productivityByDay,
      abandonmentRate
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generating metrics' });
  }
};

exports.createTask = async (req, res) => {
  const { title, description, status } = req.body;
  const task = await Task.create({
    title,
    description,
    status,
    user: req.user._id
  });
  res.status(201).json(task);
};

const Task = require('../models/Task');

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const task = await Task.findOne({ _id: id, user: req.userId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found or no authorization' });
        }

        if (updates.status === 'Completed' && task.status !== 'Completed') {
            updates.completedAt = new Date();
        }

        if (task.status === 'Completed' && updates.status !== 'Completed') {
            updates.completedAt = null;
        }

        const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });
        res.json(updatedTask);

    } catch (err) {
        console.error('Error actualizando tarea:', err);
        res.status(500).json({ error: 'Error Updating Task' });
    }
};



exports.deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ error: 'No Task Found' });
  res.json({ message: 'Task Deleted' });
};
