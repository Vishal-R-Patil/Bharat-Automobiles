import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showScrollHint, setShowScrollHint] = useState(true);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowScrollHint(false);
      } else {
        setShowScrollHint(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const content = {
    en: {
      title: "Bharat Automobiles",
      subtitle: "Your Trusted Auto Parts Partner in Haveri",
      about: "Located at Siddappa Circle, P.B. Road, Bharat Automobiles provides high-quality automobile spare parts, lubricants, and tyres with trusted service.",
      contact: "Contact: 99807 56208",
      button: "Owner Login"
    },
    kn: {
      title: "ಭಾರತ ಆಟೋಮೊಬೈಲ್ಸ್",
      subtitle: "ಹಾವೇರಿಯ ವಿಶ್ವಾಸಾರ್ಹ ಆಟೋ ಭಾಗಗಳ ಅಂಗಡಿ",
      about: "ಸಿದ್ದಪ್ಪ ಸರ್ಕಲ್, ಪಿ.ಬಿ.ರೋಡ್ ನಲ್ಲಿ ಇರುವ ಭಾರತ ಆಟೋಮೊಬೈಲ್ಸ್ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಆಟೋ ಸ್ಪೇರ್ ಪಾರ್ಟ್ಸ್, ಲ್ಯೂಬ್ರಿಕಾಂಟ್ಸ್ ಮತ್ತು ಟೈರ್‌ಗಳನ್ನು ಒದಗಿಸುತ್ತದೆ.",
      contact: "ಸಂಪರ್ಕ: 99807 56208",
      button: "ಲಾಗಿನ್"
    }
  };

  const t = content[lang];

  return (
    <>
      <div className="home-container">

        {/* Navbar */}
        <div className="home-navbar">
          <h2>{t.title}</h2>

          <div>
            <button onClick={() => setLang('en')} className="btn btn-outline">EN</button>
            <button onClick={() => setLang('kn')} className="btn btn-outline">ಕನ್ನಡ</button>
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="theme-toggle"
            >
              <span className="icon sun">☀️</span>
              <span className="icon moon">🌙</span>
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-primary">Login</button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="hero">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        {showScrollHint && (
          <div
            className="scroll-indicator"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <span className="scroll-text">Scroll Down</span>
            <div className="arrow-down">⬇</div>
          </div>
        )}

        {/* About */}
        <div className="card">
          <h2>About Us</h2>
          <p>{t.about}</p>
          <p>{t.contact}</p>
        </div>

      </div>

      {/* Map Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Location</h2>
        <iframe
          title="Bharat Automobiles Location"
          src="https://www.google.com/maps?q=Siddappa%20Circle%20P.B.%20Road%20Haveri&output=embed"
          width="100%"
          height="250"
          style={{ border: 0, borderRadius: '8px' }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>

      {/* Contact Footer */}
      <div className="home-footer">
        <p>📍 Siddappa Circle, P.B. Road, Haveri</p>
        <p>📞 99807 56208</p>
        <div className="footer-actions">
          <a href="tel:9980756208" className="btn btn-success">Call Now</a>
          <a href="https://www.google.com/maps?q=Siddappa%20Circle%20P.B.%20Road%20Haveri" target="_blank" rel="noreferrer" className="btn btn-outline">Open Maps</a>
        </div>
      </div>
    </>
  );
}

export default Home;