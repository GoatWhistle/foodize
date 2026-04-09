import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="layout">
      <header className="header">
        <h1>Foodize</h1>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Foodize</p>
      </footer>
    </div>
  );
};

export default MainLayout;

