"use client";
import React, { useEffect, useState } from "react";

import InfoCard from "@/components/InfoCard/InfoCard";
import RoundIcon from "@/components/RoundIcon/roundIcon";
import axios from "axios";
import { useAuth } from "@/context/authContext";

/**
 * DashboardPage component
 * 
 * This component renders the dashboard page where it displays the total number
 * of users and employees.
 */
export default function DashboardPage() {
  // State to hold the counts of users and employees
  const [counts, setCounts] = useState({
    emp: 0,
    user: 0,
  });

  // Get the user details from the authentication context
  const { userDetails } = useAuth();

  /**
   * UseEffect hook to fetch the counts of users and employees when the component mounts
   */
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Make a GET request to the API endpoint to get the counts
        const response = await axios.get("/api/admin/miscellaneous");

        // Update the counts state with the data from the API response
        setCounts(response.data.data);
      } catch (error) {
        // Log any errors that occur during the API request
        console.error(error);
      }
    };

    // Call the fetchCounts function when the component mounts
    fetchCounts();
  }, []);

  return (
    <div>
      {/* Heading for the dashboard page */}
      <div className="flex flex-row w-full justify-between">
        <p className=" font-bold text-lg my-3 text-black dark:text-white">
          Dashboard
        </p>
      </div>

      {/* Grid to display the info cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        {/* Info card for the total number of users */}
        <InfoCard title="Total No of Users" value={counts.user.toString()}>
          {/* Round icon for the info card */}
          <RoundIcon
            iconColorClass="text-green-500 dark:text-green-100"
            bgColorClass="bg-green-100 dark:bg-green-500"
            className="mr-4"
          />
        </InfoCard>
        {/* Conditionally render the info card for the total number of employees if the user is an admin */}
        {userDetails?.role == 2 && (
          <InfoCard title="Total No of Employees" value={counts.emp.toString()}>
            {/* Round icon for the info card */}
            <RoundIcon
              iconColorClass="text-orange-500 dark:text-orange-100"
              bgColorClass="bg-orange-100 dark:bg-orange-500"
              className="mr-4"
            />
          </InfoCard>
        )}
      </div>
    </div>
  );
}
