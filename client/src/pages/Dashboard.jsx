import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Dashboard() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // ==========================================
    // 1. EDIT & QUICK ADD STATE
    // ==========================================
    const [editingId, setEditingId] = useState(null); 
    const [editForm, setEditForm] = useState({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newInlineProduct, setNewInlineProduct] = useState({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
    
    // Universal loading state
    const [loading, setLoading] = useState(false);

    // ==========================================
    // 2. SORTING STATE & LOGIC
    // ==========================================
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const sortedProducts = [...products].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; 
        setSortConfig({ key, direction });
    };

    // ==========================================
    // 3. SUPPLY FORM STATE
    // ==========================================
    const [supplyInfo, setSupplyInfo] = useState({ supplierName: '', invoiceNumber: '', totalCost: '' });
    const [supplyItems, setSupplyItems] = useState([
        { product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }
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
    }, []);

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        if (activeTab === 'salesHistory') fetchSalesHistory();
    }, [activeTab]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // --- API FETCH FUNCTIONS ---
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await API.get('/products');
            setProducts(response.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try { const response = await API.get('/supply/history'); setHistoryList(response.data); } 
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDeliveryDetails = async (delivery) => {
        setLoading(true);
        try { const response = await API.get(`/supply/history/${delivery.id}`); setDetailItems(response.data); setSelectedDelivery(delivery); } 
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSalesHistory = async () => {
        setLoading(true);
        try { const response = await API.get('/billing/history'); setSalesList(response.data); } 
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSaleDetails = async (sale) => {
        setLoading(true);
        try { const response = await API.get(`/billing/history/${sale.id}`); setSaleItems(response.data); setSelectedSale(sale); } 
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // --- ACTION HANDLERS ---
    const handleQuickAddSave = async () => {
        try {
            setLoading(true);
            await API.post('/products', newInlineProduct);
            setIsAddingNew(false);
            setNewInlineProduct({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
            fetchInventory();
        } catch (err) { alert("Failed to quick-add product."); }
        finally { setLoading(false); }
    };

    const handleEditClick = (product) => {
        setEditingId(product.id); 
        setEditForm({ name: product.name, brand: product.brand, price: product.price, stock_qty: product.stock_qty, product_description: product.product_description });
    };

    const handleSaveEdit = async (id) => {
        setLoading(true);
        if (!window.confirm("Are you sure you want to save these changes?")) return;
        try { await API.put(`/products/${id}`, editForm); setEditingId(null); fetchInventory(); } 
        catch (err) { alert("Failed to update product."); }
        finally { setLoading(false); }
    };

    const handleDeleteClick = async (id) => {
        setLoading(true);
        if (!window.confirm("⚠️ WARNING: Are you sure you want to delete this product? This action cannot be undone.")) return;
        try { await API.delete(`/products/${id}`); fetchInventory(); } 
        catch (err) { alert("Failed to delete product. It may be linked to previous deliveries/sales."); }
        finally { setLoading(false); }
    };

    // --- SUPPLY HANDLERS ---
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...supplyItems]; updatedItems[index][field] = value; setSupplyItems(updatedItems);
    };

    const handleNameChange = (index, value) => {
        const updatedItems = [...supplyItems];
        updatedItems[index].name = value;
        const existingProduct = products.find(p => p.name.toLowerCase().trim() === value.toLowerCase().trim());

        if (existingProduct) {
            updatedItems[index].product_id = existingProduct.id; updatedItems[index].brand = existingProduct.brand;
            updatedItems[index].product_description = existingProduct.product_description; updatedItems[index].retail_price = existingProduct.price;
        } else {
            updatedItems[index].product_id = null; updatedItems[index].brand = '⚠️ UNKNOWN PRODUCT';
            updatedItems[index].product_description = 'Must add to inventory first'; updatedItems[index].retail_price = '';
        }
        setSupplyItems(updatedItems);
    };

    const addLineItem = () => setSupplyItems([...supplyItems, { product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }]);
    const removeLineItem = (index) => setSupplyItems(supplyItems.filter((_, i) => i !== index));

    const handleSupplySubmit = async (e) => {
        e.preventDefault();
        const invalidItems = supplyItems.filter(item => item.product_id === null);
        if (invalidItems.length > 0) return alert(`Error: "${invalidItems[0].name}" is not in your database.\nPlease go to the 'View Inventory' tab and use '+ Quick Add Product' first!`);
        
        try {
            await API.post('/supply', { supplyInfo, items: supplyItems });
            alert("Success! Delivery logged and inventory updated.");
            setSupplyInfo({ supplierName: '', invoiceNumber: '', totalCost: '' });
            setSupplyItems([{ product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }]);
            fetchInventory();
            setActiveTab('history');
        } catch (error) { alert(error.response?.data?.error || "Error saving delivery."); }
    };

    // --- ICONS ---
    const EditIcon = () => ( <svg className="icon text-warning" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg> );
    const TrashIcon = () => ( <svg className="icon text-danger" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg> );

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
                        <h1><u>Bharat Automobiles Owner Dashboard </u></h1>
                        
                    </div>
                    <div className="header-actions">
                        <button
                            onClick={() => setDarkMode(prev => !prev)}
                             className="theme-toggle"
                        >
                            <span className="icon sun">☀️</span>
                            <span className="icon moon">🌙</span>
                        </button>
                        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                    </div>
                </header>

                {/* NAVIGATION TABS */}
                <div className="tab-container">
                    <button onClick={() => setActiveTab('inventory')} className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}>📦 View Inventory</button>
                    <button onClick={() => setActiveTab('addStock')} className={`tab-btn ${activeTab === 'addStock' ? 'active' : ''}`}>🚚 Receive Supply</button>
                    <button onClick={() => setActiveTab('history')} className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}>📋 Supply Ledger</button>
                    <button onClick={() => setActiveTab('salesHistory')} className={`tab-btn ${activeTab === 'salesHistory' ? 'active' : ''}`}>📈 Sales History</button>
                    <button onClick={() => navigate('/billing')} className="btn btn-success ms-auto">🧾 Billing POS</button>
                </div>

                {loading ? (
                    <div className="loader">
                        ⏳ Fetching live data from cloud...
                    </div>
                ) : (
                    <>
                        {/* TAB 1: INVENTORY TABLE */}
                        {activeTab === 'inventory' && (
                            <div className="card">
                                <div className="flex-between mb-3">
                                    <h2 className="m-0">Current Stock</h2>
                                    {!isAddingNew && (
                                        <button onClick={() => setIsAddingNew(true)} className="btn btn-primary">
                                            + Quick Add Product
                                        </button>
                                    )}
                                </div>
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th onClick={() => requestSort('name')} className="cursor-pointer">Product Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</th>
                                                <th>Brand</th>
                                                <th>Description</th>
                                                <th onClick={() => requestSort('price')} className="cursor-pointer">Retail Price {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</th>
                                                <th onClick={() => requestSort('stock_qty')} className="cursor-pointer">Stock Qty {sortConfig.key === 'stock_qty' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isAddingNew && (
                                                <tr className="bg-highlight">
                                                    <td className="font-bold"><span className="badge badge-good">New</span></td>
                                                    <td><input type="text" placeholder="Name" value={newInlineProduct.name} onChange={e => setNewInlineProduct({...newInlineProduct, name: e.target.value})} className="input-field"/></td>
                                                    <td><input type="text" placeholder="Brand" value={newInlineProduct.brand} onChange={e => setNewInlineProduct({...newInlineProduct, brand: e.target.value})} className="input-field"/></td>
                                                    <td><input type="text" placeholder="Desc" value={newInlineProduct.product_description} onChange={e => setNewInlineProduct({...newInlineProduct, product_description: e.target.value})} className="input-field"/></td>
                                                    <td><input type="number" placeholder="₹" value={newInlineProduct.price} onChange={e => setNewInlineProduct({...newInlineProduct, price: e.target.value})} className="input-field"/></td>
                                                    <td><input type="number" placeholder="Qty" value={newInlineProduct.stock_qty} onChange={e => setNewInlineProduct({...newInlineProduct, stock_qty: e.target.value})} className="input-field"/></td>
                                                    <td className="text-center flex-gap">
                                                        <button onClick={handleQuickAddSave} className="btn btn-success">Save</button>
                                                        <button onClick={() => setIsAddingNew(false)} className="btn btn-outline">Cancel</button>
                                                    </td>
                                                </tr>
                                            )}
                                            {sortedProducts.map((product, index) => (
                                                <tr key={product.id}>
                                                    <td className="font-bold text-muted">{index + 1}</td>
                                                    {editingId === product.id ? (
                                                        <>
                                                            <td><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-field"/></td>
                                                            <td><input type="text" value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} className="input-field"/></td>
                                                            <td><input type="text" value={editForm.product_description} onChange={e => setEditForm({...editForm, product_description: e.target.value})} className="input-field"/></td>
                                                            <td><input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="input-field"/></td>
                                                            <td><input type="number" value={editForm.stock_qty} onChange={e => setEditForm({...editForm, stock_qty: e.target.value})} className="input-field"/></td>
                                                            <td className="text-center flex-gap">
                                                                <button onClick={() => handleSaveEdit(product.id)} className="btn btn-success">Save</button>
                                                                <button onClick={() => setEditingId(null)} className="btn btn-outline">Cancel</button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="font-bold">{product.name}</td>
                                                            <td>{product.brand || 'N/A'}</td>
                                                            <td className="text-muted text-sm">{product.product_description || 'No description'}</td>
                                                            <td>₹{product.price}</td>
                                                            <td className="font-bold">
                                                                <span className={`badge ${product.stock_qty < 5 ? 'badge-low' : 'badge-good'}`}>{product.stock_qty}</span>
                                                            </td>
                                                            <td className="text-center">
                                                                <button onClick={() => handleEditClick(product)} title="Edit Product" className="btn-icon"><EditIcon /></button>
                                                                <button onClick={() => handleDeleteClick(product.id)} title="Delete Product" className="btn-icon"><TrashIcon /></button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: ADVANCED SUPPLY FORM */}
                        {activeTab === 'addStock' && (
                            <div className="card">
                                <h2 className="border-bottom pb-2">Receive New Delivery</h2>
                                <form onSubmit={handleSupplySubmit}>
                                    <div className="form-grid highlight-box mb-4">
                                        <div><label>Supplier</label><input type="text" required value={supplyInfo.supplierName} onChange={(e) => setSupplyInfo({...supplyInfo, supplierName: e.target.value})} className="input-field" /></div>
                                        <div><label>Invoice #</label><input type="text" required value={supplyInfo.invoiceNumber} onChange={(e) => setSupplyInfo({...supplyInfo, invoiceNumber: e.target.value})} className="input-field" /></div>
                                        <div><label>Total Cost (₹)</label><input type="number" required value={supplyInfo.totalCost} onChange={(e) => setSupplyInfo({...supplyInfo, totalCost: e.target.value})} className="input-field" /></div>
                                    </div>
                                    
                                    <h3 className="mb-3">Products in this Delivery</h3>
                                    <datalist id="product-suggestions">{products.map(p => <option key={p.id} value={p.name} />)}</datalist>
                                    
                                    {supplyItems.map((item, index) => (
                                        <div key={index} className="form-row mb-3">
                                            <input type="text" list="product-suggestions" placeholder="Type Product Name" required value={item.name} onChange={(e) => handleNameChange(index, e.target.value)} className="input-field" />
                                            <input type="number" placeholder="Wholesale (₹)" required value={item.wholesale_price} onChange={(e) => handleItemChange(index, 'wholesale_price', e.target.value)} className="input-field" />
                                            <input type="number" placeholder="Qty Arrived" required value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="input-field" />
                                            {supplyItems.length > 1 && <button type="button" onClick={() => removeLineItem(index)} className="btn btn-danger"><TrashIcon /></button>}
                                        </div>
                                    ))}
                                    
                                    <div className="flex-between mt-4 border-top pt-3">
                                        <button type="button" onClick={addLineItem} className="btn btn-outline">+ Add Another Product</button>
                                        <button type="submit" className="btn btn-primary">Process Delivery</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 3: SUPPLY HISTORY */}
                        {activeTab === 'history' && (
                            <div className="card">
                                {selectedDelivery ? (
                                    <div>
                                        <button onClick={() => setSelectedDelivery(null)} className="btn btn-outline mb-3">← Back to History List</button>
                                        <h3 className="border-bottom pb-2">Items for Invoice: {selectedDelivery.invoice_number}</h3>
                                        <p><strong>Supplier:</strong> {selectedDelivery.supplier_name} | <strong> Date:</strong> {new Date(selectedDelivery.delivery_date).toLocaleDateString('en-IN')} | <strong> Total Cost:</strong> ₹{selectedDelivery.total_cost}</p>
                                        
                                        <div className="table-wrapper mt-3">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product Name</th>
                                                        <th>Brand</th>
                                                        <th>Wholesale Price</th>
                                                        <th>Retail Price</th>
                                                        <th>Quantity Added</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailItems.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="font-bold">{item.Product_name || item.product_name}</td>
                                                            <td>{item.brand}</td>
                                                            <td>₹{item.Wholesale_price || item.wholesale_price}</td>
                                                            <td>₹{item.Retail_price || item.retail_price}</td>
                                                            <td className="font-bold text-success">+{item.Quantity_added || item.quantity_added}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="border-bottom pb-2">Recent Deliveries</h2>
                                        <div className="table-wrapper">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Delivery ID</th>
                                                        <th>Date</th>
                                                        <th>Supplier Name</th>
                                                        <th>Invoice #</th>
                                                        <th>Total Cost</th>
                                                        <th className="text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyList.map(h => (
                                                        <tr key={h.id}>
                                                            <td className="text-muted">#{h.id}</td>
                                                            <td className="text-muted">{new Date(h.delivery_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                                            <td className="font-bold">{h.supplier_name}</td>
                                                            <td>{h.invoice_number}</td>
                                                            <td>₹{h.total_cost}</td>
                                                            <td className="text-center">
                                                                <button onClick={() => fetchDeliveryDetails(h)} className="btn btn-outline">View Items</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {historyList.length === 0 && <tr><td colSpan="6" className="text-center text-muted p-4">No delivery history found.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: SALES HISTORY 📈 */}
                        {activeTab === 'salesHistory' && (
                            <div className="card">
                                {selectedSale ? (
                                    <div>
                                        <div className="flex-between mb-3">
                                            <button onClick={() => setSelectedSale(null)} className="btn btn-outline">← Back to Sales List</button>
                                            <button onClick={() => window.print()} className="btn btn-primary">🖨️ Reprint Bill</button>
                                        </div>

                                        <h3 className="border-bottom pb-2">Sale Details | Date: {new Date(selectedSale.sale_date).toLocaleDateString('en-IN')}</h3>
                                        
                                        <div className="highlight-box flex-gap mb-3">
                                            <span><strong>Subtotal:</strong> ₹{selectedSale.sub_total}</span>
                                            <span className="text-danger"><strong>Discount:</strong> -₹{selectedSale.discount_amount}</span>
                                            <span className="text-success"><strong>Final Paid:</strong> ₹{selectedSale.final_amount}</span>
                                        </div>
                                        
                                        <div className="table-wrapper mt-3">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product Name</th>
                                                        <th>Qty Sold</th>
                                                        <th>Price at Sale</th>
                                                        <th>Line Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {saleItems.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="font-bold">{item.product_name}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>₹{item.price_at_sale}</td>
                                                            <td className="font-bold text-primary">₹{item.quantity * item.price_at_sale}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="border-bottom pb-2">Past Transactions</h2>
                                        <div className="table-wrapper">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date & Time</th>
                                                        <th>Subtotal</th>
                                                        <th>Discount</th>
                                                        <th>Final Amount</th>
                                                        <th className="text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {salesList.map(sale => (
                                                        <tr key={sale.id}>
                                                            <td className="text-muted">{new Date(sale.sale_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                                            <td>₹{sale.sub_total}</td>
                                                            <td className="text-danger">₹{sale.discount_amount}</td>
                                                            <td className="font-bold text-success">₹{sale.final_amount}</td>
                                                            <td className="text-center">
                                                                <button onClick={() => fetchSaleDetails(sale)} className="btn btn-outline">View Bill</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {salesList.length === 0 && <tr><td colSpan="5" className="text-center text-muted p-4">No sales recorded yet.</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ========================================== */}
            {/* HIDDEN PRINT RECEIPT (Triggers when reprinting a bill) */}
            {/* ========================================== */}
            {/* HIDDEN PRINT RECEIPT (Triggers when reprinting a bill) */}
{/* ========================================== */}
{/* HIDDEN PRINT RECEIPT (Triggers when reprinting a bill) */}
{/* ========================================== */}
{selectedSale && (
    <div className="print-container">

        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>BHARAT AUTOMOBILES</h2>
            <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Hosamani Siddappa Circle, P.B. Road</p>
            <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Haveri - 581110</p>
            <p style={{ margin: '0', fontSize: '11px' }}>Ph: 99807 56208 | 98449 29729 | 96860 55206</p> 
            <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>website: www.bharat-automobiles.onrender.com</p>
            <p style={{ marginTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>*** DUPLICATE RECEIPT ***</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
            <span>Date:{new Date(selectedSale.sale_date).toLocaleDateString('en-IN')}</span>
            <span>Time:{new Date(selectedSale.sale_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
            <thead>
                <tr>
                    <th style={{ borderBottom: '1px solid #000', textAlign: 'left', padding: '4px 0' }}>Item</th>
                    <th style={{ borderBottom: '1px solid #000', textAlign: 'center', padding: '4px 0' }}>Qty</th>
                    <th style={{ borderBottom: '1px solid #000', textAlign: 'right', padding: '4px 0' }}>Total</th>
                </tr>
            </thead>
            <tbody>
                {saleItems.map((item, idx) => (
                    <tr key={idx}>
                        <td style={{ padding: '4px 0', wordBreak: 'break-word', paddingRight: '5px' }}>
                            {item.product_name}
                        </td>
                        <td style={{ textAlign: 'center', padding: '4px 0' }}>
                            {item.quantity}
                        </td>
                        <td style={{ textAlign: 'right', padding: '4px 0' }}>
                            {item.quantity * item.price_at_sale}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Subtotal:</span>
                <span>{selectedSale.sub_total}</span>
            </div>

            {selectedSale.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>Discount:</span>
                    <span>-{selectedSale.discount_amount}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                <span>TOTAL:</span>
                <span>Rs {selectedSale.final_amount}</span>
            </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
            <p style={{ margin: '3px 0' }}>Thank you for visiting! Please visit us again.</p>
            <p style={{ margin: '3px 0' }}>Check our website for available products.</p>
        </div>

    </div>
)}
        </div>
    );
}

export default Dashboard;