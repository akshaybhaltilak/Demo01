import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Projects from "./pages/Projects";
import ProjectDashboard from "./pages/ProjectDashboard";
import Workers from "./pages/Workers";
import Material from "./pages/Materials";
import Sites from "./pages/Sites";
import Login from "./pages/Login";
import BalanceSheet from "./pages/BalanceSheet";
import Tasks from "./pages/Tasks";
import VastushobhaHeader from "./pages/Header";
import VastushobhaFooter from "./pages/Footer";



function App() {
  return (
    <Router>
      <VastushobhaHeader/>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/project" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDashboard />} />
        <Route path="/projects/:id/workers" element={<Workers />} />
        <Route path="/projects/:id/materials" element={<Material />} />
        <Route path="/projects/:id/clients" element={<Sites />} />
        <Route path="/projects/:id/payments" element={<BalanceSheet />} />
        <Route path="/projects/:id/tasks" element={<Tasks/>} />
      
      </Routes>
      <VastushobhaFooter/>
    </Router>
  );
}

export default App;
