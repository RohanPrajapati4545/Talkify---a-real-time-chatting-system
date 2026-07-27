import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaHome, FaInfoCircle, FaLock, FaChevronRight } from "react-icons/fa";

const settingsPages = [
  {
    title: "Contact Queries",
    description: "View and manage messages submitted via the contact form",
    icon: FaEnvelope,
    path: "/admin/contact-queries",
  },
  {
    title: "Home Content",
    description: "Edit the content shown on the public home page",
    icon: FaHome,
    path: "/admin/home-content",
  },
  {
    title: "About Content",
    description: "Edit the content shown on the public about page",
    icon: FaInfoCircle,
    path: "/admin/about-content",
  },
  {
    title: "Auth Setting",
    description: "Manage authentication related settings",
    icon: FaLock,
    path: "/admin/auth-setting",
  },
];

const AdminSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-wrapper p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Settings</h2>
          <p className="text-muted mb-0">Manage site content and configuration</p>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <h5 className="fw-bold mb-4">All Settings</h5>

        <div className="d-flex flex-column gap-2">
          {settingsPages.map(({ title, description, icon: Icon, path }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="btn d-flex align-items-center justify-content-between text-start p-3  rounded-3" style={{border:"1px solid #493913",background: "var(--panel-2, #f8f9fa)"}}

            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-25"
                  style={{ width: "40px", height: "40px", flexShrink: 0 }}
                >
                  <Icon size={16} className="text-dark" />
                </div>
                <div>
                  <div className="fw-semibold" style={{ fontSize: "14px", color:"white"}}>
                    {title}
                  </div>
                  <div className="text-muted" style={{ fontSize: "12.5px" }}>
                    {description}
                  </div>
                </div>
              </div>

              <FaChevronRight size={12} className="text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;