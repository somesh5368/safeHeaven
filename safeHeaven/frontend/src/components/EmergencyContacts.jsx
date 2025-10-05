// src/components/EmergencyContacts.jsx - SIMPLE VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  sendEmergencyEmail, // uses existing function
} from "../api/emergency";

function EmergencyContacts() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", relation: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await getContacts();
      setContacts(res.data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateContact(editId, form);
        setEditId(null);
        alert("✅ Contact updated!");
      } else {
        await addContact(form);
        alert("✅ Contact added!");
      }
      setForm({ name: "", email: "", phone: "", relation: "" });
      fetchContacts();
    } catch (err) {
      console.error("Error saving contact:", err);
      alert("❌ Failed to save contact");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      await deleteContact(id);
      alert("✅ Contact deleted!");
      fetchContacts();
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("❌ Failed to delete");
    }
  };

  const handleEdit = (contact) => {
    setForm({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      relation: contact.relation || "",
    });
    setEditId(contact._id);
  };

  const handleCancel = () => {
    setForm({ name: "", email: "", phone: "", relation: "" });
    setEditId(null);
  };

  // ✅ Manual: Send emergency email with location
  const handleSendEmail = async () => {
    if (contacts.length === 0) {
      alert("⚠️ Please add at least one emergency contact first!");
      return;
    }

    const confirmed = window.confirm(
      `🚨 Send emergency alert to ${contacts.length} contact(s)?\n\n` +
      `This will send your current location to all emergency contacts.\n\n` +
      `Click OK to proceed.`
    );

    if (!confirmed) return;

    try {
      setSending(true);

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              await sendEmergencyEmail(locationData);
              
              alert(
                `✅ Emergency alert sent successfully!\n\n` +
                `📧 All ${contacts.length} contact(s) have been notified with your location:\n` +
                `📍 ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`
              );
            } catch (err) {
              console.error("Error sending alert:", err);
              alert("❌ Failed to send alert. Please try again.");
            } finally {
              setSending(false);
            }
          },
          (err) => {
            console.error("Location error:", err);
            alert("❌ Could not get location. Please enable location access in browser settings.");
            setSending(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        alert("❌ Geolocation not supported by your browser");
        setSending(false);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("❌ Failed to send alert");
      setSending(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📞 Emergency Contacts</h2>

      {/* ✅ Info Box */}
      <div style={styles.infoBox}>
        <div style={{ fontSize: "1.2rem", marginBottom: "5px" }}>ℹ️</div>
        <small>
          <strong>Manual:</strong> Click "Send Emergency Email" below to instantly notify contacts.
          <br />
          <strong>Auto:</strong> Alerts also sent automatically when disaster detected on dashboard.
        </small>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          style={styles.input}
          type="text"
          placeholder="Phone *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          style={styles.input}
          type="text"
          placeholder="Relationship (e.g., Friend, Family)"
          value={form.relation}
          onChange={(e) => setForm({ ...form, relation: e.target.value })}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={styles.button} type="submit">
            {editId ? "✏️ Update" : "➕ Add"}
          </button>

          {editId && (
            <button
              type="button"
              onClick={handleCancel}
              style={{ ...styles.button, background: "#e74c3c" }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ✅ Action Buttons */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <button
            style={{
              padding: "10px 20px",
              background: "#2ecc71",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              marginRight: "10px",
              fontWeight: "600",
            }}
            onClick={() => navigate("/")}
          >
            🏠 Go to Dashboard
          </button>

          <button
            style={{
              padding: "12px 24px",
              background: sending ? "#95a5a6" : "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: sending ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "700",
              boxShadow: sending ? "none" : "0 4px 12px rgba(231, 76, 60, 0.4)",
            }}
            onClick={handleSendEmail}
            disabled={sending}
          >
            {sending ? "📤 Sending..." : "🚨 Send Emergency Email"}
          </button>
        </div>
      )}

      {/* ✅ Hint */}
      {contacts.length > 0 && (
        <div style={styles.hint}>
          <small>
            💡 Click "Send Emergency Email" to immediately notify all {contacts.length} contact(s) with your location
          </small>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <p style={{ marginTop: "10px", textAlign: "center", color: "#777" }}>
          No contacts added yet. Add one above to get started.
        </p>
      ) : (
        <ul style={styles.list}>
          {contacts.map((c) => (
            <li key={c._id} style={styles.listItem}>
              <div>
                <strong>{c.name}</strong> - {c.phone}{" "}
                {c.relation && <span>({c.relation})</span>}
                <br />
                <small style={{ color: "#555" }}>{c.email || "No email"}</small>
              </div>
              <div>
                <button style={styles.smallButton} onClick={() => handleEdit(c)}>
                  ✏️
                </button>
                <button
                  style={{ ...styles.smallButton, background: "#e74c3c" }}
                  onClick={() => handleDelete(c._id)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EmergencyContacts;

// ================== Inline Styles ==================
const styles = {
  container: {
    maxWidth: "550px",
    margin: "30px auto",
    padding: "25px",
    border: "2px solid #3498db",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "20px",
    textAlign: "center",
    color: "#2c3e50",
    fontSize: "1.8rem",
  },
  infoBox: {
    padding: "12px",
    background: "#e8f5e9",
    borderRadius: "6px",
    marginBottom: "20px",
    border: "1px solid #4caf50",
    textAlign: "center",
    color: "#2e7d32",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "10px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
    fontWeight: "600",
  },
  hint: {
    padding: "10px",
    background: "#fff3cd",
    borderRadius: "6px",
    marginBottom: "15px",
    textAlign: "center",
    border: "1px solid #ffc107",
    color: "#856404",
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    background: "#f8f9fa",
    marginBottom: "5px",
    borderRadius: "4px",
  },
  smallButton: {
    marginLeft: "5px",
    padding: "6px 10px",
    fontSize: "13px",
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
