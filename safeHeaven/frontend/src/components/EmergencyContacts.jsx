import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  sendEmergencyEmail, // <-- new API call
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
      } else {
        await addContact(form);
      }
      setForm({ name: "", email: "", phone: "", relation: "" });
      fetchContacts();
    } catch (err) {
      console.error("Error saving contact:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      fetchContacts();
    } catch (err) {
      console.error("Error deleting contact:", err);
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

  // New: Send email to all contacts
const handleSendEmail = async () => {
  try {
    setSending(true);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        await sendEmergencyEmail(locationData); // pass location to backend
        alert("✅ Emergency email with location sent!");
        setSending(false);
      }, (err) => {
        console.error("Location error:", err);
        alert("❌ Could not get location");
        setSending(false);
      });
    } else {
      alert("❌ Geolocation not supported by your browser");
      setSending(false);
    }
  } catch (err) {
    console.error("Error sending emails:", err);
    alert("❌ Failed to send emails.");
    setSending(false);
  }
};


  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📞 Emergency Contacts</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          placeholder="Name"
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
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          style={styles.input}
          type="text"
          placeholder="Relation"
          value={form.relation}
          onChange={(e) => setForm({ ...form, relation: e.target.value })}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={styles.button} type="submit">
            {editId ? "Update" : "Add"}
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

      {/* Show action buttons only if at least 1 contact */}
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
            }}
            onClick={() => navigate("/")}
          >
            🏠 Go to Home
          </button>

          <button
            style={{
              padding: "10px 20px",
              background: "#e67e22",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
            onClick={handleSendEmail}
            disabled={sending}
          >
            {sending ? "Sending..." : "📧 Send Emergency Email"}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p>Loading contacts...</p>
      ) : contacts.length === 0 ? (
        <p style={{ marginTop: "10px" }}>No contacts added yet.</p>
      ) : (
        <ul style={styles.list}>
          {contacts.map((c) => (
            <li key={c._id} style={styles.listItem}>
              <div>
                <strong>{c.name}</strong> - {c.phone}{" "}
                {c.relation && <span>({c.relation})</span>}
                <br />
                <small style={{ color: "#555" }}>{c.email}</small>
              </div>
              <div>
                <button style={styles.smallButton} onClick={() => handleEdit(c)}>
                  ✏️ Edit
                </button>
                <button
                  style={{ ...styles.smallButton, background: "#e74c3c" }}
                  onClick={() => handleDelete(c._id)}
                >
                  ❌ Delete
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
    maxWidth: "500px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "#f9f9f9",
  },
  title: {
    marginBottom: "15px",
    textAlign: "center",
    color: "#2c3e50",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    padding: "8px",
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
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    borderBottom: "1px solid #ddd",
  },
  smallButton: {
    marginLeft: "5px",
    padding: "5px 8px",
    fontSize: "12px",
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
