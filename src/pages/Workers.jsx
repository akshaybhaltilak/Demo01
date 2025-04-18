import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update, set, get } from "firebase/database";
import { useParams } from "react-router-dom";
import { FaUserPlus, FaTrash, FaUsers, FaEdit, FaCheck, FaPhone, FaWhatsapp, FaFilter, FaSortAmountDown, FaCalendarCheck, FaCalendarAlt, FaUserClock, FaMoneyBillWave, FaHistory } from "react-icons/fa";
import { toast } from "react-toastify";

const Contractors = () => {
  const { id } = useParams();
  const [contractors, setContractors] = useState([]);
  const [contractorData, setContractorData] = useState({
    name: "", type: "", wage: "", contact: "", joiningDate: "", address: "", isRegular: false
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [contractorTypes, setContractorTypes] = useState([
    "Mason", "Laborer", "Carpenter", "Plumber", "Electrician", 
    "Painter", "Welder", "Machine Operator", "Supervisor", "Helper"
  ]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [customType, setCustomType] = useState("");
  const [filterByType, setFilterByType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({
    totalPresent: 0,
    totalAmount: 0
  });
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [workerCount, setWorkerCount] = useState({});
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  useEffect(() => {
    if (!id) return;
    const contractorsRef = ref(realtimeDb, `projects/${id}/contractors`);

    onValue(contractorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contractorList = Object.entries(data).map(([contractorId, contractorData]) => ({
          id: contractorId, ...contractorData
        }));
        
        // Extract unique contractor types
        const types = contractorList.map(contractor => contractor.type);
        const uniqueTypes = [...new Set(types)].filter(type => 
          type && !contractorTypes.includes(type)
        );
        
        if (uniqueTypes.length > 0) {
          setContractorTypes(prev => [...prev, ...uniqueTypes]);
        }
        
        setContractors(contractorList);
      } else {
        setContractors([]);
      }
      setLoading(false);
    });
  }, [id, contractorTypes]);

  // Load worker counts for contractors
  useEffect(() => {
    if (!id) return;
    
    const workersCountRef = ref(realtimeDb, `projects/${id}/contractorWorkers`);
    onValue(workersCountRef, (snapshot) => {
      const data = snapshot.val() || {};
      setWorkerCount(data);
    });
  }, [id]);

  // Load attendance data for selected date
  useEffect(() => {
    if (!id || !selectedDate) return;
    
    const attendanceRef = ref(realtimeDb, `projects/${id}/attendance/${selectedDate.replace(/-/g, '')}`);
    get(attendanceRef).then((snapshot) => {
      const data = snapshot.val() || {};
      setAttendance(data);
      
      // Calculate stats
      calculateAttendanceStats(data);
    });
  }, [id, selectedDate]);

  const calculateAttendanceStats = (attendanceData) => {
    const presentContractors = Object.values(attendanceData).filter(a => a.present).length;
    
    let totalAmount = 0;
    Object.entries(attendanceData).forEach(([contractorId, data]) => {
      if (data.present) {
        const contractor = contractors.find(w => w.id === contractorId);
        if (contractor) {
          totalAmount += parseFloat(contractor.wage || 0);
        }
      }
    });
    
    setAttendanceStats({
      totalPresent: presentContractors,
      totalAmount: totalAmount
    });
  };

  const validateContractorData = () => {
    if (!contractorData.name.trim()) return "Contractor name is required";
    if (!contractorData.type.trim()) return "Contractor type is required";
    
    const wage = parseFloat(contractorData.wage);
    if (isNaN(wage) || wage <= 0) return "Valid wage amount is required";
    
    if (!contractorData.contact.trim()) return "Contact number is required";
    
    return null;
  };

  const handleAddContractor = async () => {
    const validationError = validateContractorData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const contractorsRef = ref(realtimeDb, `projects/${id}/contractors`);
      const joiningDate = contractorData.joiningDate || new Date().toISOString().split('T')[0];
      
      if (editMode && editId) {
        await update(ref(realtimeDb, `projects/${id}/contractors/${editId}`), {
          ...contractorData, joiningDate, wage: parseFloat(contractorData.wage)
        });
        toast.success("Contractor updated successfully!");
        setEditMode(false);
        setEditId(null);
      } else {
        await push(contractorsRef, {
          ...contractorData, joiningDate, wage: parseFloat(contractorData.wage),
          payments: [], workers: []
        });
        toast.success("New contractor added!");
      }

      // Add custom type if it's new
      if (contractorData.type && !contractorTypes.includes(contractorData.type)) {
        setContractorTypes(prev => [...prev, contractorData.type]);
      }

      // Reset form
      setContractorData({
        name: "", type: "", wage: "", contact: "", joiningDate: "", address: "", isRegular: false
      });
      setCustomType("");
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const handleEditContractor = (contractor) => {
    setContractorData({
      name: contractor.name,
      type: contractor.type || "",
      wage: contractor.wage,
      contact: contractor.contact,
      joiningDate: contractor.joiningDate || "",
      address: contractor.address || "",
      isRegular: contractor.isRegular || false
    });
    setEditMode(true);
    setEditId(contractor.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setContractorData({
      name: "", type: "", wage: "", contact: "", joiningDate: "", address: "", isRegular: false
    });
    setEditMode(false);
    setEditId(null);
    setCustomType("");
  };

  const handleDeleteContractor = async (contractorId, contractorName) => {
    if (window.confirm(`Remove ${contractorName} from the contractors list?`)) {
      try {
        await remove(ref(realtimeDb, `projects/${id}/contractors/${contractorId}`));
        toast.success("Contractor removed");
      } catch (error) {
        toast.error("Error: " + error.message);
      }
    }
  };

  const handleToggleAttendance = async (contractorId, isPresent) => {
    try {
      const attendancePath = `projects/${id}/attendance/${selectedDate.replace(/-/g, '')}/${contractorId}`;
      
      // Get current contractor data
      const contractor = contractors.find(w => w.id === contractorId);
      
      // Update attendance in firebase
      await set(ref(realtimeDb, attendancePath), {
        present: isPresent,
        time: new Date().toISOString(),
        wage: parseFloat(contractor?.wage || 0)
      });

      // Update local state
      setAttendance(prev => ({
        ...prev,
        [contractorId]: {
          present: isPresent,
          time: new Date().toISOString(),
          wage: parseFloat(contractor?.wage || 0)
        }
      }));

      // Recalculate stats
      const updatedAttendance = {
        ...attendance,
        [contractorId]: {
          present: isPresent,
          time: new Date().toISOString(),
          wage: parseFloat(contractor?.wage || 0)
        }
      };
      calculateAttendanceStats(updatedAttendance);

      toast.success(isPresent ? "Marked present" : "Marked absent");
    } catch (error) {
      toast.error("Error updating attendance: " + error.message);
    }
  };

  const markAllRegularContractorsPresent = async () => {
    try {
      const regularContractors = contractors.filter(contractor => contractor.isRegular);
      const attendanceDate = selectedDate.replace(/-/g, '');
      const updates = {};
      
      regularContractors.forEach(contractor => {
        updates[`projects/${id}/attendance/${attendanceDate}/${contractor.id}`] = {
          present: true,
          time: new Date().toISOString(),
          wage: parseFloat(contractor.wage || 0)
        };
      });
      
      await update(ref(realtimeDb), updates);
      
      // Update local state
      const newAttendance = { ...attendance };
      regularContractors.forEach(contractor => {
        newAttendance[contractor.id] = {
          present: true,
          time: new Date().toISOString(),
          wage: parseFloat(contractor.wage || 0)
        };
      });
      
      setAttendance(newAttendance);
      calculateAttendanceStats(newAttendance);
      
      toast.success(`Marked ${regularContractors.length} regular contractors present`);
    } catch (error) {
      toast.error("Error marking attendance: " + error.message);
    }
  };

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
      });
    } else {
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  const openWorkersModal = (contractor) => {
    setSelectedContractor(contractor);
    setShowWorkersModal(true);
    
    // Load worker data for this contractor if not already loaded
    const workersPath = `projects/${id}/contractorWorkers/${contractor.id}`;
    get(ref(realtimeDb, workersPath)).then((snapshot) => {
      const data = snapshot.val() || { count: 0, lastUpdated: new Date().toISOString() };
      setWorkerCount(prev => ({
        ...prev,
        [contractor.id]: data
      }));
    });
  };

  const updateWorkerCount = async (contractorId, count) => {
    try {
      const workersPath = `projects/${id}/contractorWorkers/${contractorId}`;
      await set(ref(realtimeDb, workersPath), {
        count: parseInt(count) || 0,
        lastUpdated: new Date().toISOString()
      });
      
      setWorkerCount(prev => ({
        ...prev,
        [contractorId]: {
          count: parseInt(count) || 0,
          lastUpdated: new Date().toISOString()
        }
      }));
      
      toast.success("Worker count updated");
    } catch (error) {
      toast.error("Error updating worker count: " + error.message);
    }
  };

  const openPaymentHistory = (contractor) => {
    setSelectedContractor(contractor);
    setShowPaymentHistory(true);
    
    // Load payment history for this contractor
    const paymentsPath = `projects/${id}/contractorPayments/${contractor.id}`;
    get(ref(realtimeDb, paymentsPath)).then((snapshot) => {
      const data = snapshot.val() || {};
      const paymentsList = Object.entries(data).map(([paymentId, payment]) => ({
        id: paymentId,
        ...payment
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setPaymentHistory(paymentsList);
    });
  };

  const handleAddPayment = async () => {
    if (!selectedContractor) return;
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    
    try {
      const paymentsRef = ref(realtimeDb, `projects/${id}/contractorPayments/${selectedContractor.id}`);
      const newPayment = {
        amount: parseFloat(paymentData.amount),
        date: paymentData.date || new Date().toISOString().split('T')[0],
        description: paymentData.description || `Payment to ${selectedContractor.name}`,
        timestamp: new Date().toISOString()
      };
      
      const newPaymentRef = await push(paymentsRef, newPayment);
      
      // Update local state
      setPaymentHistory([
        { id: newPaymentRef.key, ...newPayment },
        ...paymentHistory
      ]);
      
      // Reset form
      setPaymentData({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
      });
      
      toast.success("Payment recorded successfully");
    } catch (error) {
      toast.error("Error recording payment: " + error.message);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!selectedContractor || !paymentId) return;
    
    if (window.confirm("Are you sure you want to delete this payment record?")) {
      try {
        await remove(ref(realtimeDb, `projects/${id}/contractorPayments/${selectedContractor.id}/${paymentId}`));
        
        // Update local state
        setPaymentHistory(paymentHistory.filter(payment => payment.id !== paymentId));
        
        toast.success("Payment record deleted");
      } catch (error) {
        toast.error("Error deleting payment: " + error.message);
      }
    }
  };

  // Filter and sort contractors
  const filteredContractors = [...contractors].filter(contractor => 
    (contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     contractor.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
     contractor.contact.includes(searchTerm)) &&
    (filterByType ? contractor.type === filterByType : true)
  );

  if (sortConfig.key) {
    filteredContractors.sort((a, b) => {
      if (sortConfig.key === 'wage') {
        return sortConfig.direction === 'ascending' 
          ? parseFloat(a.wage) - parseFloat(b.wage)
          : parseFloat(b.wage) - parseFloat(a.wage);
      }
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  // Calculate statistics
  const totalContractors = contractors.length;
  const regularContractors = contractors.filter(w => w.isRegular).length;
  const averageWage = contractors.length > 0 
    ? contractors.reduce((sum, contractor) => sum + parseFloat(contractor.wage || 0), 0) / contractors.length
    : 0;
  const contractorTypeCount = contractors.reduce((acc, contractor) => {
    acc[contractor.type] = (acc[contractor.type] || 0) + 1;
    return acc;
  }, {});
  const topContractorType = Object.entries(contractorTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const totalDailyWage = contractors.reduce((sum, contractor) => sum + parseFloat(contractor.wage || 0), 0);
  const totalWorkers = Object.values(workerCount).reduce((sum, data) => sum + (parseInt(data.count) || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
        <FaUsers className="text-blue-600" />
        <span>Contractors Hub</span>
      </h2>

      {/* Contractor Form */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-700">
          {editMode ? "Edit Contractor Details" : "Add New Contractor"}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              placeholder="Contractor's name"
              value={contractorData.name}
              onChange={(e) => setContractorData({ ...contractorData, name: e.target.value })}
              className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Select role"
                value={contractorData.type}
                onChange={(e) => setContractorData({ ...contractorData, type: e.target.value })}
                onClick={() => setShowTypeDropdown(true)}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showTypeDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto border">
                <div className="p-2 border-b">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add custom type"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 p-2 border rounded-l-md outline-none"
                    />
                    <button
                      onClick={() => {
                        if (customType.trim()) {
                          setContractorData({...contractorData, type: customType.trim()});
                          setShowTypeDropdown(false);
                          setCustomType("");
                        }
                      }}
                      className="bg-blue-500 text-white px-3 rounded-r-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <ul>
                  {contractorTypes.map((type, index) => (
                    <li 
                      key={index}
                      onClick={() => {
                        setContractorData({...contractorData, type});
                        setShowTypeDropdown(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Wage (₹) *</label>
              <input
                type="number"
                placeholder="Amount"
                value={contractorData.wage}
                onChange={(e) => setContractorData({ ...contractorData, wage: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
              <input
                type="text"
                placeholder="Phone"
                value={contractorData.contact}
                onChange={(e) => setContractorData({ ...contractorData, contact: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
              <input
                type="date"
                value={contractorData.joiningDate}
                onChange={(e) => setContractorData({ ...contractorData, joiningDate: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                placeholder="Address"
                value={contractorData.address}
                onChange={(e) => setContractorData({ ...contractorData, address: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="isRegular"
              checked={contractorData.isRegular}
              onChange={(e) => setContractorData({ ...contractorData, isRegular: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isRegular" className="ml-2 text-sm font-medium text-gray-700">
              Regular Contractor (comes daily)
            </label>
          </div>
        </div>
        
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleAddContractor}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 ${
              editMode 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {editMode ? (
              <>
                <FaCheck /> Update
              </>
            ) : (
              <>
                <FaUserPlus /> Add Contractor
              </>
            )}
          </button>
          
          {editMode && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-gray-500 text-white font-medium transition hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Attendance Panel */}
      <div className="mb-6">
        <button
          onClick={() => setShowAttendancePanel(!showAttendancePanel)}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-lg border border-blue-200 flex items-center justify-center gap-2 transition-colors"
        >
          <FaCalendarCheck /> 
          <span>{showAttendancePanel ? "Hide Attendance Panel" : "Show Attendance Panel"}</span>
        </button>
        
        {showAttendancePanel && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" /> Mark Daily Attendance
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <button
                  onClick={markAllRegularContractorsPresent}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FaUserClock /> Mark All Regular Contractors
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4 flex flex-wrap gap-4">
              <div className="bg-white p-3 rounded-md shadow border border-gray-200 min-w-32">
                <div className="text-xs text-gray-500 uppercase font-bold">Contractors Present</div>
                <div className="text-2xl font-bold text-blue-600">{attendanceStats.totalPresent}/{contractors.length}</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow border border-gray-200 min-w-32">
                <div className="text-xs text-gray-500 uppercase font-bold">Today's Wages</div>
                <div className="text-2xl font-bold text-green-600">₹{attendanceStats.totalAmount.toFixed(0)}</div>
              </div>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contractors.map((contractor) => {
                    const isPresent = attendance[contractor.id]?.present || false;
                    const workerCountData = workerCount[contractor.id] || { count: 0 };
                    
                    return (
                      <tr key={contractor.id} className={`${contractor.isRegular ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {contractor.isRegular && <FaUserClock className="text-blue-500 mr-2" title="Regular Contractor" />}
                            <div className="text-sm font-medium text-gray-900">{contractor.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{contractor.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{parseFloat(contractor.wage).toFixed(0)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {workerCountData.count > 0 ? (
                              <span className="font-medium">{workerCountData.count}</span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isPresent 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleToggleAttendance(contractor.id, !isPresent)}
                              className={`px-3 py-1 rounded ${
                                isPresent 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isPresent ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stats and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Stats */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 lg:w-2/3">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Contractor Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-md shadow border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold">Total Contractors</div>
              <div className="text-2xl font-bold text-blue-600">{totalContractors}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold">Regular Contractors</div>
              <div className="text-2xl font-bold text-green-600">{regularContractors}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold">Total Workers</div>
              <div className="text-2xl font-bold text-purple-600">{totalWorkers}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold">Avg. Wage</div>
              <div className="text-2xl font-bold text-amber-600">₹{averageWage.toFixed(0)}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold">Total Daily Wage</div>
              <div className="text-2xl font-bold text-red-600">₹{totalDailyWage.toFixed(0)}</div>
            </div>
            <div className="bg-white p-3 rounded-md shadow border border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold">Main Contractor Type</div>
              <div className="text-xl font-bold text-blue-600 truncate">{topContractorType}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 lg:w-1/3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800">Search & Filter</h3>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FaFilter /> {showFilters ? "Hide" : "Show"} Filters
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, type or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-gray-800 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>
          
          {showFilters && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                <select
                  value={filterByType}
                  onChange={(e) => setFilterByType(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Types</option>
                  {contractorTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSort('name')}
                    className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${
                      sortConfig.key === 'name' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Name <FaSortAmountDown className={sortConfig.key === 'name' ? 'opacity-100' : 'opacity-0'} />
                  </button>
                  <button
                    onClick={() => handleSort('type')}
                    className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${
                      sortConfig.key === 'type' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Type <FaSortAmountDown className={sortConfig.key === 'type' ? 'opacity-100' : 'opacity-0'} />
                  </button>
                  <button
                    onClick={() => handleSort('wage')}
                    className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${
                      sortConfig.key === 'wage' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Wage <FaSortAmountDown className={sortConfig.key === 'wage' ? 'opacity-100' : 'opacity-0'} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contractors List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {filteredContractors.length} Contractors
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Wage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContractors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || filterByType
                      ? "No contractors match your search criteria"
                      : "No contractors added yet"
                    }
                  </td>
                </tr>
              ) : (
                filteredContractors.map((contractor) => {
                  const workerCountData = workerCount[contractor.id] || { count: 0 };
                  
                  return (
                    <tr key={contractor.id} className={`${contractor.isRegular ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {contractor.isRegular && <FaUserClock className="text-blue-500 mr-2" title="Regular Contractor" />}
                          <div className="text-sm font-medium text-gray-900">{contractor.name}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Since: {contractor.joiningDate || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{contractor.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{parseFloat(contractor.wage).toFixed(0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openWorkersModal(contractor)}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                        >
                          <FaUsers className="mr-1" />
                          {workerCountData.count > 0 ? workerCountData.count : "Set"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <a
                            href={`tel:${contractor.contact}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaPhone />
                          </a>
                          <a
                            href={`https://wa.me/${contractor.contact}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                          >
                            <FaWhatsapp />
                          </a>
                          <div className="text-sm text-gray-500">{contractor.contact}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditContractor(contractor)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => openPaymentHistory(contractor)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Payment History"
                          >
                            <FaMoneyBillWave />
                          </button>
                          <button
                            onClick={() => handleDeleteContractor(contractor.id, contractor.name)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workers Modal */}
      {showWorkersModal && selectedContractor && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {selectedContractor.name}'s Workers
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
              <input
                type="number"
                min="0"
                value={(workerCount[selectedContractor.id]?.count || 0)}
                onChange={(e) => updateWorkerCount(selectedContractor.id, e.target.value)}
                className="w-full p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            {workerCount[selectedContractor.id]?.lastUpdated && (
              <p className="text-sm text-gray-500 mb-4">
                Last updated: {new Date(workerCount[selectedContractor.id].lastUpdated).toLocaleString()}
              </p>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowWorkersModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedContractor && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaHistory className="text-blue-600" />
                Payment History: {selectedContractor.name}
              </h3>
              <button
                onClick={() => setShowPaymentHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Add New Payment */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
              <h4 className="text-sm font-semibold mb-3">Add New Payment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={paymentData.description}
                    onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="Payment description"
                  />
                </div>
              </div>
              <button
                onClick={handleAddPayment}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <FaMoneyBillWave /> Record Payment
              </button>
            </div>
            
            {/* Payment History Table */}
            <div className="max-h-96 overflow-y-auto">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No payment records found for this contractor
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{parseFloat(payment.amount).toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.description || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => deletePayment(payment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Summary */}
            {paymentHistory.length > 0 && (
              <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Total Payments:</span>
                  <span className="font-bold text-lg text-blue-800">
                    ₹{paymentHistory.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contractors;