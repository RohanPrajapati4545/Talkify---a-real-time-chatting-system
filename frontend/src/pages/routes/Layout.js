import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Particles from '../../components/reactbits/Particles';

const Layout = ({ children }) => {
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat' || location.pathname.startsWith('/chat/');

  return (
    <div
      className={`d-flex flex-column position-relative ${isChatRoute ? 'tk-chat-layout' : 'min-vh-100'}`}
      style={{
        minHeight: isChatRoute ? '100dvh' : '100vh',
        height: isChatRoute ? '100dvh' : 'auto',
        maxHeight: isChatRoute ? '100dvh' : 'none',
        background: '#080b0e',
        overflow: isChatRoute ? 'hidden' : 'visible',
      }}
    >
      {/* Global Background Particles matching Talkify Emerald & Cyan theme */}
      <div
        className="global-particles-wrapper"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <Particles
          particleColors={["#00f5a0", "#00d4ff", "#10b981", "#38bdf8", "#e2fbf3"]}
          particleCount={85}
          particleSpread={14}
          speed={0.09}
          particleBaseSize={70}
          moveParticlesOnHover={true}
          particleHoverFactor={1.4}
          alphaParticles={true}
          disableRotation={false}
          cameraDistance={22}
        />
      </div>

      {/* Main Content & Navigation */}
      <div
        className="layout-content-wrapper"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: isChatRoute ? '100%' : 'auto',
          maxHeight: isChatRoute ? '100%' : 'none',
          overflow: isChatRoute ? 'hidden' : 'visible',
          minHeight: 0,
        }}
      >
        <div className={`layout-header-container ${isChatRoute ? 'chat-page-header-wrap' : ''}`}>
          <Header />
        </div>

        <div
          className="flex-grow-1 w-100 layout-main-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            height: isChatRoute ? '100%' : 'auto',
            overflow: isChatRoute ? 'hidden' : 'visible',
          }}
        >
          {children}
        </div>

        {!isChatRoute && <Footer />}
      </div>
    </div>
  );
};

export default Layout;