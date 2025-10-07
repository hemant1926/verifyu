"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import AdminTable from "@/components/Tables/adminTable";
import { useRouter } from "next/navigation";
import { Input, Button } from "@roketid/windmill-react-ui";
import { decrypt } from "@/helper/security";
/**
 * Admin component for displaying employees data.
 * It fetches employees data from the server, and displays it in a table.
 * It also allows searching for employees based on their name.
 * The sort order of the employees' names and the current page of the table are managed by state.
 */
export default function Admin() {
  // State to hold the employees data
  const [data, setData] = useState([]);
  // State to indicate if data is being loaded
  const [loading, setLoading] = useState(false);
  // State to indicate the sort order of the employees' names
  const [nameIsAscending, setNameIsAscending] = useState(true);
  // State to indicate the current page of the table
  const [pageTable, setPageTable] = useState(1);
  // State to indicate the total number of employees
  const [totalResults, setTotalResults] = useState(0);
  // State to hold the search query
  const [search, setSearch] = useState("");
  // Router object for navigating to other pages
  const router = useRouter();

  /**
   * Check if the user is an admin
   */
  const checkRole = () => JSON.parse(decrypt(Cookies.get("data"))).role === 1;

  /**
   * Fetches employees data from the server and updates the state.
   * It is triggered whenever the nameIsAscending, pageTable, or search state changes.
   */
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        setData([]);
        const res = await axios
          .get("/api/admin/employee", {
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
        toast.error(error.message);
        setLoading(false);
      }
    };
    // If the user is not an admin, fetch the data
    if (!checkRole()) {
      fetchAdmins();
    }
  }, [nameIsAscending, pageTable, router, search]);

  /**
   * Function called when the user presses the Add Employee button
   */
  function onPress() {
    router.push("/dashboard/employee/0/new");
  }
  return (
    <>
      <div className="flex flex-row w-full justify-between">
        <p className=" font-bold text-lg my-3 text-black dark:text-white">
          Employees
        </p>
        <div className="flex flex-row justify-end space-x-3">
          <div className="hidden sm:block my-auto">
            <Input
              className="text-sm   focus:border-0  focus-within:border-0"
              type="text"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={"Search"}
              name="search"
            />
          </div>
          <Button
            onClick={onPress}
            size="regular"
            className="inline-flex  my-2 px-6 rounded-lg  text-white text-sm font-semibold transition-colors duration-150  dark:hover:text-gray-200"
          >
            Add
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="justify-center flex h-full w-full align-middle items-center flex-col">
          <span className="loading loading-dots loading-lg h-8 dark:text-white text-black " />
        </div>
      ) : (
        <AdminTable
          setNameIsAscending={() => setNameIsAscending(!nameIsAscending)}
          response={data}
          pageTable={pageTable}
          search={search}
          totalResults={totalResults}
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
