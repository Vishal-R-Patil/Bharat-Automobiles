function LoadingOverlay({ isVisible = false, message = "Loading..." }) {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
