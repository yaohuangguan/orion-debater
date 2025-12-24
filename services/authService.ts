import { User } from "../types";

const API_URL = "https://bananaboom-api-242273127238.asia-east1.run.app/api";

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
  message_cn?: string;
}

export const authService = {
  async register(data: { displayName: string; email: string; password: string; passwordConf: string; phone?: string }) {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message_cn || json.message || 'Registration failed');
    }
    return json as AuthResponse;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_URL}/users/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message_cn || json.message || 'Login failed');
    }
    return json as AuthResponse;
  },

  async logout(token: string) {
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
      });
    } catch (e) {
      console.error("Logout failed", e);
    }
  }
};