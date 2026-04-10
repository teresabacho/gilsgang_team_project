import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!user) {
            axios.get('/api/profile').then(({ data }) => {
                setUser(data);
                setReady(true);
            });
        }
    }, [user]);

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const refreshUser = async () => {
  const res = await axios.get("/api/user/me");
  setUser(res.data);
};

    return (
        <UserContext.Provider value={{ user, setUser, ready, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}
