"use client";
import Error from "next/error";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import UserDetailsForm from "./UserDetailsForm";
import UserDetailsEditForm from "./UserDetailsEditForm";
UserDetails.propTypes = {
  params: PropTypes.object.isRequired,
};

/**
 * UserDetails component displays user details and allows for editing.
 * 
 * @param {Object} params - The URL parameters.
 * @param {string[]} params.params - The URL parameters as an array.
 * @param {string} params.params[0] - The user ID.
 * @returns {JSX.Element} The UserDetails component.
 */
export default function UserDetails({ params }) {
  // State variables
  const [loader, setLoader] = useState(true); // Loading state
  const [user, setUser] = useState({}); // User data state
  const id = params.params[0]; // User ID

  // Fetch user data from API on component mount and update
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoader(true); // Set loading state to true
        const res = await axios.get(`/api/admin/users`, {
          params: { userId: id },
          headers: {
            "x-access-token": Cookies.get("token"),
          },
        });
        if (res.data.success) {
          setLoader(false); // Set loading state to false
          setUser(res.data.data); // Update user data state
          return res.data.data;
        }
        toast.error(res.data.message); // Show error message
        return null;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    fetchUserData();
  }, [id]);

  // Render loading state or error state
  if (loader) {
    return (
      <div className="justify-center flex h-full w-full align-middle  items-center flex-col">
        <span className="loading loading-dots loading-lg h-8 text-gray-800 dark:text-white " />
      </div>
    );
  }

  // Render user details form or error state
  if (params.params.length > 1) {
    if (!params.params.includes("edit")) {
      return <Error statusCode={"Something went wrong"} />;
    }
    return <UserDetailsEditForm user={user} />;
  }

  // Render user details form
  return <UserDetailsForm user={user} />;
}
