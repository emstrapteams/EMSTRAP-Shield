
import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import { logoutUser } from "../services/authService";
import { getCompanyEmergencies } from "../services/emergencyService";
import "./CompanyAdminDashboard.css";

const statusOptions = [
  "triggered",
  "alert_created",
  "response_in_progress",
  "resolved",
  "closed",
  "cancelled",
];

const typeOptions = [
  "medical",
  "fire",
  "accident",
  "electrical",
  "chemical",
  "gas",
  "vehicle",
  "equipment",
  "security",
  "other",
];

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? "—"
    : parsedDate.toLocaleString();
};

function CompanyAdminDashboard({ user, onLogout }) {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  const fetchEmergencies = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await getCompanyEmergencies();

      const emergencyList =
        response.data?.emergencies ||
        response.emergencies ||
        [];

      setEmergencies(emergencyList);

      if (selectedEmergency) {
        const updatedSelected = emergencyList.find(
          (item) =>
            item._id === selectedEmergency._id ||
            item.id === selectedEmergency.id
        );

        setSelectedEmergency(updatedSelected || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load emergencies. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    // Initial data fetch only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmergencies = useMemo(() => {
    return emergencies.filter((emergency) => {
      const matchesStatus =
        !statusFilter || emergency.status === statusFilter;

      const matchesType =
        !typeFilter || emergency.type === typeFilter;

      const employeeName =
        emergency.reportedBy?.name ||
        emergency.reportedBy?.email ||
        "";

      const description = emergency.description || "";

      const matchesSearch =
        !searchTerm ||
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emergency.type || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [emergencies, statusFilter, typeFilter, searchTerm]);

  const counts = useMemo(() => {
    const countStatus = (status) =>
      emergencies.filter((item) => item.status === status).length;

    return {
      total: emergencies.length,
      triggered: countStatus("triggered"),
      inProgress: countStatus("response_in_progress"),
      resolved: countStatus("resolved"),
      cancelled: countStatus("cancelled"),
    };
  }, [emergencies]);

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const sectionTitles = {
    overview: "Company Admin Overview",
    emergencies: "Emergency Monitoring",
  };

  return (
    <div className="ca-layout">
      <aside className="ca-sidebar">
        <div className="ca-sidebar-brand">
          <img src={logo} alt="EMSTRAP Logo" />

          <div>
            <strong>EMSTRAP</strong>
            <span>Shield</span>
          </div>
        </div>

        <div className="ca-sidebar-label">MAIN MENU</div>

        <nav className="ca-sidebar-nav">
          <button
            className={`ca-nav-item ${
              activeSection === "overview" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("overview");
              setSelectedEmergency(null);
            }}
          >
            <span>▦</span>
            Overview
          </button>

          <button
            className={`ca-nav-item ${
              activeSection === "emergencies" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("emergencies");
              setSelectedEmergency(null);
            }}
          >
            <span>⚠</span>
            Emergencies
          </button>
        </nav>

        <div className="ca-sidebar-bottom">
          <div className="ca-sidebar-user">
            <div className="ca-avatar">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div className="ca-user-info">
              <strong>{user.name}</strong>
              <span>Company Admin</span>
            </div>
          </div>

          <button className="ca-logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="ca-main">
        <header className="ca-header">
          <div>
            <span className="ca-eyebrow">WORKSPACE</span>
            <h1>{sectionTitles[activeSection]}</h1>
          </div>

          <div className="ca-header-profile">
            <div className="ca-header-avatar">
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>Company Admin</span>
            </div>
          </div>
        </header>

        <section className="ca-content">
          {error && (
            <div className="ca-alert error" role="alert">
              {error}
            </div>
          )}

          {activeSection === "overview" && (
            <>
              <div className="ca-welcome-row">
                <div>
                  <h2>
                    Welcome back, {user.name?.split(" ")[0]}.
                  </h2>
                  <p>
                    Monitor emergencies and coordinate workplace
                    safety responses.
                  </p>
                </div>

                <button
                  className="ca-primary-button"
                  onClick={() => setActiveSection("emergencies")}
                >
                  View Emergencies
                </button>
              </div>

              <div className="ca-stats-grid">
                <div className="ca-stat-card">
                  <div className="ca-stat-icon total">▤</div>
                  <span>Total Emergencies</span>
                  <strong>{counts.total}</strong>
                  <small>Recorded emergencies</small>
                </div>

                <div className="ca-stat-card">
                  <div className="ca-stat-icon triggered">!</div>
                  <span>Triggered</span>
                  <strong>{counts.triggered}</strong>
                  <small>Awaiting response</small>
                </div>

                <div className="ca-stat-card">
                  <div className="ca-stat-icon progress">↻</div>
                  <span>In Progress</span>
                  <strong>{counts.inProgress}</strong>
                  <small>Response underway</small>
                </div>

                <div className="ca-stat-card">
                  <div className="ca-stat-icon resolved">✓</div>
                  <span>Resolved</span>
                  <strong>{counts.resolved}</strong>
                  <small>Successfully resolved</small>
                </div>

                <div className="ca-stat-card">
                  <div className="ca-stat-icon cancelled">×</div>
                  <span>Cancelled</span>
                  <strong>{counts.cancelled}</strong>
                  <small>Cancelled reports</small>
                </div>
              </div>

              <section className="ca-panel">
                <div className="ca-panel-heading">
                  <div>
                    <h3>Recent Emergencies</h3>
                    <p>
                      The latest emergency reports from your company.
                    </p>
                  </div>

                  <button
                    className="ca-secondary-button"
                    onClick={() => fetchEmergencies(true)}
                    disabled={refreshing}
                  >
                    {refreshing ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>

                {loading ? (
                  <div className="ca-empty-state">
                    Loading emergencies...
                  </div>
                ) : emergencies.length === 0 ? (
                  <div className="ca-empty-state">
                    <div className="ca-empty-icon">✓</div>
                    <h4>No emergencies recorded</h4>
                    <p>
                      Emergency reports from employees will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="ca-table-wrapper">
                    <table className="ca-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Reported</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {emergencies.slice(0, 5).map((emergency) => (
                          <tr key={emergency._id || emergency.id}>
                            <td>
                              <strong>
                                {emergency.reportedBy?.name ||
                                  emergency.reportedBy?.email ||
                                  "Unknown employee"}
                              </strong>
                            </td>

                            <td>{formatStatus(emergency.type)}</td>

                            <td>
                              <span
                                className={`ca-status-badge ${emergency.status}`}
                              >
                                {formatStatus(emergency.status)}
                              </span>
                            </td>

                            <td>{formatDate(emergency.createdAt)}</td>

                            <td>
                              <button
                                className="ca-view-button"
                                onClick={() => {
                                  setSelectedEmergency(emergency);
                                  setActiveSection("emergencies");
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activeSection === "emergencies" && (
            <>
              <div className="ca-welcome-row">
                <div>
                  <h2>Emergency Monitoring</h2>
                  <p>
                    View and monitor emergency reports submitted by
                    employees in your company.
                  </p>
                </div>

                <button
                  className="ca-secondary-button"
                  onClick={() => fetchEmergencies(true)}
                  disabled={refreshing}
                >
                  {refreshing ? "Refreshing..." : "↻ Refresh"}
                </button>
              </div>

              <section className="ca-panel">
                <div className="ca-filter-row">
                  <input
                    type="text"
                    placeholder="Search employee, type, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {formatStatus(type)}
                      </option>
                    ))}
                  </select>

                  <button
                    className="ca-clear-button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setTypeFilter("");
                    }}
                  >
                    Clear
                  </button>
                </div>

                <div className="ca-results-label">
                  Showing {filteredEmergencies.length} of{" "}
                  {emergencies.length} emergencies
                </div>

                {loading ? (
                  <div className="ca-empty-state">
                    Loading emergencies...
                  </div>
                ) : filteredEmergencies.length === 0 ? (
                  <div className="ca-empty-state">
                    <div className="ca-empty-icon">⌕</div>
                    <h4>No matching emergencies</h4>
                    <p>
                      Try changing your filters or search term.
                    </p>
                  </div>
                ) : (
                  <div className="ca-table-wrapper">
                    <table className="ca-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Location</th>
                          <th>Reported</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredEmergencies.map((emergency) => (
                          <tr key={emergency._id || emergency.id}>
                            <td>
                              <strong>
                                {emergency.reportedBy?.name ||
                                  emergency.reportedBy?.email ||
                                  "Unknown employee"}
                              </strong>
                            </td>

                            <td>{formatStatus(emergency.type)}</td>

                            <td className="ca-description-cell">
                              {emergency.description || "—"}
                            </td>

                            <td>
                              <span
                                className={`ca-status-badge ${emergency.status}`}
                              >
                                {formatStatus(emergency.status)}
                              </span>
                            </td>

                            <td>
                              {emergency.location?.address ||
                                (emergency.location?.latitude != null &&
                                emergency.location?.longitude != null
                                  ? `${emergency.location.latitude}, ${emergency.location.longitude}`
                                  : "—")}
                            </td>

                            <td>{formatDate(emergency.createdAt)}</td>

                            <td>
                              <button
                                className="ca-view-button"
                                onClick={() =>
                                  setSelectedEmergency(emergency)
                                }
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {selectedEmergency && (
                <section className="ca-panel ca-details-panel">
                  <div className="ca-panel-heading">
                    <div>
                      <h3>Emergency Details</h3>
                      <p>
                        Reference:{" "}
                        {selectedEmergency._id ||
                          selectedEmergency.id ||
                          "Unavailable"}
                      </p>
                    </div>

                    <button
                      className="ca-secondary-button"
                      onClick={() => setSelectedEmergency(null)}
                    >
                      Close Details
                    </button>
                  </div>

                  <div className="ca-details-grid">
                    <div className="ca-detail-item">
                      <span>Reported By</span>
                      <strong>
                        {selectedEmergency.reportedBy?.name ||
                          selectedEmergency.reportedBy?.email ||
                          "Unknown employee"}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Emergency Type</span>
                      <strong>
                        {formatStatus(selectedEmergency.type)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Status</span>
                      <strong>
                        {formatStatus(selectedEmergency.status)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Reported At</span>
                      <strong>
                        {formatDate(selectedEmergency.createdAt)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Last Updated</span>
                      <strong>
                        {formatDate(selectedEmergency.updatedAt)}
                      </strong>
                    </div>

                    <div className="ca-detail-item">
                      <span>Resolved At</span>
                      <strong>
                        {formatDate(selectedEmergency.resolvedAt)}
                      </strong>
                    </div>

                    <div className="ca-detail-item full-width">
                      <span>Description</span>
                      <p>
                        {selectedEmergency.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div className="ca-detail-item full-width">
                      <span>Location</span>
                      <p>
                        {selectedEmergency.location?.address ||
                          "Address not available"}
                      </p>

                      {selectedEmergency.location?.latitude != null &&
                        selectedEmergency.location?.longitude != null && (
                          <p>
                            Latitude:{" "}
                            {selectedEmergency.location.latitude}
                            {" | "}
                            Longitude:{" "}
                            {selectedEmergency.location.longitude}
                          </p>
                        )}
                    </div>

                    {selectedEmergency.cancellationReason && (
                      <div className="ca-detail-item full-width">
                        <span>Cancellation Reason</span>
                        <p>{selectedEmergency.cancellationReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="ca-evidence-section">
                    <h4>
                      Uploaded Evidence (
                      {selectedEmergency.evidence?.length || 0})
                    </h4>

                    {!selectedEmergency.evidence?.length ? (
                      <p className="ca-no-evidence">
                        No evidence uploaded.
                      </p>
                    ) : (
                      <div className="ca-evidence-grid">
                        {selectedEmergency.evidence.map(
                          (item, index) => (
                            <div
                              className="ca-evidence-item"
                              key={item.publicId || item.url || index}
                            >
                              {item.mediaType === "video" ? (
                                <video
                                  src={item.url}
                                  controls
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={item.url}
                                  alt={`Emergency evidence ${index + 1}`}
                                />
                              )}

                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open original
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default CompanyAdminDashboard;