import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import InventoryTab from "../components/dashboard/InventoryTab";
import SalesHistoryTab from "../components/dashboard/SalesHistoryTab";
import PrintReceipt from "../components/dashboard/PrintReceipt";
import SupplyTab from "../components/dashboard/SupplyTab";
import SupplyHistoryTab from "../components/dashboard/SupplyHistoryTab";
import ThemeToggle from "../components/ThemeToggle";
import { EditIcon,TrashIcon } from "../components/Icons";
import ConfirmLogout from "../components/ConfirmLogout";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // ==========================================
  // 1. EDIT & QUICK ADD STATE
  // ==========================================
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: "",
    stock_qty: "",
    product_description: "",
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newInlineProduct, setNewInlineProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock_qty: "",
    product_description: "",
  });

  // Universal loading state
  const [loading, setLoading] = useState(false);

  // ==========================================
  // 2. SORTING STATE & LOGIC
  // ==========================================
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  // ==========================================
  // 3. SUPPLY FORM STATE
  // ==========================================
  const [supplyInfo, setSupplyInfo] = useState({
    supplierName: "",
    invoiceNumber: "",
    totalCost: "",
  });
  const [supplyItems, setSupplyItems] = useState([
    {
      product_id: null,
      name: "",
      category: "",
      product_description: "",
      wholesale_price: "",
      retail_price: "",
      quantity: "",
    },
  ]);


  // ==========================================
  // 4. SUPPLY HISTORY STATE
  // ==========================================
  const [historyList, setHistoryList] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detailItems, setDetailItems] = useState([]);

  // ==========================================
  // 5. SALES HISTORY STATE
  // ==========================================
  const [salesList, setSalesList] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    if (activeTab === "salesHistory") fetchSalesHistory();
  }, [activeTab]);


  // --- API FETCH FUNCTIONS ---

  const fetchSuppliers = async () => {
    try {
      const response = await API.get("/suppliers");
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await API.get("/products");
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      )
        handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await API.get("/supply/history");
      setHistoryList(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryDetails = async (delivery) => {
    setLoading(true);
    try {
      const response = await API.get(`/supply/history/${delivery.id}`);
      setDetailItems(response.data);
      setSelectedDelivery(delivery);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const response = await API.get("/billing/history");
      setSalesList(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (sale) => {
    setLoading(true);
    try {
      const response = await API.get(`/billing/history/${sale.id}`);
      setSaleItems(response.data);
      setSelectedSale(sale);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // --- ACTION HANDLERS ---
  const handleQuickAddSave = async () => {
    try {
      setLoading(true);
      await API.post("/products", newInlineProduct);
      setIsAddingNew(false);
      setNewInlineProduct({
        name: "",
        category: "",
        price: "",
        stock_qty: "",
        product_description: "",
      });
      fetchInventory();
    } catch {
      alert("Failed to quick-add product.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock_qty: product.stock_qty,
      product_description: product.product_description,
    });
  };

  const handleSaveEdit = async (id) => {
    if (!window.confirm("Are you sure you want to save these changes?")) return;
    setLoading(true);
    try {
      await API.put(`/products/${id}`, editForm);
      setEditingId(null);
      fetchInventory();
    } catch {
      alert("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (
      !window.confirm(
        "⚠️ WARNING: Are you sure you want to delete this product? This action cannot be undone.",
      )
    )
      return;
    setLoading(true);
    try {
      await API.delete(`/products/${id}`);
      fetchInventory();
    } catch {
      alert(
        "Failed to delete product. It may be linked to previous deliveries/sales.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- SUPPLY HANDLERS ---
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...supplyItems];
    updatedItems[index][field] = value;
    setSupplyItems(updatedItems);
  };

  const handleNameChange = (index, value) => {
    const updatedItems = [...supplyItems];
    updatedItems[index].name = value;
    const existingProduct = products.find(
      (p) => p.name.toLowerCase().trim() === value.toLowerCase().trim(),
    );

    if (existingProduct) {
      updatedItems[index].product_id = existingProduct.id;
      updatedItems[index].category = existingProduct.category;
      updatedItems[index].product_description =
        existingProduct.product_description;
      updatedItems[index].retail_price = existingProduct.price;
    } else {
      updatedItems[index].product_id = null;
      updatedItems[index].category = "⚠️ UNKNOWN PRODUCT";
      updatedItems[index].product_description = "Must add to inventory first";
      updatedItems[index].retail_price = "";
    }
    setSupplyItems(updatedItems);
  };

  const addLineItem = () =>
    setSupplyItems([
      ...supplyItems,
      {
        product_id: null,
        name: "",
        category: "",
        product_description: "",
        wholesale_price: "",
        retail_price: "",
        quantity: "",
      },
    ]);
  const removeLineItem = (index) =>
    setSupplyItems(supplyItems.filter((_, i) => i !== index));

  const handleSupplySubmit = async (e) => {
    e.preventDefault();
    const invalidItems = supplyItems.filter((item) => item.product_id === null);
    if (invalidItems.length > 0)
      return alert(
        `Error: "${invalidItems[0].name}" is not in your database.\nPlease go to the 'View Inventory' tab and use '+ Quick Add Product' first!`,
      );

    try {
      await API.post("/supply", { supplyInfo, items: supplyItems });
      alert("Success! Delivery logged and inventory updated.");
      setSupplyInfo({ supplierName: "", invoiceNumber: "", totalCost: "" });
      setSupplyItems([
        {
          product_id: null,
          name: "",
          category: "",
          product_description: "",
          wholesale_price: "",
          retail_price: "",
          quantity: "",
        },
      ]);
      fetchInventory();
      setActiveTab("history");
    } catch (error) {
      alert(error.response?.data?.error || "Error saving delivery.");
    }
  };

  const canReceiveSupply = role === "Owner" || role === "Developer";
  const dashboardTabs = [
    { key: "inventory", label: "📦 View Inventory" },
    ...(canReceiveSupply ? [{ key: "addStock", label: "🚚 Receive Supply" }] : []),
    { key: "history", label: "📋 Supply Ledger" },
    { key: "salesHistory", label: "📈 Sales History" },
  ];
  const activeTabLabel =
    dashboardTabs.find((tab) => tab.key === activeTab)?.label || "Dashboard Menu";

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setIsTabMenuOpen(false);
  };

  const handleMenuNavigate = (path) => {
    setIsTabMenuOpen(false);
    navigate(path);
  };

  
  // ==========================
  // InventoryTab component
  // ==========================

  return (
    <div>
      {/* CSS specifically for the Thermal Receipt Printer format */}
      <style>
        {`
                @media print {
                    @page { margin: 0; } 
                    body * { visibility: hidden; }
                    .print-container, .print-container * { visibility: visible; }
                    .print-container { 
                        position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 10mm 5mm; 
                        font-family: 'Courier New', Courier, monospace; font-size: 12px; color: black; background: white;
                    }
                    .no-print { display: none !important; }
                }
                @media screen { .print-container { display: none; } }
                `}
      </style>

      <div className="no-print dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>
              <u>Bharat Automobiles {role} Dashboard </u>
            </h1>
          </div>
          <div className="header-actions">
            <ThemeToggle/>
            <button onClick={() => setShowLogoutConfirm(true)} className="btn btn-danger">
              Logout
            </button>
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <div className={`tab-container ${isTabMenuOpen ? "menu-open" : ""}`}>
          <button
            type="button"
            className="mobile-tab-toggle"
            aria-expanded={isTabMenuOpen}
            aria-controls="dashboard-tab-menu"
            onClick={() => setIsTabMenuOpen((isOpen) => !isOpen)}
          >
            <span className="hamburger-icon" aria-hidden="true">☰</span>
            <span>{activeTabLabel}</span>
          </button>

          <div className="tab-menu" id="dashboard-tab-menu">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabSelect(tab.key)}
                className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}

            {(canReceiveSupply) &&
            (<button
              type="button"
              onClick={() => handleMenuNavigate("/supplybook")}
              className="btn btn-success nav-action-btn nav-action-primary"
            >
              Supply Book
            </button>)
            }
            <button
              type="button"
              onClick={() => handleMenuNavigate("/billing")}
              className="btn btn-success nav-action-btn"
            >
              🧾 Billing POS
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loader">⏳ Fetching live data from cloud...</div>
        ) : (
          <>
            {/* TAB 1: INVENTORY TABLE */}
            {activeTab === "inventory" && (
              <InventoryTab
                role={role}
                sortedProducts={sortedProducts}
                sortConfig={sortConfig}
                requestSort={requestSort}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isAddingNew={isAddingNew}
                setIsAddingNew={setIsAddingNew}
                newInlineProduct={newInlineProduct}
                setNewInlineProduct={setNewInlineProduct}
                handleQuickAddSave={handleQuickAddSave}
                editingId={editingId}
                setEditingId={setEditingId}
                editForm={editForm}
                setEditForm={setEditForm}
                handleSaveEdit={handleSaveEdit}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
              />
            )}

            {/* TAB 2: ADVANCED SUPPLY FORM */}
            {activeTab === "addStock" && (
              <SupplyTab
                supplyInfo={supplyInfo}
                setSupplyInfo={setSupplyInfo}
                supplyItems={supplyItems}
                setSupplyItems={setSupplyItems}
                products={products}
                suppliers={suppliers}
                handleNameChange={handleNameChange}
                handleItemChange={handleItemChange}
                addLineItem={addLineItem}
                removeLineItem={removeLineItem}
                handleSupplySubmit={handleSupplySubmit}
              />
            )}

            {/* TAB 3: SUPPLY HISTORY */}
            {activeTab === "history" && (
              <SupplyHistoryTab
                historyList={historyList}
                selectedDelivery={selectedDelivery}
                setSelectedDelivery={setSelectedDelivery}
                detailItems={detailItems}
                fetchDeliveryDetails={fetchDeliveryDetails}
              />
            )}

            {/* TAB 4: SALES HISTORY 📈 */}
            {activeTab === "salesHistory" && (
              <SalesHistoryTab
                salesList={salesList}
                selectedSale={selectedSale}
                setSelectedSale={setSelectedSale}
                saleItems={saleItems}
                fetchSaleDetails={fetchSaleDetails}
              />
            )}
          </>
        )}
      </div>

      {/* ========================================== */}
      {/* HIDDEN PRINT RECEIPT (Triggers when reprinting a bill) */}
      {/* ========================================== */}
      {selectedSale && (
        <PrintReceipt selectedSale={selectedSale} saleItems={saleItems} />
      )}
      <div>
        {/* LOGOUT CONFIRMATION MODAL */}
        {(showLogoutConfirm) && (
          <ConfirmLogout
            setShowLogoutConfirm={setShowLogoutConfirm}
          />
        )}
      </div>
    </div>
    
  );
}

export default Dashboard;
