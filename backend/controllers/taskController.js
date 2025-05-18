const Task = require('../models/Task');
const DeletedTask = require('../models/DeletedTask');


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
    const deleted = await DeletedTask.find({ user: userId });
    const abandoned = deleted.filter(t => t.status !== 'Completed');
    const abandonmentRate = deleted.length > 0
      ? (abandoned.length / deleted.length) * 100
      : 0;



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

exports.getPrediction = async (req, res) => {
  try {
    const userId = req.user._id;
    const completedTasks = await Task.find({ user: userId, status: 'Completed' });

    if (completedTasks.length === 0) {
      return res.json({ estimatedTimeMinutes: null, message: 'No completed tasks to estimate.' });
    }

    const totalTime = completedTasks.reduce((acc, task) => {
      if (task.completedAt && task.createdAt) {
        return acc + (new Date(task.completedAt) - new Date(task.createdAt));
      }
      return acc;
    }, 0);

    const avgTimeMs = totalTime / completedTasks.length;
    const avgTimeMin = avgTimeMs / 60000;

    res.json({ estimatedTimeMinutes: avgTimeMin.toFixed(2) });
  } catch (err) {
    console.error('Error generating prediction:', err);
    res.status(500).json({ error: 'Error generating prediction' });
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

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findOne({ _id: id, user: req.user._id });

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
    console.error('Error Updating Task:', err);
    res.status(500).json({ error: 'Error Updating Task' });
  }
};



exports.deleteTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ error: 'No Task Found' });

  await DeletedTask.create({
    ...task.toObject(),
    deletedAt: new Date()
  });

  await task.deleteOne();

  res.json({ message: 'Task Deleted' });
};
