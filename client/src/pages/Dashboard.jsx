import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Dashboard() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    // ==========================================
    // 1. EDIT & QUICK ADD STATE
    // ==========================================
    const [editingId, setEditingId] = useState(null); 
    const [editForm, setEditForm] = useState({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newInlineProduct, setNewInlineProduct] = useState({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
    //universal loading state
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
    // 5. NEW: SALES HISTORY STATE
    // ==========================================
    const [salesList, setSalesList] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItems, setSaleItems] = useState([]);

    useEffect(() => {
        fetchInventory();
    }, []);

    // Automatically fetch history when the user clicks the corresponding tabs
    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        if (activeTab === 'salesHistory') fetchSalesHistory();
    }, [activeTab]);

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

    // NEW: Fetch Sales
    const fetchSalesHistory = async () => {
        setLoading(true);
        try { const response = await API.get('/billing/history'); setSalesList(response.data); } 
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // NEW: Fetch Sale Items
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

    // ==========================================
    // ACTION HANDLERS (Edit, Delete, Add)
    // ==========================================
    const handleQuickAddSave = async () => {
        try {
            setLoading(true);
            await API.post('/products', newInlineProduct);
            setIsAddingNew(false);
            setNewInlineProduct({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
            fetchInventory();
            alert("Success! Product quick-added to inventory.");
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
        try { await API.put(`/products/${id}`, editForm); setEditingId(null); fetchInventory(); alert("Success! Product updated."); } 
        catch (err) { alert("Failed to update product."); }
        finally { setLoading(false); }
    };

    const handleDeleteClick = async (id) => {
        setLoading(true);
        if (!window.confirm("⚠️ WARNING: Are you sure you want to delete this product? This action cannot be undone.")) return;
        try { await API.delete(`/products/${id}`); fetchInventory(); } 
        catch (err) { alert("Failed to delete product. It may be linked to previous supply deliveries."); }
        finally { setLoading(false); }
    };

    // ==========================================
    // SUPPLY HANDLERS
    // ==========================================
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
        if (invalidItems.length > 0) return alert(`Error: "${invalidItems[0].name}" is not in your database.\n\nPlease go to the 'View Inventory' tab and use '+ Quick Add Product' first!`);
        
        try {
            await API.post('/supply', { supplyInfo, items: supplyItems });
            alert("Success! Delivery logged and inventory updated.");
            setSupplyInfo({ supplierName: '', invoiceNumber: '', totalCost: '' });
            setSupplyItems([{ product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }]);
            fetchInventory();
            setActiveTab('history');
        } catch (error) { alert(error.response?.data?.error || "Error saving delivery."); }
    };

    // ==========================================
    // ICONS (SVGs)
    // ==========================================
    const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg> );
    const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg> );

    return (
        <div>
            {/* CSS FOR REPRINTING THERMAL RECEIPTS */}
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

            <div className="no-print" style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ color: '#333' }}>Bharat Automobiles - Owner Dashboard</h1>
                    <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
                    <button onClick={() => setActiveTab('inventory')} style={{ padding: '10px 20px', background: activeTab === 'inventory' ? '#0056b3' : '#e9ecef', color: activeTab === 'inventory' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>View Inventory</button>
                    <button onClick={() => setActiveTab('addStock')} style={{ padding: '10px 20px', background: activeTab === 'addStock' ? '#0056b3' : '#e9ecef', color: activeTab === 'addStock' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Receive Supply</button>
                    <button onClick={() => setActiveTab('history')} style={{ padding: '10px 20px', background: activeTab === 'history' ? '#0056b3' : '#e9ecef', color: activeTab === 'history' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Supply History</button>
                    <button onClick={() => setActiveTab('salesHistory')} style={{ padding: '10px 20px', background: activeTab === 'salesHistory' ? '#0056b3' : '#e9ecef', color: activeTab === 'salesHistory' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Sales History 📈</button>
                    {/* Notice this now navigates to your dedicated POS page */}
                    <button onClick={() => navigate('/billing')} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>Billing Desk 🧾</button>
                </div>

                {/* TAB 1: INVENTORY TABLE */}
                {activeTab === 'inventory' && (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0 }}>Current Stock</h2>
                            {!isAddingNew && (
                                <button onClick={() => setIsAddingNew(true)} style={{ background: '#0056b3', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    + Quick Add Product
                                </button>
                            )}
                        </div>
                        
                        {/* NEW: Conditional Loading UI */}
                        {loading ? (
                        <div style={{ padding: '50px 0', textAlign: 'center', fontSize: '1.2em', color: '#0056b3', fontWeight: 'bold' }}>
                            ⏳ Fetching live data from cloud...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                {/* ... your existing <thead> and <tbody> stay exactly the same here ... */}
                            </table>
                        </div>
                    )}
              


                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#0056b3', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>S.No</th>
                                        <th onClick={() => requestSort('name')} style={{ padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Product Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Brand</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
                                        <th onClick={() => requestSort('price')} style={{ padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Retail Price {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</th>
                                        <th onClick={() => requestSort('stock_qty')} style={{ padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>Stock Qty {sortConfig.key === 'stock_qty' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isAddingNew && (
                                        <tr style={{ backgroundColor: '#fff3cd', borderBottom: '2px solid #ffc107' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>New</td>
                                            <td style={{ padding: '10px' }}><input type="text" placeholder="Name" value={newInlineProduct.name} onChange={e => setNewInlineProduct({...newInlineProduct, name: e.target.value})} style={{width: '90%', padding: '5px'}}/></td>
                                            <td style={{ padding: '10px' }}><input type="text" placeholder="Brand" value={newInlineProduct.brand} onChange={e => setNewInlineProduct({...newInlineProduct, brand: e.target.value})} style={{width: '90%', padding: '5px'}}/></td>
                                            <td style={{ padding: '10px' }}><input type="text" placeholder="Desc" value={newInlineProduct.product_description} onChange={e => setNewInlineProduct({...newInlineProduct, product_description: e.target.value})} style={{width: '90%', padding: '5px'}}/></td>
                                            <td style={{ padding: '10px' }}><input type="number" placeholder="₹" value={newInlineProduct.price} onChange={e => setNewInlineProduct({...newInlineProduct, price: e.target.value})} style={{width: '80%', padding: '5px'}}/></td>
                                            <td style={{ padding: '10px' }}><input type="number" placeholder="Qty" value={newInlineProduct.stock_qty} onChange={e => setNewInlineProduct({...newInlineProduct, stock_qty: e.target.value})} style={{width: '80%', padding: '5px'}}/></td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button onClick={handleQuickAddSave} style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold' }}>Save</button>
                                                <button onClick={() => setIsAddingNew(false)} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                            </td>
                                        </tr>
                                    )}
                                    {sortedProducts.map((product, index) => (
                                        <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#555' }}>{index + 1}</td>
                                            {editingId === product.id ? (
                                                <>
                                                    <td style={{ padding: '10px' }}><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{width: '90%', padding: '5px'}}/></td>
                                                    <td style={{ padding: '10px' }}><input type="text" value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} style={{width: '90%', padding: '5px'}}/></td>
                                                    <td style={{ padding: '10px' }}><input type="text" value={editForm.product_description} onChange={e => setEditForm({...editForm, product_description: e.target.value})} style={{width: '90%', padding: '5px'}}/></td>
                                                    <td style={{ padding: '10px' }}><input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} style={{width: '80%', padding: '5px'}}/></td>
                                                    <td style={{ padding: '10px' }}><input type="number" value={editForm.stock_qty} onChange={e => setEditForm({...editForm, stock_qty: e.target.value})} style={{width: '80%', padding: '5px'}}/></td>
                                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                                        <button onClick={() => handleSaveEdit(product.id)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Save</button>
                                                        <button onClick={() => setEditingId(null)} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{product.name}</td>
                                                    <td style={{ padding: '15px' }}>{product.brand || 'N/A'}</td>
                                                    <td style={{ padding: '15px', color: '#666', fontSize: '0.9em' }}>{product.product_description || 'No description'}</td>
                                                    <td style={{ padding: '15px' }}>₹{product.price}</td>
                                                    <td style={{ padding: '15px', fontWeight: 'bold', color: product.stock_qty < 5 ? 'red' : 'green' }}>{product.stock_qty}</td>
                                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                                        <button onClick={() => handleEditClick(product)} title="Edit Product" style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '10px', color: '#ffc107' }}><EditIcon /></button>
                                                        <button onClick={() => handleDeleteClick(product.id)} title="Delete Product" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc3545' }}><TrashIcon /></button>
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
                    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Receive New Delivery</h2>
                        <form onSubmit={handleSupplySubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px', background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                                <div><label>Supplier</label><input type="text" required value={supplyInfo.supplierName} onChange={(e) => setSupplyInfo({...supplyInfo, supplierName: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></div>
                                <div><label>Invoice #</label><input type="text" required value={supplyInfo.invoiceNumber} onChange={(e) => setSupplyInfo({...supplyInfo, invoiceNumber: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></div>
                                <div><label>Total Cost (₹)</label><input type="number" required value={supplyInfo.totalCost} onChange={(e) => setSupplyInfo({...supplyInfo, totalCost: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px' }} /></div>
                            </div>
                                  {/* NEW: Conditional Loading UI */}
                        {loading ? (
                        <div style={{ padding: '50px 0', textAlign: 'center', fontSize: '1.2em', color: '#0056b3', fontWeight: 'bold' }}>
                            ⏳ Fetching live data from cloud...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                {/* ... your existing <thead> and <tbody> stay exactly the same here ... */}
                            </table>
                        </div>
                    )}

                            <h3 style={{ marginBottom: '15px' }}>Products in this Delivery</h3>
                            <datalist id="product-suggestions">{products.map(p => <option key={p.id} value={p.name} />)}</datalist>
                            {supplyItems.map((item, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr auto', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                                    <input type="text" list="product-suggestions" placeholder="Type Product Name" required value={item.name} onChange={(e) => handleNameChange(index, e.target.value)} style={{ padding: '10px' }} />
                                    <input type="number" placeholder="Wholesale (₹)" required value={item.wholesale_price} onChange={(e) => handleItemChange(index, 'wholesale_price', e.target.value)} style={{ padding: '10px' }} />
                                    <input type="number" placeholder="Qty Arrived" required value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} style={{ padding: '10px' }} />
                                    {supplyItems.length > 1 && <button type="button" onClick={() => removeLineItem(index)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}><TrashIcon /></button>}
                                </div>
                            ))}
                            <button type="button" onClick={addLineItem} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', marginBottom: '30px' }}>+ Add Another Product</button>
                            <hr style={{ border: '1px solid #eee', marginBottom: '20px' }}/>
                            <button type="submit" style={{ width: '100%', padding: '15px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Process Delivery</button>
                        </form>
                    </div>
                )}

                {/* TAB 3: SUPPLY HISTORY */}
                {activeTab === 'history' && (
                    <div style={{ background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 4px 8px rgba(0,0,0,0.1)' }}>

                              {/* NEW: Conditional Loading UI */}
                    {loading ? (
                        <div style={{ padding: '50px 0', textAlign: 'center', fontSize: '1.2em', color: '#0056b3', fontWeight: 'bold' }}>
                            ⏳ Fetching live data from cloud...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                {/* ... your existing <thead> and <tbody> stay exactly the same here ... */}
                            </table>
                        </div>
                    )}
                        {selectedDelivery ? (
                            <div>
                                <button onClick={() => setSelectedDelivery(null)} style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', background: '#e9ecef', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>← Back to History List</button>
                                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Items for Invoice: {selectedDelivery.invoice_number}</h3>
                                <p><strong>Supplier:</strong> {selectedDelivery.supplier_name} | <strong> Date:</strong> {new Date(selectedDelivery.delivery_date).toLocaleDateString('en-IN')} | <strong> Total Cost:</strong> ₹{selectedDelivery.total_cost}</p>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                    <thead style={{ backgroundColor: '#0056b3', color: 'white' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Product Name</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Brand</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Wholesale Price</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Retail Price</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Quantity Added</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailItems.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.Product_name || item.product_name}</td>
                                                <td style={{ padding: '12px' }}>{item.brand}</td>
                                                <td style={{ padding: '12px' }}>₹{item.Wholesale_price || item.wholesale_price}</td>
                                                <td style={{ padding: '12px' }}>₹{item.Retail_price || item.retail_price}</td>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#28a745' }}>+{item.Quantity_added || item.quantity_added}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            

                        )
                        : (
                            
                            <div>
                                <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Recent Deliveries</h2>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#0056b3', color: 'white' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Delivery ID</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Supplier Name</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Invoice #</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Total Cost</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyList.map(h => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '12px' }}>#{h.id}</td>
                                                <td style={{ padding: '12px', color: '#555' }}>{new Date(h.delivery_date).toLocaleDateString('en-IN')}</td>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{h.supplier_name}</td>
                                                <td style={{ padding: '12px' }}>{h.invoice_number}</td>
                                                <td style={{ padding: '12px' }}>₹{h.total_cost}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button onClick={() => fetchDeliveryDetails(h)} style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>View Items</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {historyList.length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No delivery history found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: NEW SALES HISTORY 📈 */}
                {activeTab === 'salesHistory' && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                              {/* NEW: Conditional Loading UI */}
                    {loading ? (
                        <div style={{ padding: '50px 0', textAlign: 'center', fontSize: '1.2em', color: '#0056b3', fontWeight: 'bold' }}>
                            ⏳ Fetching live data from cloud...
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                {/* ... your existing <thead> and <tbody> stay exactly the same here ... */}
                            </table>
                        </div>
                    )}
                        {selectedSale ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <button onClick={() => setSelectedSale(null)} style={{ padding: '8px 15px', cursor: 'pointer', background: '#e9ecef', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>← Back to Sales List</button>
                                    {/* TRIGGER PRINT COMMAND */}
                                    <button onClick={() => window.print()} style={{ padding: '8px 15px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Reprint Bill</button>
                                </div>

                                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                                    Sale Details | Date: {new Date(selectedSale.sale_date).toLocaleDateString('en-IN')}
                                </h3>
                                
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '1.1em' }}>
                                    <span><strong>Subtotal:</strong> ₹{selectedSale.sub_total}</span>
                                    <span style={{ color: '#dc3545' }}><strong>Discount:</strong> -₹{selectedSale.discount_amount}</span>
                                    <span style={{ color: '#28a745' }}><strong>Final Paid:</strong> ₹{selectedSale.final_amount}</span>
                                </div>
                                
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ccc' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Product Name</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Qty Sold</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Price at Sale</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleItems.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.product_name}</td>
                                                <td style={{ padding: '12px' }}>{item.quantity}</td>
                                                <td style={{ padding: '12px' }}>₹{item.price_at_sale}</td>
                                                <td style={{ padding: '12px', color: '#0056b3', fontWeight: 'bold' }}>₹{item.quantity * item.price_at_sale}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div>
                                <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Past Transactions</h2>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#0056b3', color: 'white' }}>
                                        <tr>
                                            {/* ID explicitly removed from here per your request */}
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Subtotal</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Discount</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Final Amount</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesList.map(sale => (
                                            <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '12px', color: '#555' }}>
                                                    {new Date(sale.sale_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td style={{ padding: '12px' }}>₹{sale.sub_total}</td>
                                                <td style={{ padding: '12px', color: '#dc3545' }}>₹{sale.discount_amount}</td>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#28a745' }}>₹{sale.final_amount}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button onClick={() => fetchSaleDetails(sale)} style={{ padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>View Bill</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {salesList.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No sales recorded yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* HIDDEN PRINT RECEIPT (Triggers when reprinting a bill) */}
            {/* ========================================== */}
            {selectedSale && (
                <div className="print-container">
                    <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>BHARAT AUTOMOBILES</h2>
                        <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Siddappa Circle, P.B. Road</p>
                        <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Haveri - 581110</p>
                        <p style={{ margin: '0', fontSize: '11px' }}>Ph: +91 99999 99999</p> 
                        <p style={{ margin: '5px 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>*** DUPLICATE RECEIPT ***</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
                        <span>{new Date(selectedSale.sale_date).toLocaleDateString('en-IN')}</span>
                        <span>{new Date(selectedSale.sale_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
                        <thead style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                                <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {saleItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ padding: '4px 0', wordBreak: 'break-word', paddingRight: '5px' }}>{item.product_name}</td>
                                    <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.quantity * item.price_at_sale}</td>
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
                </div>
            )}
        </div>
    );
}

export default Dashboard;