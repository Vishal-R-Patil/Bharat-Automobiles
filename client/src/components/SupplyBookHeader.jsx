import { useState } from "react";
import { Menu, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

function SupplyBookHeader({
  title = "Supply Book",
  onBack,
  onAddPayment,
  onDelete,
  onViewBills,
  onLogoutClick,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    setIsMenuOpen(false);
    navigate("/dashboard");
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    onLogoutClick();
  };

  const handleViewBillsClick = () => {
    setIsMenuOpen(false);
    if (onViewBills) onViewBills();
  };

  return (
    <header className="supplybook-header">
      <div className="supplybook-header-left">
        {onBack && (
          <button
            className="btn btn-outline supplybook-symbol-btn"
            type="button"
            onClick={onBack}
            aria-label="Back"
          >
            &lt;
          </button>
        )}
      </div>

      <h2 className="supplybook-page-title">{title}</h2>

      <div className="supplybook-header-actions">
        {onAddPayment && (
          <button
            className="btn btn-primary supplybook-symbol-btn"
            type="button"
            onClick={onAddPayment}
            aria-label="Add payment"
          >
            <Plus size={20} strokeWidth={2.4} />
          </button>
        )}
        {onDelete && (
          <button
            className="btn btn-icon supplybook-symbol-btn"
            type="button"
            onClick={onDelete}
            aria-label="Delete supplier"
          >
            <Trash2 size={20} strokeWidth={2.2} />
          </button>
        )}
        <div className="supplybook-menu">
          <button
            className="btn btn-outline supplybook-symbol-btn"
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {isMenuOpen && (
            <div className="supplybook-menu-panel">
              <button type="button" onClick={handleViewBillsClick}>
                View Bills
              </button>
              <button type="button" onClick={handleDashboardClick}>
                Dashboard
              </button>
              <div className="supplybook-menu-toggle">
                <span>Theme</span>
                <ThemeToggle />
              </div>
              <button type="button" className="danger" onClick={handleLogoutClick}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default SupplyBookHeader;
