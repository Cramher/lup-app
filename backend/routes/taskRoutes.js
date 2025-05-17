const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { getMetrics } = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.get('/metrics', authMiddleware, getMetrics);


module.exports = router;
