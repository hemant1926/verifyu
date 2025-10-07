
'use client'
import React, { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { decrypt, encrypt } from "@/helper/security";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [userDetails, setUserDetails] = useState(null);

    const login = (_userDetails) => {
        setUserDetails(_userDetails);
        Cookies.set("data", encrypt(JSON.stringify(_userDetails)));
        setIsAuthenticated(true);
    };

    const logout = () => {
        setUserDetails(null);
        setIsAuthenticated(false);
        
    };

    const updateUserDetails = (userDetails) => {
        setUserDetails(userDetails);
    };

    useEffect(() => {
        const storedUserData = Cookies.get('data');
        if (storedUserData) {
            setIsAuthenticated(true);
            setUserDetails(JSON.parse(decrypt(storedUserData)));
        }
    }, []);


    const value = {
        isAuthenticated,
        userDetails,
        login,
        logout,
        updateUserDetails,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.any.isRequired,
};

export const useAuth = () =>
    useContext(AuthContext);


