import React from "react";

function SupplyTab({
  supplyInfo,
  setSupplyInfo,
  supplyItems,
  products,
  handleNameChange,
  handleItemChange,
  addLineItem,
  removeLineItem,
  handleSupplySubmit
}) {
  const TrashIcon = () => (
    <svg
      className="icon text-danger"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
      <path
        fillRule="evenodd"
        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
      />
    </svg>
  );
  return (
    <div className="card">
      <h2 className="border-bottom pb-2">Receive New Delivery</h2>

      <form onSubmit={handleSupplySubmit}>
        <div className="form-grid highlight-box mb-4">
          <div>
            <label>Supplier</label>
            <input
              type="text"
              required
              value={supplyInfo.supplierName}
              onChange={(e) =>
                setSupplyInfo({
                  ...supplyInfo,
                  supplierName: e.target.value
                })
              }
              className="input-field"
            />
          </div>

          <div>
            <label>Invoice #</label>
            <input
              type="text"
              required
              value={supplyInfo.invoiceNumber}
              onChange={(e) =>
                setSupplyInfo({
                  ...supplyInfo,
                  invoiceNumber: e.target.value
                })
              }
              className="input-field"
            />
          </div>

          <div>
            <label>Issued Date</label>
            <input
              type="date"
              required
              value={supplyInfo.issued_date || ""}
              onChange={(e) =>
                setSupplyInfo({
                  ...supplyInfo,
                  issued_date: e.target.value
                })
              }
              className="input-field"
            />
          </div>

          <div>
            <label>Net Total (Auto) (₹)</label>
            <input
              type="number"
              readOnly
              value={supplyItems.reduce((sum, item) => sum + (Number(item.wholesale_price || 0) * Number(item.quantity || 0)), 0)}
              className="input-field"
            />
          </div>
        </div>

        <h3 className="mb-3">Products in this Delivery</h3>

        <datalist id="product-suggestions">
          {products.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>

        {supplyItems.map((item, index) => (
          <div key={index} className="form-row mb-3">
            <input
              type="text"
              list="product-suggestions"
              placeholder="Type Product Name"
              required
              value={item.name}
              onChange={(e) =>
                handleNameChange(index, e.target.value)
              }
              className="input-field"
            />

            <input
              type="number"
              placeholder="Wholesale (₹)"
              required
              value={item.wholesale_price}
              onChange={(e) =>
                handleItemChange(index, "wholesale_price", e.target.value)
              }
              className="input-field"
            />

            <input
              type="number"
              placeholder="Qty Arrived"
              required
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(index, "quantity", e.target.value)
              }
              className="input-field"
            />

            <div style={{ minWidth: "80px", fontWeight: "bold", textAlign: "right" }}>
              ₹{(Number(item.wholesale_price || 0) * Number(item.quantity || 0)).toLocaleString("en-IN")}
            </div>

            {supplyItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeLineItem(index)}
                className="btn btn-icon"
              >
              <TrashIcon />
              </button>
            )}
          </div>
        ))}

        <div className="flex-between mt-4 border-top pt-3">
          <button
            type="button"
            onClick={addLineItem}
            className="btn btn-outline"
          >
            + Add Another Product
          </button>

          <button type="submit" className="btn btn-primary">
            Process Delivery
          </button>
        </div>
      </form>
    </div>
  );
}

export default SupplyTab;