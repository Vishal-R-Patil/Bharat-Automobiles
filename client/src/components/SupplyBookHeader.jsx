import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

function SupplyBookHeader({ onLogoutClick }) {
  const navigate = useNavigate();

  return (
    <header className="supplybook-header">
      <button
        className="btn btn-outline supplybook-back-btn"
        type="button"
        onClick={() => navigate("/dashboard")}
      >
        ← Dashboard
      </button>

      <h2 className="supplybook-page-title">Supply Book</h2>

      <div className="supplybook-header-actions">
        <ThemeToggle />
        <button
          className="btn btn-danger"
          type="button"
          onClick={onLogoutClick}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default SupplyBookHeader;
