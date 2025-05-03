import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import {
  Users,
  Package,
  User,
  CheckCircle,
  Clock,
  Calendar,
  BarChart2,
  ChevronRight,
  AlertTriangle,
  Edit3,
  Share2,
  Flag
} from "lucide-react";

const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completionPercentage: 0,
    daysRemaining: 0,
    client: { name: "", email: "", phone: "" }
  });

  useEffect(() => {
    const projectRef = ref(realtimeDb, `projects/${id}`);
    const unsubscribe = onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProject(data);

        // Calculate days remaining if deadline exists
        let daysRemaining = 0;
        if (data.deadline) {
          const deadline = new Date(data.deadline);
          const today = new Date();
          daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        }

        // Calculate completion percentage
        const completionPercentage = data.tasks > 0
          ? Math.round((data.completedTasks || 0) / data.tasks * 100)
          : 0;

        setStats({
          completionPercentage: completionPercentage,
          daysRemaining: daysRemaining,
          client: {
            name: data.client?.name || "Not assigned",
            email: data.client?.email || "",
            phone: data.client?.phone || ""
          }
        });
      } else {
        navigate("/projects", { replace: true });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // Get priority color class
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Status based on completion percentage
  const getStatusInfo = () => {
    if (stats.completionPercentage >= 100) {
      return {
        label: "Completed",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-100",
        icon: <CheckCircle className="h-5 w-5" />
      };
    } else if (stats.daysRemaining < 0) {
      return {
        label: "Overdue",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-100",
        icon: <AlertTriangle className="h-5 w-5" />
      };
    } else if (stats.completionPercentage < 25) {
      return {
        label: "Just Started",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
        icon: <Clock className="h-5 w-5" />
      };
    } else {
      return {
        label: "In Progress",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-100",
        icon: <Clock className="h-5 w-5" />
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Project header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-100">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
          <div className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
                  <div className="ml-4 flex space-x-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(project.priority)}`}>
                      {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)}
                    </span>
                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-gray-600">
                  {project.description || "No description provided for this project."}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex space-x-2">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  <Edit3 size={16} className="mr-2" />
                  Edit
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  <Share2 size={16} className="mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Project metadata with improved layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex items-start bg-gray-50 p-3 rounded-xl">
                <Calendar size={20} className="mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Created</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start bg-gray-50 p-3 rounded-xl">
                <Clock size={20} className="mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Deadline</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start bg-gray-50 p-3 rounded-xl">
                <Flag size={20} className="mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Status</p>
                  <p className={`text-sm font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>

              <div className="flex items-start bg-gray-50 p-3 rounded-xl">
                <BarChart2 size={20} className="mr-3 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Completion</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stats.completionPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8 border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
            <span className="font-medium text-indigo-600">
              {stats.completionPercentage}% Complete
            </span>
          </div>
          <div className="bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {stats.daysRemaining > 0 ? `${stats.daysRemaining} days remaining` : 'Deadline passed'}
          </p>
        </div>
      </div>

      {/* Four main sections in an attractive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Team Members Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-md overflow-hidden border border-indigo-100 hover:shadow-lg transition-shadow group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users size={24} className="text-indigo-600 mr-3" />
                <h4 className="text-lg font-semibold text-indigo-900">Team Members</h4>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-4 mb-4">
              <div className="flex -space-x-2 overflow-hidden mb-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600">U{i+1}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">Manage your project team members</p>
            </div>
            <Link 
              to={`/projects/${id}/workers`} 
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform"
            >
              View team <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Materials Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-md overflow-hidden border border-blue-100 hover:shadow-lg transition-shadow group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package size={24} className="text-blue-600 mr-3" />
                <h4 className="text-lg font-semibold text-blue-900">Materials</h4>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-6 bg-blue-100 rounded"></div>
                ))}
              </div>
              <p className="text-sm text-gray-600">Track and manage project materials</p>
            </div>
            <Link 
              to={`/projects/${id}/materials`} 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform"
            >
              View materials <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Clients Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-md overflow-hidden border border-emerald-100 hover:shadow-lg transition-shadow group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <User size={24} className="text-emerald-600 mr-3" />
                <h4 className="text-lg font-semibold text-emerald-900">Clients</h4>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-4 mb-4">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                  <User size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.client.name}</p>
                  {stats.client.email && <p className="text-xs text-gray-500">{stats.client.email}</p>}
                </div>
              </div>
              <p className="text-sm text-gray-600">Manage client information</p>
            </div>
            <Link 
              to={`/projects/${id}/clients`} 
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform"
            >
              Client details <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-md overflow-hidden border border-amber-100 hover:shadow-lg transition-shadow group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle size={24} className="text-amber-600 mr-3" />
                <h4 className="text-lg font-semibold text-amber-900">Tasks</h4>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">{stats.completionPercentage}%</span>
              </div>
              <div className="bg-amber-100 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Manage project tasks and timeline</p>
            </div>
            <Link 
              to={`/projects/${id}/tasks`} 
              className="text-sm text-amber-600 hover:text-amber-800 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform"
            >
              View tasks <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity with enhanced styling */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all</button>
          </div>
          <div className="space-y-4">
            {project.activities ? (
              project.activities.slice(0, 3).map((activity, i) => (
                <div key={i} className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">{activity.userInitials || 'User'}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500">No recent activity to show</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;