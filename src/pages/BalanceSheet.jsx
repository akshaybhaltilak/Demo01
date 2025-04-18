import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, onValue, get } from "firebase/database";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaDownload, FaChartBar, FaFilter, FaSearch, FaPrint } from "react-icons/fa";

const BalanceSheet = () => {
  const { id } = useParams();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  
  // New state for category summaries
  const [categorySummary, setCategorySummary] = useState({
    sites: { total: 0, received: 0, pending: 0 },
    workers: { total: 0, received: 0, pending: 0 },
    materials: { total: 0, received: 0, pending: 0 },
    general: { total: 0, received: 0, pending: 0 },
  });

  useEffect(() => {
    if (!id) return;

    // Fetch project details to get the name
    const projectRef = ref(realtimeDb, `projects/${id}`);
    onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.name) {
        setProjectName(data.name);
      }
    });

    // Set loading state while fetching
    setLoading(true);
    
    // Create promises for all data fetching operations
    const fetchData = async () => {
      try {
        // Fetch general payments data
        const generalPaymentsPromise = get(ref(realtimeDb, `projects/${id}/payments`));
        
        // Fetch site payments
        const sitePaymentsPromise = get(ref(realtimeDb, `projects/${id}/sites`));
        
        // Fetch worker payments
        const workerPaymentsPromise = get(ref(realtimeDb, `projects/${id}/workers`));
        
        // Fetch material payments
        const materialPaymentsPromise = get(ref(realtimeDb, `projects/${id}/materials`));
        
        // Wait for all promises to resolve
        const [generalPaymentsSnapshot, sitePaymentsSnapshot, workerPaymentsSnapshot, materialPaymentsSnapshot] = 
          await Promise.all([generalPaymentsPromise, sitePaymentsPromise, workerPaymentsPromise, materialPaymentsPromise]);
        
        // Process all payment data
        let allPayments = [];
        let summary = {
          sites: { total: 0, received: 0, pending: 0 },
          workers: { total: 0, received: 0, pending: 0 },
          materials: { total: 0, received: 0, pending: 0 },
          general: { total: 0, received: 0, pending: 0 },
        };
        
        // Process general payments
        const generalData = generalPaymentsSnapshot.val();
        if (generalData) {
          const generalPayments = Object.entries(generalData).map(([paymentId, paymentData]) => ({
            id: paymentId,
            category: "General",
            ...paymentData,
          }));
          
          allPayments = [...allPayments, ...generalPayments];
          
          // Update general summary
          summary.general.total = generalPayments.reduce((sum, pay) => sum + Number(pay.amount), 0);
          summary.general.received = generalPayments.reduce(
            (sum, pay) => sum + (pay.status === "Received" ? Number(pay.amount) : 0), 0
          );
          summary.general.pending = summary.general.total - summary.general.received;
        }
        
        // Process site payments
        const sitesData = sitePaymentsSnapshot.val();
        if (sitesData) {
          Object.entries(sitesData).forEach(([siteId, siteData]) => {
            if (siteData.payments) {
              const sitePayments = Object.entries(siteData.payments).map(([paymentId, paymentData]) => ({
                id: paymentId,
                category: "Sites",
                siteId,
                siteName: siteData.name || "Unknown Site",
                ...paymentData,
              }));
              
              allPayments = [...allPayments, ...sitePayments];
              
              // Update sites summary
              summary.sites.total += sitePayments.reduce((sum, pay) => sum + Number(pay.amount), 0);
              summary.sites.received += sitePayments.reduce(
                (sum, pay) => sum + (pay.status === "Received" ? Number(pay.amount) : 0), 0
              );
            }
          });
          summary.sites.pending = summary.sites.total - summary.sites.received;
        }
        
        // Process worker payments
        const workersData = workerPaymentsSnapshot.val();
        if (workersData) {
          Object.entries(workersData).forEach(([workerId, workerData]) => {
            if (workerData.payments) {
              const workerPayments = Object.entries(workerData.payments).map(([paymentId, paymentData]) => ({
                id: paymentId,
                category: "Workers",
                workerId,
                workerName: workerData.name || "Unknown Worker",
                ...paymentData,
              }));
              
              allPayments = [...allPayments, ...workerPayments];
              
              // Update workers summary
              summary.workers.total += workerPayments.reduce((sum, pay) => sum + Number(pay.amount), 0);
              summary.workers.received += workerPayments.reduce(
                (sum, pay) => sum + (pay.status === "Received" ? Number(pay.amount) : 0), 0
              );
            }
          });
          summary.workers.pending = summary.workers.total - summary.workers.received;
        }
        
        // Process material payments
        const materialsData = materialPaymentsSnapshot.val();
        if (materialsData) {
          Object.entries(materialsData).forEach(([materialId, materialData]) => {
            if (materialData.payments) {
              const materialPayments = Object.entries(materialData.payments).map(([paymentId, paymentData]) => ({
                id: paymentId,
                category: "Materials",
                materialId,
                materialName: materialData.name || "Unknown Material",
                ...paymentData,
              }));
              
              allPayments = [...allPayments, ...materialPayments];
              
              // Update materials summary
              summary.materials.total += materialPayments.reduce((sum, pay) => sum + Number(pay.amount), 0);
              summary.materials.received += materialPayments.reduce(
                (sum, pay) => sum + (pay.status === "Received" ? Number(pay.amount) : 0), 0
              );
            }
          });
          summary.materials.pending = summary.materials.total - summary.materials.received;
        }
        
        // Format dates consistently and sort payments by date (newest first)
        allPayments = allPayments.map(payment => {
          // Ensure date is in DD/MM/YYYY format
          const formattedDate = payment.date.includes('/')
            ? payment.date
            : new Date(payment.date).toLocaleDateString('en-GB');
          
          return {
            ...payment,
            date: formattedDate
          };
        }).sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-'));
          const dateB = new Date(b.date.split('/').reverse().join('-'));
          return dateB - dateA;
        });
        
        // Update state with all payment data
        setPayments(allPayments);
        setFilteredPayments(allPayments);
        setCategorySummary(summary);
        
        // Calculate totals across all categories
        const totalBudgetSum = summary.general.total + summary.sites.total + 
                            summary.workers.total + summary.materials.total;
        const receivedAmountSum = summary.general.received + summary.sites.received + 
                               summary.workers.received + summary.materials.received;
        const pendingAmountSum = totalBudgetSum - receivedAmountSum;
        
        setTotalBudget(totalBudgetSum);
        setReceivedAmount(receivedAmountSum);
        setPendingAmount(pendingAmountSum);
        
      } catch (error) {
        console.error("Error fetching payment data:", error);
        setPayments([]);
        setFilteredPayments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Filter payments based on search term, status filter, and category filter
  useEffect(() => {
    let result = payments;
    
    if (searchTerm) {
      result = result.filter(payment => 
        (payment.date && payment.date.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.amount && payment.amount.toString().includes(searchTerm)) ||
        (payment.mode && payment.mode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.status && payment.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.category && payment.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.siteName && payment.siteName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.workerName && payment.workerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.materialName && payment.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterStatus !== "All") {
      result = result.filter(payment => payment.status === filterStatus);
    }
    
    if (filterCategory !== "All") {
      result = result.filter(payment => payment.category === filterCategory);
    }
    
    setFilteredPayments(result);
  }, [searchTerm, filterStatus, filterCategory, payments]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add header with project name
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 255);
    doc.text(`Balance Sheet - ${projectName}`, 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Add table
    autoTable(doc, {
      startY: 30,
      headStyles: { fillColor: [0, 0, 128], textColor: [255, 255, 255] },
      head: [["Date", "Category", "Details", "Amount (₹)", "Payment Mode", "Status", "Notes"]],
      body: filteredPayments.map(({ date, category, siteName, workerName, materialName, amount, mode, status, notes = "-" }) => [
        date, 
        category,
        category === "Sites" ? siteName : 
        category === "Workers" ? workerName : 
        category === "Materials" ? materialName : "-",
        amount.toLocaleString('en-IN'), 
        mode, 
        status,
        notes || "-"
      ]),
    });
    
    // Add summary after table
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Payment Summary", 14, finalY);
    
    doc.setFont(undefined, 'normal');
    doc.text(`Total Budget: ₹${totalBudget.toLocaleString('en-IN')}`, 14, finalY + 7);
    
    doc.setTextColor(0, 128, 0);
    doc.text(`Received Amount: ₹${receivedAmount.toLocaleString('en-IN')}`, 14, finalY + 14);
    
    doc.setTextColor(255, 0, 0);
    doc.text(`Pending Amount: ₹${pendingAmount.toLocaleString('en-IN')}`, 14, finalY + 21);
    
    // Category-wise summary
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("Category-wise Breakdown", 14, finalY + 35);
    doc.setFont(undefined, 'normal');
    
    let yPos = finalY + 42;
    
    // Sites summary
    doc.text(`Sites: ₹${categorySummary.sites.total.toLocaleString('en-IN')} total`, 14, yPos);
    doc.text(`  - Received: ₹${categorySummary.sites.received.toLocaleString('en-IN')}`, 24, yPos + 7);
    doc.text(`  - Pending: ₹${categorySummary.sites.pending.toLocaleString('en-IN')}`, 24, yPos + 14);
    
    // Workers summary
    yPos += 21;
    doc.text(`Workers: ₹${categorySummary.workers.total.toLocaleString('en-IN')} total`, 14, yPos);
    doc.text(`  - Received: ₹${categorySummary.workers.received.toLocaleString('en-IN')}`, 24, yPos + 7);
    doc.text(`  - Pending: ₹${categorySummary.workers.pending.toLocaleString('en-IN')}`, 24, yPos + 14);
    
    // Materials summary
    yPos += 21;
    doc.text(`Materials: ₹${categorySummary.materials.total.toLocaleString('en-IN')} total`, 14, yPos);
    doc.text(`  - Received: ₹${categorySummary.materials.received.toLocaleString('en-IN')}`, 24, yPos + 7);
    doc.text(`  - Pending: ₹${categorySummary.materials.pending.toLocaleString('en-IN')}`, 24, yPos + 14);
    
    // General summary
    yPos += 21;
    doc.text(`General: ₹${categorySummary.general.total.toLocaleString('en-IN')} total`, 14, yPos);
    doc.text(`  - Received: ₹${categorySummary.general.received.toLocaleString('en-IN')}`, 24, yPos + 7);
    doc.text(`  - Pending: ₹${categorySummary.general.pending.toLocaleString('en-IN')}`, 24, yPos + 14);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`${projectName}_BalanceSheet.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate percentage of received amount
  const completionPercentage = totalBudget > 0 ? (receivedAmount / totalBudget) * 100 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-xl print:shadow-none">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Balance Sheet</h2>
        {projectName && (
          <div className="text-lg text-blue-600 font-semibold">{projectName}</div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-500 text-sm">Total Budget</div>
          <div className="text-2xl font-bold text-black mt-1">₹{totalBudget.toLocaleString('en-IN')}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-500 text-sm">Received Amount</div>
          <div className="text-2xl font-bold text-green-600 mt-1">₹{receivedAmount.toLocaleString('en-IN')}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-500 text-sm">Pending Amount</div>
          <div className="text-2xl font-bold text-red-600 mt-1">₹{pendingAmount.toLocaleString('en-IN')}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-500 text-sm">Completion</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{completionPercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-blue-600 font-medium">Sites</div>
          <div className="text-xl font-bold text-blue-800 mt-1">₹{categorySummary.sites.total.toLocaleString('en-IN')}</div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600">₹{categorySummary.sites.received.toLocaleString('en-IN')} received</span>
            <span className="text-red-600">₹{categorySummary.sites.pending.toLocaleString('en-IN')} pending</span>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="text-purple-600 font-medium">Workers</div>
          <div className="text-xl font-bold text-purple-800 mt-1">₹{categorySummary.workers.total.toLocaleString('en-IN')}</div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600">₹{categorySummary.workers.received.toLocaleString('en-IN')} received</span>
            <span className="text-red-600">₹{categorySummary.workers.pending.toLocaleString('en-IN')} pending</span>
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="text-amber-600 font-medium">Materials</div>
          <div className="text-xl font-bold text-amber-800 mt-1">₹{categorySummary.materials.total.toLocaleString('en-IN')}</div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600">₹{categorySummary.materials.received.toLocaleString('en-IN')} received</span>
            <span className="text-red-600">₹{categorySummary.materials.pending.toLocaleString('en-IN')} pending</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-gray-600 font-medium">General</div>
          <div className="text-xl font-bold text-gray-800 mt-1">₹{categorySummary.general.total.toLocaleString('en-IN')}</div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600">₹{categorySummary.general.received.toLocaleString('en-IN')} received</span>
            <span className="text-red-600">₹{categorySummary.general.pending.toLocaleString('en-IN')} pending</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Payment Progress</span>
          <span className="text-sm font-semibold text-blue-600">{completionPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search payments..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Received">Received</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          
          <div className="flex items-center ml-2">
            <FaChartBar className="text-gray-500 mr-2" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Sites">Sites</option>
              <option value="Workers">Workers</option>
              <option value="Materials">Materials</option>
              <option value="General">General</option>
            </select>
          </div>
          
          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
          >
            <FaPrint /> Print
          </button>
          
          <button
            onClick={downloadPDF}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <FaDownload /> Download PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-6 print:mt-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading payment data...</p>
          </div>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="p-3 border text-left">Date</th>
                <th className="p-3 border text-left">Category</th>
                <th className="p-3 border text-left">Details</th>
                <th className="p-3 border text-left">Amount</th>
                <th className="p-3 border text-left">Payment Mode</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="text-left bg-white hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-3">{payment.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.category === "Sites" ? "bg-blue-100 text-blue-800" :
                        payment.category === "Workers" ? "bg-purple-100 text-purple-800" :
                        payment.category === "Materials" ? "bg-amber-100 text-amber-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {payment.category}
                      </span>
                    </td>
                    <td className="p-3">
                      {payment.category === "Sites" ? payment.siteName : 
                       payment.category === "Workers" ? payment.workerName : 
                       payment.category === "Materials" ? payment.materialName : "General"}
                    </td>
                    <td className="p-3 font-medium">₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                    <td className="p-3">{payment.mode}</td>
                    <td className="p-3">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "Received" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{payment.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-gray-500 text-center p-6">
                    {searchTerm || filterStatus !== "All" || filterCategory !== "All"
                      ? "No payments match your search criteria." 
                      : "No payments recorded for this project."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Summary - Only shown when printing */}
      <div className="hidden print:block mt-8">
        <h3 className="text-xl font-bold text-black">Payment Summary</h3>
        <div className="mt-2">
          <p className="mb-1">Total Budget: ₹{totalBudget.toLocaleString('en-IN')}</p>
          <p className="mb-1 text-green-600">Received Amount: ₹{receivedAmount.toLocaleString('en-IN')}</p>
          <p className="mb-1 text-red-600">Pending Amount: ₹{pendingAmount.toLocaleString('en-IN')}</p>
          
          <h4 className="mt-4 font-bold">Category Breakdown:</h4>
          <p className="mb-1">Sites: ₹{categorySummary.sites.total.toLocaleString('en-IN')} (₹{categorySummary.sites.received.toLocaleString('en-IN')} received, ₹{categorySummary.sites.pending.toLocaleString('en-IN')} pending)</p>
          <p className="mb-1">Workers: ₹{categorySummary.workers.total.toLocaleString('en-IN')} (₹{categorySummary.workers.received.toLocaleString('en-IN')} received, ₹{categorySummary.workers.pending.toLocaleString('en-IN')} pending)</p>
          <p className="mb-1">Materials: ₹{categorySummary.materials.total.toLocaleString('en-IN')} (₹{categorySummary.materials.received.toLocaleString('en-IN')} received, ₹{categorySummary.materials.pending.toLocaleString('en-IN')} pending)</p>
          <p className="mb-1">General: ₹{categorySummary.general.total.toLocaleString('en-IN')} (₹{categorySummary.general.received.toLocaleString('en-IN')} received, ₹{categorySummary.general.pending.toLocaleString('en-IN')} pending)</p>
          
          <p className="mt-2 text-sm text-gray-500">Generated on {new Date().toLocaleDateString()} for {projectName}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;