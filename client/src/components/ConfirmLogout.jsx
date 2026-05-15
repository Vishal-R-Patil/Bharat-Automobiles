import { useNavigate } from "react-router-dom";

function ConfirmLogout({ setShowLogoutConfirm }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    return (
        <div className="confirm-logout-overlay">
          <div className="confirm-logout-modal">
            <h3 className="confirm-logout-title">Confirm Logout</h3>
            <p className="confirm-logout-message">
              Are you sure you want to logout?
            </p>
            <div className="confirm-logout-buttons">
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
    );
}

export default ConfirmLogout;