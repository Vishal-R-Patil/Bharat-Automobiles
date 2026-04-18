// src/utils/sessionManager.js
export const startSessionManager = () =>
{
    const expiry = localStorage.getItem('expiry');


    if (!expiry) return;

    const expiryTime = parseInt(expiry);
    const now = Date.now();

    const timeLeft = expiryTime - now;


    // If already expired
    if (timeLeft <= 0)
    {
        logout();
        return;
    }

    // ⚠️ Warning 5 minutes before expiry
    const warningTime = timeLeft - (5 * 60 * 1000);

    // console.log("Time left:", timeLeft / 1000, "seconds");
    // console.log("Warning time:", warningTime / 1000, "seconds");
    if (warningTime > 0)
    {
        setTimeout(() =>
        {
            showSessionWarning();
        }, warningTime);
    }

    // 🔒 Auto logout at expiry
    setTimeout(() =>
    {
        logout();
    }, timeLeft);
};

// 🔐 Logout helper
const logout = () =>
{
    localStorage.removeItem('token');
    localStorage.removeItem('expiry');
    window.location.href = '/login';
};

const showSessionWarning = () =>
{
    // Avoid duplicate banner
    if (document.getElementById('session-warning-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'session-warning-banner';

    // Create message
    const message = document.createElement('span');
    message.innerText = '⚠️ 5 minutes left in the session. Kindly logout and login to avoid losing unsaved data.';

    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.innerText = '✖';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '12px';
    closeBtn.style.fontWeight = '700';
    closeBtn.onclick = () => banner.remove();

    // Append elements
    banner.appendChild(message);
    banner.appendChild(closeBtn);

    Object.assign(banner.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        background: 'var(--danger)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 16px',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        gap: '10px'
    });

    document.body.appendChild(banner);

    // Auto remove after 10 seconds
    setTimeout(() =>
    {
        banner.remove();
    }, 10000);
};