import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Billing() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    
    const [cartItems, setCartItems] = useState([
        { product_id: null, name: '', price: 0, quantity: 1, total: 0, stock_qty: 0 }
    ]);

    const [subTotal, setSubTotal] = useState(0);
    const [finalAmount, setFinalAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    // Print snapshot state
    const [printData, setPrintData] = useState({ items: [], subTotal: 0, finalAmount: 0, discountAmount: 0 });

    useEffect(() => {
        const fetchInventory = async () => {
            try { const response = await API.get('/products'); setProducts(response.data); } 
            catch (err) { console.error("Error fetching inventory", err); }
        };
        fetchInventory();
    }, []);

    useEffect(() => {
        const newSubTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        setSubTotal(newSubTotal);
        setFinalAmount(newSubTotal); 
        setDiscountAmount(0);
    }, [cartItems]);

    const handleFinalAmountChange = (val) => {
        const numVal = Number(val);
        if (numVal < 0) return;
        if (numVal > subTotal) {
            setFinalAmount(subTotal); setDiscountAmount(0); return;
        }
        setFinalAmount(val);
        setDiscountAmount(subTotal - numVal);
    };

    const handleNameChange = (index, value) => {
        const updatedCart = [...cartItems];
        updatedCart[index].name = value;
        const existingProduct = products.find(p => p.name.toLowerCase().trim() === value.toLowerCase().trim());

        if (existingProduct) {
            updatedCart[index].product_id = existingProduct.id;
            updatedCart[index].price = existingProduct.price;
            updatedCart[index].stock_qty = existingProduct.stock_qty;
            const qty = Number(updatedCart[index].quantity) > 0 ? Number(updatedCart[index].quantity) : 1;
            updatedCart[index].quantity = qty;
            updatedCart[index].total = existingProduct.price * qty;
        } else {
            updatedCart[index].product_id = null; updatedCart[index].price = 0;
            updatedCart[index].total = 0; updatedCart[index].stock_qty = 0;
        }
        setCartItems(updatedCart);
    };

    const handleQuantityChange = (index, qty) => {
        if (qty !== '' && Number(qty) < 0) return;
        const updatedCart = [...cartItems];
        updatedCart[index].quantity = qty;
        updatedCart[index].total = updatedCart[index].price * (Number(qty) || 0);
        setCartItems(updatedCart);
    };

    const addCartItem = () => setCartItems([...cartItems, { product_id: null, name: '', price: 0, quantity: 1, total: 0, stock_qty: 0 }]);
    const removeCartItem = (index) => setCartItems(cartItems.filter((_, i) => i !== index));

    const handleCheckoutClick = () => {
        const invalidItems = cartItems.filter(item => item.product_id === null && item.name !== '');
        if (invalidItems.length > 0) return alert(`Error: Unknown product in cart!`);
        if (subTotal === 0) return alert("Cart is empty!");
        setShowModal(true);
    };

    const processTransaction = async (shouldPrint) => {
        const validItems = cartItems.filter(item => item.product_id !== null);
        const transactionPayload = {
            transaction: { sub_total: subTotal, discount_amount: discountAmount, final_amount: Number(finalAmount) },
            items: validItems.map(item => ({ product_id: item.product_id, quantity: Number(item.quantity), price_at_sale: item.price }))
        };

        try {
            await API.post('/billing/checkout', transactionPayload);
            setShowModal(false);
            if (shouldPrint) {
                setPrintData({
                    items: validItems.map(item => ({ ...item })),
                    subTotal,
                    finalAmount,
                    discountAmount
                });
                setTimeout(() => window.print(), 100);
            }
            
            setCartItems([{ product_id: null, name: '', price: 0, quantity: 1, total: 0, stock_qty: 0 }]);
            setSubTotal(0); setFinalAmount(''); setDiscountAmount(0);
        } catch (error) {
            setShowModal(false);
            alert(error.response?.data?.error || "Error processing sale.");
        }
    };

    // ICONS
    const TrashIcon = () => ( <svg className="icon text-danger" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg> );

    // Mobile-safe afterprint event to reliably reset state after printing
    useEffect(() => {
        const handleAfterPrint = () => {
            setCartItems([{ product_id: null, name: '', price: 0, quantity: 1, total: 0, stock_qty: 0 }]);
            setSubTotal(0);
            setFinalAmount('');
            setDiscountAmount(0);
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    return (
        <div>
            {/* STANDARD POS VIEW */}
            <div className="no-print dashboard-container">
                <header className="dashboard-header">
                    <div>
                        <h1>Bharat Automobiles POS</h1>
                        <pre className="text-muted m-0">           Point of Sale & Billing Desk</pre>
                    </div>
                    <button className="btn btn-backToDashboard" onClick={() => navigate('/dashboard')} >
                        ← Back to Dashboard
                    </button>
                </header>

                <div className="billing-grid">
                    {/* LEFT SIDE: The Cart */}
                    <div className="card m-0">
                        <h2 className="border-bottom pb-2">Billing Cart</h2>
                        <datalist id="billing-suggestions">{products.map(p => <option key={p.id} value={p.name} />)}</datalist>

                        <div className="table-wrapper mb-3">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Total</th>
                                        <th className="text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="text-center font-bold">{index + 1}</td>
                                            <td>
                                                <input type="text" list="billing-suggestions" placeholder="Type product name" value={item.name} onChange={(e) => handleNameChange(index, e.target.value)} className="input-field" />
                                                {item.product_id && item.stock_qty < 5 && <span className="text-danger text-sm mt-1 block">Only {item.stock_qty} left in stock!</span>}
                                            </td>
                                            <td className="font-bold">₹{item.price}</td>
                                            <td className="text-center"><input type="number" min="1" placeholder="1" value={item.quantity} onChange={(e) => handleQuantityChange(index, e.target.value)} className="input-field qty-input" /></td>
                                            <td className="font-bold text-primary text-right">₹{item.total}</td>
                                            <td className="text-center">
                                                {cartItems.length > 1 && <button onClick={() => removeCartItem(index)} className="btn-icon"><TrashIcon /></button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addCartItem} className="btn btn-outline font-bold text-success" style={{ borderColor: 'var(--success)' }}>+ Add Another Item</button>
                    </div>

                    {/* RIGHT SIDE: Checkout Summary */}
                    <div className="card bg-highlight m-0">
                        <h2 className="border-bottom pb-2">Summary</h2>
                        
                        <div className="flex-between mb-3 font-bold" style={{ fontSize: '1.2em' }}>
                            <span className="text-muted">Subtotal:</span>
                            <span>₹{subTotal}</span>
                        </div>

                        <div className="mb-4">
                            <label className="font-bold text-lg">Final Amount Settled (₹)</label>
                            <input type="number" min="0" max={subTotal} value={finalAmount} onChange={(e) => handleFinalAmountChange(e.target.value)} className="input-field" style={{ fontSize: '1.5em', borderColor: 'var(--primary)', borderWidth: '2px' }} />
                        </div>

                        <div className="flex-between mb-4 font-bold text-success">
                            <span>Discount Applied:</span>
                            <span>₹{discountAmount}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button onClick={handleCheckoutClick} className="btn btn-primary" style={{ padding: '15px', fontSize: '1em', width: '80%' }}>
                                Complete Sale
                            </button>
                        </div>
                    </div>
                </div>

                {/* MODAL */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 className="m-0 text-primary">Confirm Sale</h2>
                            <p className="text-muted mt-3 mb-4">Complete sale for <strong className="text-main" style={{fontSize: '1.2em'}}>₹{finalAmount}</strong>?</p>
                            <div className="modal-actions">
                                <button onClick={() => processTransaction(true)} className="btn btn-primary w-100" style={{ padding: '12px' }}>🖨️ Confirm & Print Bill</button>
                                <button onClick={() => processTransaction(false)} className="btn btn-success w-100" style={{ padding: '12px' }}>✅ Confirm Without Printing</button>
                                <button onClick={() => setShowModal(false)} className="btn btn-outline text-danger w-100 mt-2" style={{ padding: '12px', borderColor: 'var(--danger)' }}>❌ Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
 {/* PRINT-ONLY RECEIPT VIEW (Thermal Format) */}
            {/* ========================================== */}
            <div className="print-container">
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>BHARAT AUTOMOBILES</h2>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Hosamani Siddappa Circle, P.B. Road</p>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Haveri - 581110</p>
                    <p style={{ margin: '0', fontSize: '11px' }}>Ph: 99807 56208 | 98449 29729 | 96860 55206</p> 
                    <p style= {{ margin: '2px 0 0 0', fontSize: '11px' }}>website: www.bharat-automobiles.onrender.com</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
                    <span>Date:{new Date().toLocaleDateString('en-IN')}</span>
                    <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
                    <thead style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                        <tr>
                            <th style={{borderBottom: '1px solid #000', textAlign: 'left', padding: '4px 0' }}>Item</th>
                            <th style={{ borderBottom: '1px solid #000', textAlign: 'center', padding: '4px 0' }}>Qty</th>
                            <th style={{ borderBottom: '1px solid #000', textAlign: 'right', padding: '4px 0' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {printData.items.map((item, idx) => (
                            <tr key={idx}>
                                {/* Item name will wrap automatically if it is too long */}
                                <td style={{ padding: '4px 0', wordBreak: 'break-word', paddingRight: '5px', fontWeight: 'bold', color: '#000' }}>
                                    {item.name}
                                </td>
                                <td style={{ textAlign: 'center', padding: '4px 0', fontWeight: 'bold', color: '#000' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 'bold', color: '#000' }}>
                                    {item.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>Subtotal:</span>
                        <span>{printData.subTotal}</span>
                    </div>
                    {printData.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                            <span>Discount:</span>
                            <span>-{printData.discountAmount}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                        <span>TOTAL:</span>
                        <span>Rs {printData.finalAmount}</span>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
                    <p style={{ margin: '3px 0' }}>Thank you for visiting! Please visit us again.</p>
                    <p style={{ margin: '3px 0' }}>Check our website for available products.</p>
                </div>
            </div>
        </div>
    );
}

export default Billing;