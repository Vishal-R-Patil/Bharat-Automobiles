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
            <label>Total Cost (₹)</label>
            <input
              type="number"
              required
              value={supplyInfo.totalCost}
              onChange={(e) =>
                setSupplyInfo({
                  ...supplyInfo,
                  totalCost: e.target.value
                })
              }
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

            {supplyItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeLineItem(index)}
                className="btn btn-icon"
              >
                🗑️
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