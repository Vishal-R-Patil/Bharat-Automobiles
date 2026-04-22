import React from 'react';
import PrintReceipt from './PrintReceipt';

function SalesHistoryTab({
    salesList,
    selectedSale,
    setSelectedSale,
    saleItems,
    fetchSaleDetails
}) {

    if (selectedSale) {
        return (
            <>
            <div className="card">
                <div className="flex-between mb-3">
                    <button onClick={() => setSelectedSale(null)} className="btn btn-outline">
                        ← Back to Sales List
                    </button>
                    <button onClick={() => window.print()} className="btn btn-primary">
                        🖨️ Reprint Bill
                    </button>
                </div>

                <h3 className="border-bottom pb-2">
                    Sale Details | Date: {new Date(selectedSale.sale_date.replace(' ', 'T')).toLocaleDateString('en-IN')}
                </h3>

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
                                    <td className="font-bold text-primary">
                                        ₹{item.quantity * item.price_at_sale}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         
            </>
            
        );
    }

    // ===============================
    // LIST VIEW
    // ===============================
    const groupedSales = salesList.reduce((acc, sale) => {
        const dateKey = new Date(sale.sale_date.replace(' ', 'T'))
            .toLocaleDateString('en-IN', { dateStyle: 'medium' });

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(sale);

        return acc;
    }, {});

    return (
        <div className="card">
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
                        {Object.entries(groupedSales)
                            .sort((a, b) =>
                                new Date(b[1][0].sale_date.replace(' ', 'T')) -
                                new Date(a[1][0].sale_date.replace(' ', 'T'))
                            )
                            .map(([date, sales]) => {
                                const totalForDay = sales.reduce(
                                    (sum, s) => sum + Number(s.final_amount),
                                    0
                                );

                                return (
                                    <React.Fragment key={date}>
                                        <tr className="bg-highlight">
                                            <td colSpan="5" className="font-bold">
                                                📅 {date} | Total Sale: ₹{Number(totalForDay).toLocaleString('en-IN')}
                                            </td>
                                        </tr>

                                        {sales.map((sale) => (
                                            <tr key={sale.id}>
                                                <td className="text-muted">
                                                    {new Date(sale.sale_date.replace(' ', 'T'))
                                                        .toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                </td>
                                                <td>₹{Number(sale.sub_total).toLocaleString('en-IN')}</td>
                                                <td className="text-danger">
                                                    ₹{Number(sale.discount_amount).toLocaleString('en-IN')}
                                                </td>
                                                <td className="font-bold text-success">
                                                    ₹{Number(sale.final_amount).toLocaleString('en-IN')}
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => fetchSaleDetails(sale)}
                                                        className="btn btn-outline"
                                                    >
                                                        View Bill
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}

                        {salesList.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center text-muted p-4">
                                    No sales recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

       

    );
}


export default SalesHistoryTab;
