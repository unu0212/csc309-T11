import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetch(`${BACKEND_URL}/user/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(res => res.ok ? res.json() : Promise.reject(res))
              .then(data => setUser(data.user))
              .catch(() => setUser(null));
          }
        }, []);

    const login = async (username, password) => {
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const errorData = await res.json();
                return errorData.message;
            }

            const data = await res.json();
            localStorage.setItem("token", data.token);

            const userRes = await fetch(`${BACKEND_URL}/user/me`, {
                headers: { Authorization: `Bearer ${data.token}` }
            });
            const profileData = await userRes.json();
            setUser(profileData.user);
            // if (!userRes.ok) {
            //     let message = "Failed to fetch user info";
            //     const contentType = userRes.headers.get("Content-Type") || "";
            //     if (contentType.includes("application/json")) {
            //         const data = await userRes.json();
            //         message = data.message || message;
            //     }
            //     return message;
            // }

            // const { user } = await userRes.json();
            // setUser(user);
            navigate("/profile");
        } catch (err) {
            return "Login failed1";
        }
    };

    const register = async (userData) => {
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                const error = await res.json();
                return error.message;
            }

            navigate("/success");
        } catch (err) {
            return "registrfialed";
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
