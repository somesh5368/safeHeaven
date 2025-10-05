// src/api/emergency.js
import API from './axiosConfig';

const ENDPOINT = '/api/emergency';

// ================== CONTACT CRUD ==================

// GET all emergency contacts
export const getContacts = async () => {
  try {
    const response = await API.get(ENDPOINT);
    return response;
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    throw error;
  }
};

// ADD a new emergency contact
export const addContact = async (contact) => {
  try {
    const response = await API.post(ENDPOINT, contact);
    return response;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

// UPDATE an existing emergency contact
export const updateContact = async (id, contact) => {
  try {
    const response = await API.put(`${ENDPOINT}/${id}`, contact);
    return response;
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }
};

// DELETE an emergency contact
export const deleteContact = async (id) => {
  try {
    const response = await API.delete(`${ENDPOINT}/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
};

// ================== EMAIL ALERT ==================

// Send emergency email to all contacts (with location)
export const sendEmergencyEmail = async (location) => {
  try {
    const response = await API.post(`/api/emergency/send-email`, location);
    return response;
  } catch (error) {
    console.error('Error sending emergency email:', error);
    throw error;
  }
};

