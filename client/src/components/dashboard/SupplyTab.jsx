import React, { useMemo } from "react";
import { TrashIcon } from "../Icons";

function SupplyTab({
  supplyInfo,
  setSupplyInfo,
  supplyItems,
  products,
  suppliers,
  handleNameChange,
  handleItemChange,
  addLineItem,
  removeLineItem,
  handleSupplySubmit
}) {
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const filteredSuppliers = useMemo(() => {
    if (!supplyInfo.supplierName) return safeSuppliers;

    return safeSuppliers.filter((s) =>
      s.name
        .toLowerCase()
        .includes(supplyInfo.supplierName.toLowerCase())
    );
  }, [safeSuppliers, supplyInfo.supplierName]);

  return (
    <div className="card">
      <h2 className="border-bottom pb-2">Receive New Delivery</h2>

      <form
        onSubmit={(e) => {
          const validSupplier = safeSuppliers.some(
            (s) =>
              s.name.toLowerCase() ===
              supplyInfo.supplierName.toLowerCase()
          );

          if (!validSupplier) {
            e.preventDefault();
            alert("Supplier does not exist. Please create it in SupplyBook.");
            return;
          }

          handleSupplySubmit(e);
        }}
      >
        <div className="form-grid highlight-box mb-4">
          <div>
            <label>Supplier</label>
            <input
              type="text"
              list="supplier-suggestions"
              placeholder="Type Exact Supplier Name"
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

            {supplyInfo.supplierName &&
              !safeSuppliers.some(
                (s) =>
                  s.name.toLowerCase() ===
                  supplyInfo.supplierName.toLowerCase()
              ) && (
                <small className="text-danger">
                  Supplier does not exist. Please create it in SupplyBook.
                </small>
              )}
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

        <datalist id="supplier-suggestions">
          {filteredSuppliers.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>

        <h3 className="mb-3">Products in this Delivery</h3>

        <datalist id="product-suggestions">
          {safeProducts.map((p) => (
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