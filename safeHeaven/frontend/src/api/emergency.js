import axios from "axios";

const API = "http://localhost:5000/api/emergency"; // update if your backend URL is different

// Get JWT token from localStorage
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// GET all contacts
export const getContacts = () => axios.get(API, authHeader());

// ADD a new contact
export const addContact = (contact) => axios.post(API, contact, authHeader());

// UPDATE a contact
export const updateContact = (id, contact) => axios.put(`${API}/${id}`, contact, authHeader());

// DELETE a contact
export const deleteContact = (id) => axios.delete(`${API}/${id}`, authHeader());
