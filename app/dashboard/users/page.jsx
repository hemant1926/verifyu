"use client";
import React, { useEffect, useState } from "react";
// import axios from "axios";
import UsersTable from "@/components/Tables/usersTable";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import { Input } from "@roketid/windmill-react-ui";
/**
 * Users component for displaying users data.
 * It fetches users data from the server, and displays it in a table.
 * It also allows searching for users based on their name.
 */
export default function Users() {
  // State to hold the users data
  const [data, setData] = useState([]);
  // State to indicate if data is being loaded
  const [loading, setLoading] = useState(false);
  // State to indicate the sort order of the users' names
  const [nameIsAscending, setNameIsAscending] = useState(true);
  // State to indicate the current page of the table
  const [pageTable, setPageTable] = useState(1);
  // State to indicate the total number of users
  const [totalResults, setTotalResults] = useState(0);
  // State to hold the search query
  const [search, setSearch] = useState("");

  /**
   * Fetches users data from the server and updates the state.
   * It is triggered whenever the nameIsAscending, pageTable, or search state changes.
   */
  useEffect(() => {
    const abortController = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setData([]);
        const res = await axios
          .get("/api/admin/users", {
            signal: abortController.signal,
            params: {
              descending: !nameIsAscending,
              page: pageTable,
              search: search,
            },
            headers: {
              "x-access-token": Cookies.get("token"),
            },
          })
          .catch((error) => {
            console.error(error);
          });
        if (res.data.success) {
          setTotalResults(res.data.totalResults);
          setData(res.data.data);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        setData([]);
        if (axios.isCancel(error)) {
          console.error("Operation canceled");
        }
        toast.error(error.message);
        setLoading(false);
      }
      abortController.abort();
    };
    fetchUsers();
  }, [nameIsAscending, pageTable, search]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-row justify-between align-middle">
        <span className=" font-bold text-lg my-3 text-black dark:text-white">
          Users
        </span>
        {/* Search input */}
        <div className="w-1/3 hidden sm:block my-auto">
          <Input
            className="text-sm   focus:border-0  focus-within:border-0"
            type="text"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={"Search"}
            name="search"
          />
        </div>
      </div>
      {/* Display loading spinner if data is being loaded */}
      {loading && data.length === 0 ? (
        <div className="justify-center flex h-full w-full align-middle items-center flex-col">
          <span className="loading loading-dots loading-lg h-8 dark:text-white text-black" />
        </div>
      ) : (
        // Display the table with the users data
        <UsersTable
          setNameIsAscending={() => setNameIsAscending(!nameIsAscending)}
          response={data}
          pageTable={pageTable}
          totalResults={totalResults}
          search={search}
          setPageTable={(value) => {
            if (value !== pageTable) {
              setPageTable(value);
            }
          }}
        />
      )}
    </>
  );
}
