import React from "react";
import {EditIcon, TrashIcon} from '../Icons';

function InventoryTab(props) {
 
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
            style={{ fontWeight: 500 }}
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
                    className="btn btn-danger"
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
                        className="btn btn-danger"
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
                    </td>
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
