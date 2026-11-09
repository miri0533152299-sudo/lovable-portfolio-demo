import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <Link className="logo" to="/">סטודיו נועה לב</Link>
        <nav><Link to="/projects">פרויקטים</Link></nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>סטודיו נועה לב · עיצוב פנים ומיתוג</p>
      </footer>
    </>
  );
}
