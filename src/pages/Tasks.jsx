import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update, get } from "firebase/database";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaTasks, FaPlus, FaTrash, FaCheck, FaArrowLeft, 
  FaEdit, FaCalendarAlt, FaUserAlt, FaFilter, 
  FaWhatsapp, FaPhone, FaBell, FaInfoCircle,
  FaSearch
} from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Tasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(id || "");
  const [taskData, setTaskData] = useState({
    name: "",
    assignedTo: "",
    phone: "",
    deadline: "",
    status: "Pending",
    priority: "Medium",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [showProjectSelector, setShowProjectSelector] = useState(!id);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedTaskForReminder, setSelectedTaskForReminder] = useState(null);

  // Fetch all projects
  useEffect(() => {
    const projectsRef = ref(realtimeDb, "projects");
    
    onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.entries(data).map(([projectId, projectData]) => ({
          id: projectId,
          name: projectData.name || "Untitled Project",
          description: projectData.description || ""
        }));
        setProjects(projectList);
        
        if (!selectedProject && projectList.length > 0 && !id) {
          setSelectedProject(projectList[0].id);
        }
      } else {
        setProjects([]);
      }
    });
  }, []);

  // Fetch tasks for the selected project
  useEffect(() => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }

    const tasksRef = ref(realtimeDb, `projects/${selectedProject}/tasks`);

    onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const taskList = Object.entries(data).map(([taskId, taskData]) => ({
          id: taskId,
          ...taskData,
          name: taskData.name || "",
          assignedTo: taskData.assignedTo || "",
          phone: taskData.phone || "",
          deadline: taskData.deadline || "",
          status: taskData.status || "Pending",
          priority: taskData.priority || "Medium",
          description: taskData.description || ""
        }));
        setTasks(taskList);
      } else {
        setTasks([]);
      }
      setLoading(false);
    });
  }, [selectedProject]);

  // Initialize selected project from URL parameter
  useEffect(() => {
    if (id) {
      setSelectedProject(id);
      setShowProjectSelector(false);
    }
  }, [id]);

  const handleAddTask = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }
    
    if (!taskData.name.trim()) {
      toast.error("Task name is required");
      return;
    }
    
    if (!taskData.assignedTo.trim()) {
      toast.error("Assignee is required");
      return;
    }
    
    if (!taskData.deadline.trim()) {
      toast.error("Deadline is required");
      return;
    }

    try {
      if (editingTask) {
        // Update existing task
        await update(ref(realtimeDb, `projects/${selectedProject}/tasks/${editingTask.id}`), {
          ...taskData,
          updatedAt: new Date().toISOString()
        });
        setEditingTask(null);
        toast.success("Task updated successfully!");
      } else {
        // Add new task
        await push(ref(realtimeDb, `projects/${selectedProject}/tasks`), {
          ...taskData,
          createdAt: new Date().toISOString()
        });
        toast.success("Task added successfully!");
      }

      // Reset form
      setTaskData({ 
        name: "", 
        assignedTo: "", 
        phone: "",
        deadline: "", 
        status: "Pending", 
        priority: "Medium", 
        description: "" 
      });
    } catch (error) {
      toast.error("Error saving task: " + error.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskData({
      name: task.name || "",
      assignedTo: task.assignedTo || "",
      phone: task.phone || "",
      deadline: task.deadline || "",
      status: task.status || "Pending",
      priority: task.priority || "Medium",
      description: task.description || ""
    });
    
    // Scroll to form
    document.getElementById('task-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await remove(ref(realtimeDb, `projects/${selectedProject}/tasks/${taskId}`));
        toast.success("Task deleted successfully!");
      } catch (error) {
        toast.error("Error deleting task: " + error.message);
      }
    }
  };

  const handleToggleStatus = async (taskId, currentStatus) => {
    try {
      const taskRef = ref(realtimeDb, `projects/${selectedProject}/tasks/${taskId}`);
      await update(taskRef, { 
        status: currentStatus === "Pending" ? "Completed" : "Pending",
        completedAt: currentStatus === "Pending" ? new Date().toISOString() : null
      });
      toast.success(`Task marked as ${currentStatus === "Pending" ? "Completed" : "Pending"}`);
    } catch (error) {
      toast.error("Error updating task status: " + error.message);
    }
  };

  const handleCancel = () => {
    setEditingTask(null);
    setTaskData({ 
      name: "", 
      assignedTo: "", 
      phone: "",
      deadline: "", 
      status: "Pending", 
      priority: "Medium", 
      description: "" 
    });
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    navigate(`/projects/${projectId}/tasks`);
    setShowProjectSelector(false);
  };

  const handleSendWhatsAppReminder = (task) => {
    if (!task.phone) {
      toast.error("No phone number assigned to this task");
      return;
    }
    
    setSelectedTaskForReminder(task);
    setWhatsappMessage(
      `Hi ${task.assignedTo},\n\n` +
      `This is a reminder about your task: "${task.name}"\n` +
      `Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not specified'}\n` +
      `Priority: ${task.priority || 'Medium'}\n\n` +
      `Please let me know if you have any questions.\n\n` +
      `Best regards,\n[Your Name]`
    );
    setShowWhatsAppModal(true);
  };

  const sendWhatsAppMessage = () => {
    if (!selectedTaskForReminder?.phone) {
      toast.error("Phone number is required");
      return;
    }
    
    // Format phone number (remove non-numeric characters)
    const phoneNumber = selectedTaskForReminder.phone.replace(/\D/g, '');
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
    setShowWhatsAppModal(false);
    toast.success("WhatsApp message prepared!");
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(task => 
        filter === "completed" ? task.status === "Completed" : task.status === "Pending"
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(term) || 
        task.assignedTo.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.phone && task.phone.toLowerCase().includes(term))
      );
    }
    
    // Sort by priority and deadline
    return filtered.sort((a, b) => {
      // Sort by status first (pending before completed)
      if (a.status !== b.status) {
        return a.status === "Pending" ? -1 : 1;
      }
      
      // Then sort by priority
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      const priorityA = priorityOrder[a.priority || "Medium"];
      const priorityB = priorityOrder[b.priority || "Medium"];
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then by deadline
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return 0;
    });
  };
  
  const filteredTasks = getFilteredTasks();
  const currentProject = projects.find(p => p.id === selectedProject) || {};

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-white shadow-xl rounded-xl">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* WhatsApp Reminder Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <FaWhatsapp className="text-green-500" /> Send WhatsApp Reminder
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <div className="p-2 bg-gray-50 rounded border">
                {selectedTaskForReminder?.assignedTo} ({selectedTaskForReminder?.phone})
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
              <div className="p-2 bg-gray-50 rounded border">
                {selectedTaskForReminder?.name}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none h-32"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="py-2 px-4 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={sendWhatsAppMessage}
                className="py-2 px-4 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <FaWhatsapp /> Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <FaTasks className="text-blue-600 text-3xl" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-black">Task Management</h1>
            {currentProject && currentProject.name && (
              <p className="text-blue-600">
                Project: {currentProject.name}
              </p>
            )}
          </div>
        </div>
        
        {/* {!showProjectSelector && (
          <button
            onClick={() => {
              navigate('/projects');
              setShowProjectSelector(true);
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft /> Change Project
          </button>
        )} */}
      </div>
      
      {/* Project Selector */}
      {showProjectSelector && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-xl text-black font-bold mb-3">Select Project</h3>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => handleProjectChange(project.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition duration-200 ${
                    selectedProject === project.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:shadow-md hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-bold text-black">{project.name}</h4>
                  {project.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {project.description.substring(0, 100)}{project.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No projects found.</p>
              <button 
                onClick={() => navigate('/projects/new')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Form */}
      <div id="task-form" className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
        <h3 className="text-xl font-bold text-black mb-3">
          {editingTask ? "✏️ Edit Task" : "➕ Add New Task"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
            <input
              type="text"
              placeholder="Enter task name"
              value={taskData.name}
              onChange={(e) => setTaskData({ ...taskData, name: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
            <select
              value={taskData.priority}
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
            <div className="relative">
              <FaUserAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Team member name"
                value={taskData.assignedTo}
                onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="+1234567890"
                value={taskData.phone}
                onChange={(e) => setTaskData({ ...taskData, phone: e.target.value })}
                className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">For WhatsApp reminders</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={taskData.deadline}
                onChange={(e) => setTaskData({ ...taskData, deadline: e.target.value })}
                className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              value={taskData.status}
              onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Task description, notes, or details..."
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24"
            ></textarea>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          {editingTask && (
            <button
              onClick={handleCancel}
              className="py-3 px-6 rounded-lg text-black border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleAddTask}
            className="py-3 px-6 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 justify-center"
          >
            {editingTask ? <FaEdit /> : <FaPlus />} 
            {editingTask ? "Update Task" : "Add Task"}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-blue-50 p-4 rounded-lg">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search tasks by name, assignee, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
            <FaFilter className="text-blue-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-transparent"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>
          
          <div className="tooltip" data-tip="Quick filters">
            <button 
              onClick={() => {
                setFilter('pending');
                setSearchTerm('');
              }}
              className="p-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition"
            >
              Show Pending
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-200 rounded-full mb-4"></div>
            <div className="h-4 bg-blue-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-blue-200 rounded w-48"></div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {!loading && (
        <div className="mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-blue-800 text-sm">TOTAL TASKS</h4>
                  <p className="text-2xl font-bold text-black mt-1">{tasks.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaTasks className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-green-800 text-sm">COMPLETED</h4>
                  <p className="text-2xl font-bold text-black mt-1">
                    {tasks.filter(t => t.status === "Completed").length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaCheck className="text-green-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-orange-800 text-sm">PENDING</h4>
                  <p className="text-2xl font-bold text-black mt-1">
                    {tasks.filter(t => t.status === "Pending").length}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FaBell className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-red-800 text-sm">OVERDUE</h4>
                  <p className="text-2xl font-bold text-black mt-1">
                    {tasks.filter(t => t.deadline && isOverdue(t.deadline) && t.status !== "Completed").length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FaInfoCircle className="text-red-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black">
                  <th className="p-3 text-left">Task</th>
                  <th className="p-3 text-left">Assigned To</th>
                  <th className="p-3 text-left">Deadline</th>
                  <th className="p-3 text-left">Priority</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr 
                      key={task.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition ${
                        task.status === "Completed" ? "bg-gray-50" : ""
                      } ${
                        task.deadline && isOverdue(task.deadline) && task.status !== "Completed" 
                          ? "bg-red-50 hover:bg-red-100" 
                          : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-medium flex items-center gap-2">
                          {task.name}
                          {task.phone && (
                            <button 
                              onClick={() => handleSendWhatsAppReminder(task)}
                              className="text-green-600 hover:text-green-800 transition"
                              title="Send WhatsApp reminder"
                            >
                              <FaWhatsapp />
                            </button>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>{task.assignedTo}</div>
                        {task.phone && (
                          <div className="text-xs text-blue-600 mt-1">
                            {task.phone}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                          {task.deadline && isDeadlineSoon(task.deadline) && task.status !== "Completed" && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Soon
                            </span>
                          )}
                          {task.deadline && isOverdue(task.deadline) && task.status !== "Completed" && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === "High" 
                            ? "bg-red-100 text-red-800" 
                            : task.priority === "Low"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {task.priority || "Medium"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(task.id, task.status)}
                          className={`py-1 px-3 rounded-lg text-white text-sm font-medium ${
                            task.status === "Pending" 
                              ? "bg-orange-500 hover:bg-orange-600" 
                              : task.status === "In Progress"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {task.status}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-500 hover:text-blue-700 transition"
                            title="Edit task"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete task"
                          >
                            <FaTrash />
                          </button>
                          {task.phone && (
                            <button
                              onClick={() => handleSendWhatsAppReminder(task)}
                              className="text-green-500 hover:text-green-700 transition"
                              title="Send WhatsApp reminder"
                            >
                              <FaWhatsapp />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center p-6">
                      <div className="flex flex-col items-center justify-center py-8">
                        <FaTasks className="text-gray-300 text-4xl mb-3" />
                        <h4 className="text-lg font-medium text-gray-500 mb-1">
                          {searchTerm || filter !== "all" 
                            ? "No matching tasks found" 
                            : "No tasks yet"}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {searchTerm || filter !== "all" 
                            ? "Try adjusting your search or filters" 
                            : "Add your first task using the form above"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function isDeadlineSoon(dateString) {
  if (!dateString) return false;
  const deadline = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

function isOverdue(dateString) {
  if (!dateString) return false;
  const deadline = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Compare dates only (ignore time)
  return deadline < now;
}

export default Tasks;