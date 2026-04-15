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

    // New: Quick Add State for the Inventory Tab
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newInlineProduct, setNewInlineProduct] = useState({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });

    // ==========================================
    // 2. SORTING STATE & LOGIC
    // ==========================================
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // This computes the sorted list instantly without needing a backend request!
    const sortedProducts = [...products].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Convert strings to lowercase so 'servo' and 'Servo' sort correctly
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'; // Flip direction if clicked again
        }
        setSortConfig({ key, direction });
    };

    // ==========================================
    // SUPPLY FORM STATE
    // ==========================================
    const [supplyInfo, setSupplyInfo] = useState({ supplierName: '', invoiceNumber: '', totalCost: '' });
    const [supplyItems, setSupplyItems] = useState([
        { product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }
    ]);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await API.get('/products');
            setProducts(response.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) handleLogout();
        }
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
            // Re-uses your original POST route to bypass the heavy supply transaction!
            await API.post('/products', newInlineProduct);
            setIsAddingNew(false);
            setNewInlineProduct({ name: '', brand: '', price: '', stock_qty: '', product_description: '' });
            fetchInventory();
            alert("Success! Product quick-added to inventory.");
        } catch (err) {
            console.error(err);
            alert("Failed to quick-add product.");
        }
    };

    const handleEditClick = (product) => {
        setEditingId(product.id); 
        setEditForm({ 
            name: product.name, 
            brand: product.brand, 
            price: product.price, 
            stock_qty: product.stock_qty,
            product_description: product.product_description 
        });
    };

    const handleSaveEdit = async (id) => {
        if (!window.confirm("Are you sure you want to save these changes?")) return;
        try {
            await API.put(`/products/${id}`, editForm);
            setEditingId(null); 
            fetchInventory(); 
            alert("Success! Product updated.");
        } catch (err) {
            console.error(err);
            alert("Failed to update product.");
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("⚠️ WARNING: Are you sure you want to delete this product? This action cannot be undone.")) return;
        try {
            await API.delete(`/products/${id}`);
            fetchInventory();
        } catch (err) {
            console.error(err);
            alert("Failed to delete product. It may be linked to previous supply deliveries.");
        }
    };

    // ==========================================
    // SUPPLY HANDLERS
    // ==========================================
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...supplyItems];
        updatedItems[index][field] = value;
        setSupplyItems(updatedItems);
    };

// 1. UPDATE THE SMART AUTOFILL
    const handleNameChange = (index, value) => {
        const updatedItems = [...supplyItems];
        updatedItems[index].name = value;
        const existingProduct = products.find(p => p.name.toLowerCase().trim() === value.toLowerCase().trim());

        if (existingProduct) {
            updatedItems[index].product_id = existingProduct.id; 
            updatedItems[index].brand = existingProduct.brand;
            updatedItems[index].product_description = existingProduct.product_description;
            updatedItems[index].retail_price = existingProduct.price;
        } else {
            // Visual feedback that the product is missing
            updatedItems[index].product_id = null; 
            updatedItems[index].brand = '⚠️ UNKNOWN PRODUCT';
            updatedItems[index].product_description = 'Must add to inventory first';
            updatedItems[index].retail_price = '';
        }
        setSupplyItems(updatedItems);
    };

       const addLineItem = () => setSupplyItems([...supplyItems, { product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }]);
    const removeLineItem = (index) => setSupplyItems(supplyItems.filter((_, i) => i !== index));

    // 2. UPDATE THE SUBMIT HANDLER
    const handleSupplySubmit = async (e) => {
        e.preventDefault();

        // THE FRONTEND GUARD: Check for unknown products before sending to backend
        const invalidItems = supplyItems.filter(item => item.product_id === null);
        if (invalidItems.length > 0) {
            alert(`Error: "${invalidItems[0].name}" is not in your database.\n\nPlease go to the 'View Inventory' tab and use '+ Quick Add Product' first!`);
            return; // Stops the form from submitting!
        }

        try {
            await API.post('/supply', { supplyInfo, items: supplyItems });
            alert("Success! Delivery logged and inventory updated.");
            setSupplyInfo({ supplierName: '', invoiceNumber: '', totalCost: '' });
            setSupplyItems([{ product_id: null, name: '', brand: '', product_description: '', wholesale_price: '', retail_price: '', quantity: '' }]);
            fetchInventory();
            setActiveTab('inventory');
        } catch (error) {
            console.error(error);
            // This displays the strict error message we created in the backend!
            alert(error.response?.data?.error || "Error saving delivery.");
        }
    };

 

    // ==========================================
    // ICONS (SVGs)
    // ==========================================
    const EditIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
        </svg>
    );

    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>
    );

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#333' }}>Bharat Automobiles - Owner Dashboard</h1>
                <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
                <button onClick={() => setActiveTab('inventory')} style={{ padding: '10px 20px', background: activeTab === 'inventory' ? '#0056b3' : '#e9ecef', color: activeTab === 'inventory' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>View Inventory</button>
                <button onClick={() => setActiveTab('addStock')} style={{ padding: '10px 20px', background: activeTab === 'addStock' ? '#0056b3' : '#e9ecef', color: activeTab === 'addStock' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Receive Supply</button>
                <button onClick={() => setActiveTab('billing')} style={{ padding: '10px 20px', background: activeTab === 'billing' ? '#28a745' : '#e9ecef', color: activeTab === 'billing' ? 'white' : 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Billing Desk 💰</button>
            </div>

            {/* TAB 1: INVENTORY TABLE */}
            {activeTab === 'inventory' && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '20px' }}>
                    
                    {/* Header with Quick Add Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0 }}>Current Stock</h2>
                        {!isAddingNew && (
                            <button onClick={() => setIsAddingNew(true)} style={{ background: '#0056b3', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                + Quick Add Product
                            </button>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#0056b3', color: 'white' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>S.No</th>
                                    
                                    {/* SORTABLE HEADERS */}
                                    <th onClick={() => requestSort('name')} style={{ padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        Product Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Brand</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
                                    <th onClick={() => requestSort('price')} style={{ padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        Retail Price {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                                    </th>
                                    <th onClick={() => requestSort('stock_qty')} style={{ padding: '15px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                        Stock Qty {sortConfig.key === 'stock_qty' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* THE QUICK ADD INLINE ROW */}
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

                                {/* MAPPING THROUGH SORTED PRODUCTS */}
                                {sortedProducts.map((product, index) => (
                                    <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#555' }}>{index + 1}</td>
                                        
                                        {/* IF EDITING THIS ROW */}
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
                                            /* NORMAL VIEW ROW WITH NEW ICONS */
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

            {/* TAB 3: BILLING */}
            {activeTab === 'billing' && (
                <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h2>Billing & Checkout Module</h2>
                    <p>This is where we will build the checkout logic.</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;