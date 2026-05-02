import React from "react";

function InventoryTab(props) {
  const EditIcon = () => (
    <svg
      className="icon text-warning"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
    </svg>
  );
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

  const {
    role,
    sortedProducts,
    sortConfig,
    requestSort,
    searchTerm,
    setSearchTerm,
    isAddingNew,
    setIsAddingNew,
    newInlineProduct,
    setNewInlineProduct,
    handleQuickAddSave,
    editingId,
    setEditingId,
    editForm,
    setEditForm,
    handleSaveEdit,
    handleEditClick,
    handleDeleteClick,
  } = props;

  return (
    <div className="card">
      <div className="flex-between mb-3">
        <h2 className="m-0">Current Stock</h2>
        <input
          type="text"
          placeholder="Search product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ maxWidth: "250px" }}
        />
        {searchTerm && (
          <span className="text-muted text-sm" style={{ marginLeft: "10px" }}>
            🔍 Showing results for "{searchTerm}"
          </span>
        )}
        {!isAddingNew && (
          <button
            onClick={() =>{
              if (role !== 'Owner' && role !== 'Developer') {
                        alert('Kindly Login from Owner account(Ramesh_Patil)  to add products');
                        return;
                }
              setIsAddingNew(true)}}
            className="btn btn-primary"
          >
            + Quick Add Product
          </button>
        )}
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th
                onClick={() => requestSort("name")}
                className="cursor-pointer"
              >
                Product Name{" "}
                {sortConfig.key === "name"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : "↕"}
              </th>
              <th>Category</th>
              <th>Description</th>
              <th
                onClick={() => requestSort("price")}
                className="cursor-pointer"
              >
                Retail Price{" "}
                {sortConfig.key === "price"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : "↕"}
              </th>
              <th
                onClick={() => requestSort("stock_qty")}
                className="cursor-pointer"
              >
                Stock Qty{" "}
                {sortConfig.key === "stock_qty"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : "↕"}
              </th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAddingNew && (
              <tr className="bg-highlight">
                <td>
                  <span className="badge badge-good">New</span>
                </td>
                <td>
                  <input
                    value={newInlineProduct.name}
                    onChange={(e) =>
                      setNewInlineProduct({
                        ...newInlineProduct,
                        name: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </td>
                <td>
                  <select
                    value={newInlineProduct.category}
                    onChange={(e) =>
                      setNewInlineProduct({
                        ...newInlineProduct,
                        category: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="">Select Category</option>
                    <option value="misc">Misc</option>
                    <option value="lubricant">Lubricant</option>
                    <option value="tyres">Tyres</option>
                  </select>
                </td>
                <td>
                  <input
                    value={newInlineProduct.product_description}
                    onChange={(e) =>
                      setNewInlineProduct({
                        ...newInlineProduct,
                        product_description: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={newInlineProduct.price}
                    onChange={(e) =>
                      setNewInlineProduct({
                        ...newInlineProduct,
                        price: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={newInlineProduct.stock_qty}
                    onChange={(e) =>
                      setNewInlineProduct({
                        ...newInlineProduct,
                        stock_qty: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </td>
                <td className="text-center flex-gap">
                  <button
                    onClick={() => {
                      if (role !== 'Owner' && role !== 'Developer') {
                        alert('Kindly Login from Owner account(Ramesh_Patil)  to add products');
                        return;
                      }
                      handleQuickAddSave();
                    }}
                    className="btn btn-success"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}
            {sortedProducts.map((product, index) => (
              <tr key={product.id}>
                <td>{index + 1}</td>
                {editingId === product.id ? (
                  <>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        value={editForm.product_description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            product_description: e.target.value,
                          })
                        }
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                        className="input-field"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editForm.stock_qty}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            stock_qty: e.target.value,
                          })
                        }
                        className="input-field"
                      />
                    </td>
                    <td className="text-center flex-gap">
                      <button
                      disabled={role!='Owner'&& role!='Developer'}
                      title="Only owner can edit"
                        type="button"
                        onClick={() => handleSaveEdit(product.id)}
                        className="btn btn-success"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId && setEditingId(null)}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{product.name}</td>
                    <td>{product.category || "N/A"}</td>
                    <td>{product.product_description || "No description"}</td>
                    <td>₹{Number(product.price).toLocaleString("en-IN")}</td>
                    <td>
                      <span
                        className={`stock-badge ${
                          product.stock_qty === 0
                            ? "zero"
                            : product.stock_qty < 10
                              ? "low"
                              : product.stock_qty < 30
                                ? "medium"
                                : "high"
                        }`}
                      >
                        {product.stock_qty}
                      </span>
                    </td>{" "}
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (role !== 'Owner' && role !== 'Developer') {
                            alert('Kindly Login from Owner account(Ramesh_Patil)  to edit products');
                            return;
                          }
                          handleEditClick(product);
                        }}
                        className="btn-icon"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (role !== 'Owner' && role !== 'Developer') {
                            alert('Kindly Login from Owner account(Ramesh_Patil)  to delete products');
                            return;
                          }
                          handleDeleteClick(product.id);
                        }}
                        className="btn-icon"
                      >
                        {" "}
                        <TrashIcon />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryTab;
