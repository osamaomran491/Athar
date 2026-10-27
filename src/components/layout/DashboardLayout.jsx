import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

export default function DashboardLayout({ userName, onLogout, children }) {
  return (
    <div className="dash">
      <Sidebar />

      <div className="dash__body">
        <Topbar name={userName} onLogout={onLogout} />
        <main className="dash__main">{children}</main>
      </div>
    </div>
  );
}
