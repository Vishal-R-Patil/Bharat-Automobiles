// src/pages/Billing.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Billing() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    
    // Cart State
    const [cartItems, setCartItems] = useState([
        { product_id: null, name: '', price: 0, quantity: '', total: 0, stock_qty: 0 }
    ]);

    // Transaction Math State
    const [subTotal, setSubTotal] = useState(0);
    const [finalAmount, setFinalAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    // Fetch inventory on load so we can autocomplete
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

    // REACITVE MATH ENGINE: Runs automatically whenever the cart changes!
    useEffect(() => {
        const newSubTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        setSubTotal(newSubTotal);
        // Safety feature: If cart changes, reset final amount to prevent accidental discounts
        setFinalAmount(newSubTotal); 
        setDiscountAmount(0);
    }, [cartItems]);

    // Handle manual final amount override by your father
    const handleFinalAmountChange = (val) => {
        setFinalAmount(val);
        const calculatedDiscount = subTotal - Number(val);
        // Ensure discount doesn't go negative if he accidentally types a huge number
        setDiscountAmount(calculatedDiscount > 0 ? calculatedDiscount : 0);
    };

    // ==========================================
    // DYNAMIC CART HANDLERS
    // ==========================================
    const handleNameChange = (index, value) => {
        const updatedCart = [...cartItems];
        updatedCart[index].name = value;

        const existingProduct = products.find(p => p.name.toLowerCase().trim() === value.toLowerCase().trim());

        if (existingProduct) {
            updatedCart[index].product_id = existingProduct.id;
            updatedCart[index].price = existingProduct.price;
            updatedCart[index].stock_qty = existingProduct.stock_qty; // Grab stock to show warning if low
            // If they already typed a quantity, calculate total instantly
            updatedCart[index].total = existingProduct.price * (Number(updatedCart[index].quantity) || 0);
        } else {
            updatedCart[index].product_id = null;
            updatedCart[index].price = 0;
            updatedCart[index].total = 0;
            updatedCart[index].stock_qty = 0;
        }
        setCartItems(updatedCart);
    };

    const handleQuantityChange = (index, qty) => {
        const updatedCart = [...cartItems];
        updatedCart[index].quantity = qty;
        // Instantly update the line total
        updatedCart[index].total = updatedCart[index].price * (Number(qty) || 0);
        setCartItems(updatedCart);
    };

    const addCartItem = () => {
        setCartItems([...cartItems, { product_id: null, name: '', price: 0, quantity: '', total: 0, stock_qty: 0 }]);
    };

    const removeCartItem = (index) => {
        setCartItems(cartItems.filter((_, i) => i !== index));
    };

    // ==========================================
    // CHECKOUT LOGIC
    // ==========================================
    const handleCheckout = async () => {
        // Validation Guards
        const invalidItems = cartItems.filter(item => item.product_id === null);
        if (invalidItems.length > 0) return alert(`Error: Unknown product in cart!`);
        if (cartItems.length === 0 || subTotal === 0) return alert("Cart is empty!");

        // The Payload formatted perfectly for your backend schema
        const transactionPayload = {
            transaction: {
                sub_total: subTotal,
                discount_amount: discountAmount,
                final_amount: Number(finalAmount)
            },
            items: cartItems.map(item => ({
                product_id: item.product_id,
                quantity: Number(item.quantity),
                price_at_sale: item.price
            }))
        };

        console.log("Sending to Backend:", transactionPayload);
        alert("Frontend is ready! We need to build the Backend API route next to save this to the DB.");
        
        // FUTURE BACKEND CALL:
        // await API.post('/billing/checkout', transactionPayload);
        // navigate('/dashboard');
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Header */}
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
                
                {/* LEFT SIDE: The Cart */}
                <div style={{ flex: '2', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>Shopping Cart</h2>
                    
                    <datalist id="billing-suggestions">
                        {products.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>

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
                                        <input 
                                            type="text" 
                                            list="billing-suggestions" 
                                            placeholder="Search Oil..." 
                                            value={item.name} 
                                            onChange={(e) => handleNameChange(index, e.target.value)} 
                                            style={{ width: '100%', padding: '8px' }} 
                                        />
                                        {/* Low stock warning directly in the cart! */}
                                        {item.product_id && item.stock_qty < 5 && (
                                            <span style={{ color: 'red', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>Only {item.stock_qty} left in stock!</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{item.price}</td>
                                    <td style={{ padding: '10px' }}>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            value={item.quantity} 
                                            onChange={(e) => handleQuantityChange(index, e.target.value)} 
                                            style={{ width: '60px', padding: '8px' }} 
                                        />
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#0056b3' }}>₹{item.total}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        {cartItems.length > 1 && (
                                            <button onClick={() => removeCartItem(index)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button onClick={addCartItem} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Add Another Item
                    </button>
                </div>

                {/* RIGHT SIDE: Checkout Summary */}
                <div style={{ flex: '1', background: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <h2 style={{ marginTop: 0, borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>Summary</h2>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', marginBottom: '15px' }}>
                        <span>Subtotal:</span>
                        <strong>₹{subTotal}</strong>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Final Amount Settled (₹)</label>
                        <input 
                            type="number" 
                            value={finalAmount} 
                            onChange={(e) => handleFinalAmountChange(e.target.value)} 
                            style={{ width: '100%', padding: '12px', fontSize: '1.2em', border: '2px solid #0056b3', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1em', color: '#28a745', marginBottom: '25px' }}>
                        <span>Discount Applied:</span>
                        <strong>₹{discountAmount}</strong>
                    </div>

                    <button onClick={handleCheckout} style={{ width: '100%', padding: '15px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer' }}>
                        Complete Sale
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Billing;