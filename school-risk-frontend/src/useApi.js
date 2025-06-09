// src/useApi.js
//-----------------------------------------------
// Wrap axios so you don't repeat headers.
// Pass the ID token when you call.
//-----------------------------------------------
import axios from 'axios';

export default function useApi(token) {
  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return api;
}
