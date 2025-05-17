import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import TaskBoard from './pages/TaskBoard';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Register" element={<Register />} />
        <Route path="/" element={<div><h1>Inicio</h1></div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/tasks" element={<TaskBoard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
