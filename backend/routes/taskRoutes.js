const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getMetrics,
  getPrediction
} = require('../controllers/taskController');

// Aplica el middleware una vez para todas las rutas
router.use(auth);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.get('/metrics', getMetrics);
router.get('/prediction', getPrediction);


module.exports = router;
