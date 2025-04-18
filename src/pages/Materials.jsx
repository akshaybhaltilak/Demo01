import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update } from "firebase/database";
import { useParams } from "react-router-dom";
import { 
  FaBox, 
  FaPlusCircle, 
  FaTrash, 
  FaRupeeSign, 
  FaEdit, 
  FaSearch,
  FaFileExport,
  FaSort,
  FaFilter,
  FaTags,
  FaListUl,
  FaChartBar,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup,
  FaPrint
} from "react-icons/fa";

const Materials = () => {
  const { id } = useParams();
  const [materials, setMaterials] = useState([]);
  const [materialData, setMaterialData] = useState({
    name: "",
    quantity: "",
    unit: "",
    price: "",
    supplier: "",
    category: "",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editMode, setEditMode] = useState(false);
  const [currentMaterialId, setCurrentMaterialId] = useState(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table", "cards", "categories"
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categories, setCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6"); // Default blue
  const [categoryColors, setCategoryColors] = useState({});

  useEffect(() => {
    if (!id) return;

    const materialsRef = ref(realtimeDb, `projects/${id}/materials`);
    const categoriesRef = ref(realtimeDb, `projects/${id}/categories`);

    // Fetch materials
    onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const materialList = Object.entries(data).map(([materialId, materialData]) => ({
          id: materialId,
          ...materialData,
        }));
        setMaterials(materialList);
      } else {
        setMaterials([]);
      }
      setLoading(false);
    });

    // Fetch categories
    onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCategories(Object.entries(data).map(([id, value]) => ({ id, ...value })));
        
        // Set up category colors
        const colors = {};
        Object.entries(data).forEach(([id, category]) => {
          colors[category.name] = category.color || "#3B82F6";
        });
        setCategoryColors(colors);
        
        // Initialize expanded categories
        const expanded = {};
        Object.entries(data).forEach(([id, category]) => {
          expanded[category.name] = true; // Start with all categories expanded
        });
        setExpandedCategories(expanded);
      } else {
        setCategories([]);
      }
    });
  }, [id]);

  const handleAddMaterial = async () => {
    if (materialData.name.trim() && materialData.quantity.trim() && materialData.unit.trim() && materialData.price.trim()) {
      if (editMode && currentMaterialId) {
        // Update existing material
        const materialRef = ref(realtimeDb, `projects/${id}/materials/${currentMaterialId}`);
        update(materialRef, materialData);
        setEditMode(false);
        setCurrentMaterialId(null);
      } else {
        // Add new material
        const materialsRef = ref(realtimeDb, `projects/${id}/materials`);
        push(materialsRef, materialData);
      }
      
      // Reset form
      setMaterialData({ 
        name: "", 
        quantity: "", 
        unit: "", 
        price: "", 
        supplier: "",
        category: materialData.category, // Keep the last selected category for convenience
        notes: "",
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleEditMaterial = (material) => {
    setMaterialData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      price: material.price,
      supplier: material.supplier || "",
      category: material.category || "",
      notes: material.notes || "",
      date: material.date || new Date().toISOString().split('T')[0]
    });
    setEditMode(true);
    setCurrentMaterialId(material.id);
    // Scroll to form
    document.getElementById('materialForm').scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setMaterialData({ 
      name: "", 
      quantity: "", 
      unit: "", 
      price: "", 
      supplier: "",
      category: materialData.category, // Keep the category selection
      notes: "",
      date: new Date().toISOString().split('T')[0]
    });
    setEditMode(false);
    setCurrentMaterialId(null);
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      remove(ref(realtimeDb, `projects/${id}/materials/${materialId}`));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const categoriesRef = ref(realtimeDb, `projects/${id}/categories`);
      push(categoriesRef, { 
        name: newCategory, 
        color: newCategoryColor,
        createdAt: new Date().toISOString() 
      });
      setNewCategory("");
      setNewCategoryColor("#3B82F6");
      setShowAddCategoryModal(false);
    }
  };

  const deleteCategory = (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category? Materials in this category will NOT be deleted, but will no longer be categorized.")) {
      remove(ref(realtimeDb, `projects/${id}/categories/${categoryId}`));
      
      // Update all materials in this category to have no category
      const categoryToDelete = categories.find(cat => cat.id === categoryId);
      if (categoryToDelete) {
        materials.forEach(material => {
          if (material.category === categoryToDelete.name) {
            const materialRef = ref(realtimeDb, `projects/${id}/materials/${material.id}`);
            update(materialRef, { ...material, category: "" });
          }
        });
      }
    }
  };

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  const filteredMaterials = [...materials]
    .filter(material => 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!showLowStock || parseFloat(material.quantity) < lowStockThreshold) &&
      (selectedCategory === "all" || material.category === selectedCategory || 
       (selectedCategory === "uncategorized" && (!material.category || material.category === "")))
    );
  
  const sortedMaterials = [...filteredMaterials]
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "quantity") {
        return sortDirection === "asc"
          ? parseFloat(a.quantity) - parseFloat(b.quantity)
          : parseFloat(b.quantity) - parseFloat(a.quantity);
      } else if (sortField === "price") {
        return sortDirection === "asc"
          ? parseFloat(a.price) - parseFloat(b.price)
          : parseFloat(b.price) - parseFloat(a.price);
      } else if (sortField === "total") {
        const totalA = parseFloat(a.price) * parseFloat(a.quantity);
        const totalB = parseFloat(b.price) * parseFloat(b.quantity);
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      } else if (sortField === "category") {
        const catA = a.category || "";
        const catB = b.category || "";
        return sortDirection === "asc" 
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      }
      return 0;
    });

  const calculateTotal = (materialsArray = materials) => {
    return materialsArray.reduce((sum, material) => {
      return sum + (parseFloat(material.price) * parseFloat(material.quantity) || 0);
    }, 0).toFixed(2);
  };

  // Get materials grouped by category
  const materialsByCategory = {};
  sortedMaterials.forEach(material => {
    const category = material.category || "Uncategorized";
    if (!materialsByCategory[category]) {
      materialsByCategory[category] = [];
    }
    materialsByCategory[category].push(material);
  });

  const exportToCSV = () => {
    const headers = ["Name", "Category", "Quantity", "Unit", "Price (₹)", "Supplier", "Date", "Notes", "Total"];
    const csvData = sortedMaterials.map(material => [
      material.name,
      material.category || "Uncategorized",
      material.quantity,
      material.unit,
      material.price,
      material.supplier || "N/A",
      material.date || "N/A",
      material.notes || "",
      (parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `material_inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-xl rounded-xl border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <FaBox className="text-blue-600" /> 
          <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            Material Inventory Management
          </span>
        </h2>
        <p className="text-gray-600 mt-2">Efficiently track, manage and optimize your project materials</p>
      </div>

      {/* Add/Edit Material Form */}
      <div id="materialForm" className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 transition-all hover:shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          {editMode ? (
            <><FaEdit className="mr-2 text-blue-500" /> Edit Material</>
          ) : (
            <><FaPlusCircle className="mr-2 text-blue-500" /> Add New Material</>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name*</label>
            <input
              type="text"
              placeholder="e.g., Cement, Bricks"
              value={materialData.name}
              onChange={(e) => setMaterialData({ ...materialData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex gap-2">
              <select
                value={materialData.category}
                onChange={(e) => setMaterialData({ ...materialData, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">-- Select Category --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition-colors"
                title="Add New Category"
              >
                <FaPlusCircle />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
            <input
              type="text"
              placeholder="e.g., 10, 25.5"
              value={materialData.quantity}
              onChange={(e) => setMaterialData({ ...materialData, quantity: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit*</label>
            <input
              type="text"
              placeholder="e.g., kg, meters, pieces"
              value={materialData.unit}
              onChange={(e) => setMaterialData({ ...materialData, unit: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)*</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="e.g., 450, 1200.50"
                value={materialData.price}
                onChange={(e) => setMaterialData({ ...materialData, price: e.target.value })}
                className="w-full p-3 pl-8 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              placeholder="e.g., ABC Suppliers"
              value={materialData.supplier}
              onChange={(e) => setMaterialData({ ...materialData, supplier: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={materialData.date}
              onChange={(e) => setMaterialData({ ...materialData, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              placeholder="Any additional details..."
              value={materialData.notes}
              onChange={(e) => setMaterialData({ ...materialData, notes: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleAddMaterial}
            className={`flex-1 py-3 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2 ${
              materialData.name.trim() && materialData.quantity.trim() && materialData.unit.trim() && materialData.price.trim()
                ? "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 shadow-lg hover:shadow-blue-100"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!materialData.name.trim() || !materialData.quantity.trim() || !materialData.unit.trim() || !materialData.price.trim()}
          >
            {editMode ? (
              <><FaEdit /> Update Material</>
            ) : (
              <><FaPlusCircle /> Add Material</>
            )}
          </button>
          
          {editMode && (
            <button
              onClick={handleCancelEdit}
              className="flex-1 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition flex items-center justify-center gap-2"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaTags className="mr-2 text-blue-500" /> Add New Category
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                placeholder="e.g., Cement, Electrical, Plumbing"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Color</label>
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-full h-10 p-1 border border-gray-300 rounded-lg shadow-sm outline-none transition-all cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition ${
                  !newCategory.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!newCategory.trim()}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Search, Filters, and View Selector */}
      {!loading && materials.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* Low Stock Filter */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-2">
              <input
                type="checkbox"
                id="lowStockFilter"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <label htmlFor="lowStockFilter" className="text-gray-700">Low Stock</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-16 p-1 border border-gray-300 rounded text-center"
                disabled={!showLowStock}
              />
            </div>
            
            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition ${viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                title="Table View"
              >
                <FaListUl />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded-lg transition ${viewMode === "cards" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                title="Card View"
              >
                <FaBox />
              </button>
              <button
                onClick={() => setViewMode("categories")}
                className={`p-2 rounded-lg transition ${viewMode === "categories" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                title="Category View"
              >
                <FaLayerGroup />
              </button>
            </div>
            
            {/* Action Buttons */}
            <button
              onClick={exportToCSV}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition-colors"
              title="Export to CSV"
            >
              <FaFileExport /> Export
            </button>
            
            <button
              onClick={handlePrint}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition-colors"
              title="Print Inventory"
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>
      )}

      {/* Materials Display - Table View */}
      {!loading && viewMode === "table" && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-all hover:shadow-xl mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Material Inventory</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th 
                    className="p-4 text-left rounded-tl-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <FaSort className={`text-xs ${sortField === "name" ? "text-blue-500" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      <FaSort className={`text-xs ${sortField === "category" ? "text-blue-500" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Quantity
                      <FaSort className={`text-xs ${sortField === "quantity" ? "text-blue-500" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th className="p-4 text-center">Unit</th>
                  <th 
                    className="p-4 text-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Price (₹)
                      <FaSort className={`text-xs ${sortField === "price" ? "text-blue-500" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th 
                    className="p-4 text-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Total
                      <FaSort className={`text-xs ${sortField === "total" ? "text-blue-500" : "text-gray-400"}`} />
                    </div>
                  </th>
                  <th className="p-4 text-center">Supplier</th>
                  <th className="p-4 text-center rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMaterials.length > 0 ? (
                  sortedMaterials.map((material, index) => {
                    const isLowStock = parseFloat(material.quantity) < lowStockThreshold;
                    const categoryColor = material.category ? categoryColors[material.category] : "#9CA3AF";
                    return (
                      <tr 
                        key={material.id} 
                        className={`transition-colors ${
                          index % 2 === 0 
                            ? "bg-white" 
                            : "bg-gray-50"
                        } hover:bg-blue-50`}
                      >
                        <td className="p-4 border-b border-gray-200 font-medium text-gray-800">
                          {material.name}
                          {isLowStock && (
                            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="p-4 border-b border-gray-200">
                          {material.category ? (
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: categoryColor }}
                            >
                              {material.category}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4 border-b border-gray-200 text-center">
                          <span className="font-medium">{material.quantity}</span> {material.unit}
                        </td>
                        <td className="p-4 border-b border-gray-200 text-center">
                          {material.unit}
                        </td>
                        <td className="p-4 border-b border-gray-200 text-center">
                          <span className="flex items-center justify-center">
                            <FaRupeeSign className="text-gray-500 mr-1" size={12} />
                            {material.price}
                          </span>
                        </td>
                        <td className="p-4 border-b border-gray-200 text-center font-medium">
                          <span className="flex items-center justify-center">
                            <FaRupeeSign className="text-gray-500 mr-1" size={12} />
                            {(parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 border-b border-gray-200 text-center">
                          {material.supplier || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="p-4 border-b border-gray-200 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditMaterial(material)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Edit Material"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Delete Material"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      {searchTerm || showLowStock || selectedCategory !== "all" ? (
                        <div className="py-8">
                          <FaSearch className="mx-auto mb-3 text-gray-400 text-xl" />
                          <p>No materials match your current filters.</p>
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setShowLowStock(false);
                              setSelectedCategory("all");
                            }}
                            className="mt-2 text-blue-500 hover:text-blue-700 underline"
                          >
                            Clear all filters
                          </button>
                        </div>
                      ) : (
                        <div className="py-8">
                          <FaBox className="mx-auto mb-3 text-gray-400 text-xl" />
                          <p>No materials added yet.</p>
                          <p className="text-sm mt-1">Add your first material using the form above.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50">
                  <td colSpan="5" className="p-4 font-semibold text-right text-gray-800 rounded-bl-lg">
                    Total Inventory Value:
                  </td>
                  <td className="p-4 font-bold text-center text-blue-700">
                    <span className="flex items-center justify-center">
                      <FaRupeeSign className="mr-1" />
                      {calculateTotal(sortedMaterials)}
                    </span>
                  </td>
                  <td colSpan="2" className="rounded-br-lg"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Materials Display - Card View */}
      {!loading && viewMode === "cards" && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-all hover:shadow-xl mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Material Inventory</h3>
          
          {sortedMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedMaterials.map((material) => {
                const isLowStock = parseFloat(material.quantity) < lowStockThreshold;
                const categoryColor = material.category ? categoryColors[material.category] : "#9CA3AF";
                return (
                  <div 
                    key={material.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 text-lg">{material.name}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="Edit Material"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                          title="Delete Material"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {material.category && (
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white inline-block mb-2"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {material.category}
                      </span>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Quantity:</p>
                        <p className="font-medium">
                          {material.quantity} {material.unit}
                          {isLowStock && (
                            <span className="ml-1.5 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">
                              Low
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price:</p>
                        <p className="font-medium flex items-center">
                          <FaRupeeSign className="text-gray-500 mr-1" size={10} />
                          {material.price} / {material.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Value:</p>
                        <p className="font-medium flex items-center">
                          <FaRupeeSign className="text-gray-500 mr-1" size={10} />
                          {(parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Supplier:</p>
                        <p className="font-medium">{material.supplier || "—"}</p>
                      </div>
                    </div>
                    
                    {material.notes && (
                      <div className="mt-2 text-sm">
                        <p className="text-gray-500">Notes:</p>
                        <p className="text-gray-700">{material.notes}</p>
                      </div>
                    )}
                    
                    {material.date && (
                      <div className="mt-2 text-xs text-gray-500">
                        Added: {new Date(material.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || showLowStock || selectedCategory !== "all" ? (
                <div>
                  <FaSearch className="mx-auto mb-3 text-gray-400 text-xl" />
                  <p>No materials match your current filters.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setShowLowStock(false);
                      setSelectedCategory("all");
                    }}
                    className="mt-2 text-blue-500 hover:text-blue-700 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div>
                  <FaBox className="mx-auto mb-3 text-gray-400 text-xl" />
                  <p>No materials added yet.</p>
                  <p className="text-sm mt-1">Add your first material using the form above.</p>
                </div>
              )}
            </div>
          )}
          
          {sortedMaterials.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-right">
              <span className="font-semibold mr-2">Total Inventory Value:</span>
              <span className="font-bold text-blue-700 flex items-center justify-end">
                <FaRupeeSign className="mr-1" />
                {calculateTotal(sortedMaterials)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Materials Display - Category View */}
      {!loading && viewMode === "categories" && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-all hover:shadow-xl mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Material Inventory by Category</h3>
          
          {Object.keys(materialsByCategory).length > 0 ? (
            <div className="flex flex-col gap-4">
              {Object.entries(materialsByCategory).map(([category, materials]) => {
                const categoryColor = category !== "Uncategorized" ? categoryColors[category] : "#9CA3AF";
                const isExpanded = expandedCategories[category];
                return (
                  <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCategoryExpansion(category)}
                      style={{ borderLeft: `4px solid ${categoryColor}` }}
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="px-2.5 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {category}
                        </span>
                        <span className="text-gray-500">{materials.length} items</span>
                        <span className="font-medium text-gray-700">
                          Total: ₹{calculateTotal(materials)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {category !== "Uncategorized" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const categoryToDelete = categories.find(cat => cat.name === category);
                              if (categoryToDelete) {
                                deleteCategory(categoryToDelete.id);
                              }
                            }}
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                        {isExpanded ? (
                          <FaChevronUp className="text-gray-500" />
                        ) : (
                          <FaChevronDown className="text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-gray-700">
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-center">Quantity</th>
                                <th className="px-4 py-2 text-center">Price (₹)</th>
                                <th className="px-4 py-2 text-center">Total</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {materials.map((material) => {
                                const isLowStock = parseFloat(material.quantity) < lowStockThreshold;
                                return (
                                  <tr 
                                    key={material.id}
                                    className="hover:bg-blue-50 transition-colors"
                                  >
                                    <td className="px-4 py-2 border-b border-gray-200 font-medium text-gray-800">
                                      {material.name}
                                      {isLowStock && (
                                        <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                          Low Stock
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 border-b border-gray-200 text-center">
                                      <span className="font-medium">{material.quantity}</span> {material.unit}
                                    </td>
                                    <td className="px-4 py-2 border-b border-gray-200 text-center">
                                      <span className="flex items-center justify-center">
                                        <FaRupeeSign className="text-gray-500 mr-1" size={12} />
                                        {material.price}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 border-b border-gray-200 text-center font-medium">
                                      <span className="flex items-center justify-center">
                                        <FaRupeeSign className="text-gray-500 mr-1" size={12} />
                                        {(parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 border-b border-gray-200 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => handleEditMaterial(material)}
                                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                          title="Edit Material"
                                        >
                                          <FaEdit size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMaterial(material.id)}
                                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                          title="Delete Material"
                                        >
                                          <FaTrash size={14} />
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || showLowStock || selectedCategory !== "all" ? (
                <div>
                  <FaSearch className="mx-auto mb-3 text-gray-400 text-xl" />
                  <p>No materials match your current filters.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setShowLowStock(false);
                      setSelectedCategory("all");
                    }}
                    className="mt-2 text-blue-500 hover:text-blue-700 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div>
                  <FaBox className="mx-auto mb-3 text-gray-400 text-xl" />
                  <p>No materials added yet.</p>
                  <p className="text-sm mt-1">Add your first material using the form above.</p>
                </div>
              )}
            </div>
          )}
          
          {sortedMaterials.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-right">
              <span className="font-semibold mr-2">Total Inventory Value:</span>
              <span className="font-bold text-blue-700 flex items-center justify-end">
                <FaRupeeSign className="mr-1" />
                {calculateTotal(sortedMaterials)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* No Materials Message */}
      {!loading && materials.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
          <FaBox className="mx-auto mb-4 text-blue-500 text-4xl" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Materials Yet</h3>
          <p className="text-gray-600 mb-4">
            Start by adding your first material using the form above.
          </p>
          <p className="text-gray-500 text-sm">
            Track quantities, prices, and organize by categories to keep your inventory organized.
          </p>
        </div>
      )}
    </div>
  );
};

export default Materials;