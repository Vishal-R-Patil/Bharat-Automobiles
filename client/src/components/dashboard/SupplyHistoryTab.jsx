import React from "react";

function SupplyHistoryTab({
  historyList,
  selectedDelivery,
  setSelectedDelivery,
  detailItems,
  fetchDeliveryDetails
}) {

  if (selectedDelivery) {
    return (
      <div className="card">
        <button
          onClick={() => setSelectedDelivery(null)}
          className="btn btn-outline mb-3"
        >
          ← Back to History List
        </button>

        <h3 className="border-bottom pb-2">
          Items for Invoice: {selectedDelivery.invoice_number}
        </h3>

        <p>
          <strong>Supplier:</strong> {selectedDelivery.supplier_name} |{" "}
          <strong>Date:</strong>{" "}
          {new Date(selectedDelivery.delivery_date).toLocaleDateString("en-IN")} |{" "}
          <strong>Total Cost:</strong> ₹{selectedDelivery.total_cost}
        </p>

        <div className="table-wrapper mt-3">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Wholesale Price</th>
                <th>Retail Price</th>
                <th>Quantity Added</th>
              </tr>
            </thead>
            <tbody>
              {detailItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-bold">
                    {item.Product_name || item.product_name}
                  </td>
                  <td>{item.category}</td>
                  <td>
                    ₹{Number(item.Wholesale_price || item.wholesale_price).toLocaleString("en-IN")}
                  </td>
                  <td>
                    ₹{Number(item.Retail_price || item.retail_price).toLocaleString("en-IN")}
                  </td>
                  <td className="font-bold text-success">
                    +{item.Quantity_added || item.quantity_added}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
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
            {historyList.map((h) => (
              <tr key={h.id}>
                <td className="text-muted">#{h.id}</td>
                <td className="text-muted">
                  {new Date(h.delivery_date).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </td>
                <td className="font-bold">{h.supplier_name}</td>
                <td>{h.invoice_number}</td>
                <td>₹{Number(h.total_cost).toLocaleString("en-IN")}</td>
                <td className="text-center">
                  <button
                    onClick={() => fetchDeliveryDetails(h)}
                    className="btn btn-outline"
                  >
                    View Items
                  </button>
                </td>
              </tr>
            ))}

            {historyList.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted p-4">
                  No delivery history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SupplyHistoryTab;