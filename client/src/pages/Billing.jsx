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

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await API.get('/products');
                setProducts(response.data);
            } catch (err) {
                console.error("Error fetching inventory", err);
            }
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
            setFinalAmount(subTotal);
            setDiscountAmount(0);
            return;
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
            updatedCart[index].product_id = null;
            updatedCart[index].price = 0;
            updatedCart[index].total = 0;
            updatedCart[index].stock_qty = 0;
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
            transaction: {
                sub_total: subTotal,
                discount_amount: discountAmount,
                final_amount: Number(finalAmount)
            },
            items: validItems.map(item => ({
                product_id: item.product_id,
                quantity: Number(item.quantity),
                price_at_sale: item.price
            }))
        };

        try {
            await API.post('/billing/checkout', transactionPayload);
            setShowModal(false);

            if (shouldPrint) {
                window.print(); 
            }

            setCartItems([{ product_id: null, name: '', price: 0, quantity: 1, total: 0, stock_qty: 0 }]);
            setSubTotal(0);
            setFinalAmount('');
            setDiscountAmount(0);
            
        } catch (error) {
            setShowModal(false);
            alert(error.response?.data?.error || "Error processing sale.");
        }
    };

    return (
        <div>
            {/* ========================================== */}
            {/* CSS MAGIC: Thermal Printer Formatting */}
            {/* ========================================== */}
            <style>
                {`
                @media print {
                    /* 1. Removes the URL and Date from top/bottom of paper */
                    @page { margin: 0; } 
                    
                    /* 2. Hides the normal website */
                    body * { visibility: hidden; }
                    
                    /* 3. Shows only the receipt */
                    .print-container, .print-container * { visibility: visible; }
                    
                    /* 4. Formats specifically for 80mm Thermal Receipt Rolls */
                    .print-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 80mm; /* Standard receipt width */
                        margin: 0;
                        padding: 10mm 5mm; /* Buffer so it doesn't print on the very edge */
                        font-family: 'Courier New', Courier, monospace; /* Classic receipt font */
                        font-size: 12px; /* Smaller font to fit narrow paper */
                        color: black;
                        background: white;
                    }
                    .no-print { display: none !important; }
                }
                @media screen {
                    .print-container { display: none; } /* Hide receipt on computer screen */
                }
                `}
            </style>

            {/* ========================================== */}
            {/* STANDARD POS VIEW (Hidden during print) */}
            {/* ========================================== */}
            <div className="no-print" style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
                    <div>
                        <h1 style={{ color: '#333', margin: 0 }}>Bharat Automobiles POS</h1>
                        <p style={{ color: '#666', margin: 0 }}>Point of Sale & Billing Desk</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ← Back to Dashboard
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    <div style={{ flex: '2', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>Shopping Cart</h2>
                        <datalist id="billing-suggestions">{products.map(p => <option key={p.id} value={p.name} />)}</datalist>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Price</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Qty</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Total</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            <input type="text" list="billing-suggestions" placeholder="Search Oil..." value={item.name} onChange={(e) => handleNameChange(index, e.target.value)} style={{ width: '100%', padding: '8px' }} />
                                            {item.product_id && item.stock_qty < 5 && <span style={{ color: 'red', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>Only {item.stock_qty} left in stock!</span>}
                                        </td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{item.price}</td>
                                        <td style={{ padding: '10px' }}><input type="number" min="1" placeholder="1" value={item.quantity} onChange={(e) => handleQuantityChange(index, e.target.value)} style={{ width: '60px', padding: '8px' }} /></td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0056b3' }}>₹{item.total}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            {cartItems.length > 1 && <button onClick={() => removeCartItem(index)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>X</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addCartItem} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Another Item</button>
                    </div>

                    <div style={{ flex: '1', background: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <h2 style={{ marginTop: 0, borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>Summary</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', marginBottom: '15px' }}><span>Subtotal:</span><strong>₹{subTotal}</strong></div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Final Amount Settled (₹)</label>
                            <input type="number" min="0" max={subTotal} value={finalAmount} onChange={(e) => handleFinalAmountChange(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '1.2em', border: '2px solid #0056b3', borderRadius: '4px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1em', color: '#28a745', marginBottom: '25px' }}><span>Discount Applied:</span><strong>₹{discountAmount}</strong></div>
                        <button onClick={handleCheckoutClick} style={{ width: '100%', padding: '15px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer' }}>Complete Sale</button>
                    </div>
                </div>

                {/* MODAL */}
                {showModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', padding: '30px', borderRadius: '10px', width: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                            <h2 style={{ marginTop: 0, color: '#333' }}>Confirm Sale</h2>
                            <p style={{ fontSize: '1.1em', marginBottom: '25px', color: '#555' }}>Complete sale for <strong>₹{finalAmount}</strong>?</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={() => processTransaction(true)} style={{ padding: '12px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>🖨️ Confirm & Print Bill</button>
                                <button onClick={() => processTransaction(false)} style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>✅ Confirm Without Printing</button>
                                <button onClick={() => setShowModal(false)} style={{ padding: '12px', background: 'transparent', color: '#dc3545', border: '2px solid #dc3545', borderRadius: '5px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold', marginTop: '10px' }}>❌ Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* PRINT-ONLY RECEIPT VIEW (Thermal Format) */}
            {/* ========================================== */}
            <div className="print-container">
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>BHARAT AUTOMOBILES</h2>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Hosamani Siddappa Circle, P.B. Road</p>
                    <p style={{ margin: '0 0 3px 0', fontSize: '11px' }}>Haveri - 581110</p>
                    <p style={{ margin: '0', fontSize: '11px' }}>Ph: 99807 56208 | 98449 29729 | 96860 55206</p> 
                    <p style= {{ margin: '5px 0 0 0', fontSize: '11px' }}>website: www.bharatautomobiles.com</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
                    <span>Date:{new Date().toLocaleDateString('en-IN')}</span>
                    <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
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
                        {cartItems.map((item, idx) => item.product_id && (
                            <tr key={idx}>
                                {/* Item name will wrap automatically if it is too long */}
                                <td style={{ padding: '4px 0', wordBreak: 'break-word', paddingRight: '5px' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>Subtotal:</span>
                        <span>{subTotal}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                            <span>Discount:</span>
                            <span>-{discountAmount}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                        <span>TOTAL:</span>
                        <span>Rs {finalAmount}</span>
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