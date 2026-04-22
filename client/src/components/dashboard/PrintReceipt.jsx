import React from 'react';

function PrintReceipt({ selectedSale, saleItems }) {
  return (
    <div className="print-container">
          <div
            style={{
              textAlign: "center",
              borderBottom: "1px dashed #000",
              paddingBottom: "10px",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>
              BHARAT AUTOMOBILES
            </h2>
            <p style={{ margin: "0 0 3px 0", fontSize: "11px" }}>
              Hosamani Siddappa Circle, P.B. Road
            </p>
            <p style={{ margin: "0 0 3px 0", fontSize: "11px" }}>
              Haveri - 581110
            </p>
            <p style={{ margin: "0", fontSize: "11px" }}>
              Ph: 99807 56208 | 98449 29729 | 96860 55206
            </p>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px" }}>
              website: www.bharat-automobiles.onrender.com
            </p>
            <p
              style={{ marginTop: "5px", fontSize: "11px", fontWeight: "bold" }}
            >
              *** DUPLICATE RECEIPT ***
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "11px",
            }}
          >
            <span>
              Date:
              {new Date(
                selectedSale.sale_date.replace(" ", "T"),
              ).toLocaleDateString("en-IN")}
            </span>
            <span>
              Time:
              {new Date(
                selectedSale.sale_date.replace(" ", "T"),
              ).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "10px",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    borderBottom: "1px solid #000",
                    textAlign: "left",
                    padding: "4px 0",
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #000",
                    textAlign: "center",
                    padding: "4px 0",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    borderBottom: "1px solid #000",
                    textAlign: "right",
                    padding: "4px 0",
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {saleItems.map((item, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: "4px 0",
                      wordBreak: "break-word",
                      paddingRight: "5px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    {item.product_name}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      padding: "4px 0",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "4px 0",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    {item.quantity * item.price_at_sale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              borderTop: "1px solid #000",
              paddingTop: "5px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "2px 0",
              }}
            >
              <span>Subtotal:</span>
              <span>{selectedSale.sub_total}</span>
            </div>

            {selectedSale.discount_amount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>Discount:</span>
                <span>-{selectedSale.discount_amount}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "14px",
                marginTop: "5px",
                borderTop: "1px dashed #000",
                paddingTop: "5px",
              }}
            >
              <span>TOTAL:</span>
              <span>Rs {selectedSale.final_amount}</span>
            </div>
          </div>

          <div
            style={{ textAlign: "center", marginTop: "20px", fontSize: "10px" }}
          >
            <p style={{ margin: "3px 0" }}>
              Thank you for visiting! Please visit us again.
            </p>
            <p style={{ margin: "3px 0" }}>
              Check our website for available products.
            </p>
          </div>
        </div>
  );
}

export default PrintReceipt;