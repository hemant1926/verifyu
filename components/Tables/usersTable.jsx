"use client";
import React, { useState } from "react";

import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TableFooter,
  Badge,
  TableContainer,
  Button,
} from "@roketid/windmill-react-ui";
import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
import { EditIcon, TrashIcon, ViewIcon } from "@/assets/icons";
import { useAuth } from "@/context/authContext";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import {
  MdOutlineKeyboardDoubleArrowLeft,
  MdOutlineKeyboardDoubleArrowRight,
} from "react-icons/md";

import { IoFilter } from "react-icons/io5";
import PopUp from "@/components/Popup/Popup";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
// make a copy of the data, for the second table

UsersTable.propTypes = {
  response: PropTypes.array.isRequired,
  setNameIsAscending: PropTypes.func.isRequired,
  setPageTable: PropTypes.func.isRequired,
  pageTable: PropTypes.number.isRequired,
  totalResults: PropTypes.number.isRequired,
  search: PropTypes.string.isRequired,
};

export default function UsersTable({
  response,
  setNameIsAscending,
  setPageTable,
  pageTable,
  totalResults,
  search,
}) {
  const { userDetails } = useAuth();
  const router = useRouter();
  const [dataTable, setDataTable] = useState(response);
  const [dataIsAscending, setDataIsAscending] = useState(true);
  const [isDeleteModelOpen, setIsDeleteModelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  // pagination setup
  const resultsPerPage = 10;

  // pagination change control

  const tableHeaders = [
    { key: "index", label: "SR No.", showFilter: true },
    { key: "name", label: "Name", showFilter: true },
    { key: "mobileno", label: "Mobile No", showFilter: false },
    { key: "email", label: "Email", showFilter: false },
    { key: "status", label: "Status", showFilter: false },
  ];
  const ViewUsersDetails = (index) => {
    router.push("/dashboard/users/" + response[index]["id"]);
  };
  const EditUsersDetails = (index) => {
    router.push("/dashboard/users/" + response[index]["id"] + "/edit");
  };

  const DeleteUsersDetails = async () => {
    const data = await axios
      .delete("/api/admin/users", {
        headers: {
          "x-access-token": Cookies.get("token"),
        },
        params: { id: selectedId },
      })
      .then((res) => res.data);
    if (data.success) {
      toast.success("User deleted successfully");
      setIsDeleteModelOpen(false);
      setSelectedId("");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;
    }
    toast.error("Error while deleting user");
  };
  function showDeletePopup(index) {
    setIsDeleteModelOpen(true);
    setSelectedId(response[index]["id"]);
  }

  const filterData = (index) => {
    if (index === 0) {
      let sortedData = [...response].sort((a, b) => {
        const keyA = a[tableHeaders[index].key];
        const keyB = b[tableHeaders[index].key];
        if (typeof keyA === "string" && typeof keyB === "string") {
          return keyB.localeCompare(keyA);
        }
        return 0; // If the values are not strings, leave them unchanged
      });

      setDataTable(() => {
        if (dataIsAscending) {
          sortedData.reverse();
        }
        return sortedData;
      });

      setDataIsAscending(!dataIsAscending);
    } else if (index === 1) {
      setNameIsAscending();
    }
  };

  const DeleteUserModelBtn = [
    <Button
      key={"cancel"}
      block
      size="large"
      layout="outline"
      onClick={() => setIsDeleteModelOpen(false)}
    >
      Cancel
    </Button>,
    <Button
      key={"Delete"}
      block
      size="large"
      className="bg-red-500"
      onClick={() => DeleteUsersDetails()}
    >
      Delete
    </Button>,
  ];

  return (
    <>
      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              {tableHeaders.map((header, i) => (
                <TableCell key={i}>
                  <div className="flex flex-row align-middle ">
                    {header.label}

                    {header.showFilter ? (
                      <IoFilter
                        className="ml-4 text-lg"
                        onClick={() => filterData(i)}
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {dataTable.map((data, index) => (
              <TableRow key={index}>
                {tableHeaders.map((header) => (
                  <TableCell key={header.key}>
                    {header.key === "status" ? (
                      <Badge
                        type={data[header.key] === 1 ? "success" : "danger"}
                      >
                        <span className="font-medium text-sm">
                          {data[header.key] === 1 ? "Live" : "Deleted"}
                        </span>
                      </Badge>
                    ) : (
                      <span className="text-sm">
                        {header.key === "index"
                          ? (pageTable - 1) * 10 + index + 1
                          : data[header.key]}
                      </span>
                    )}
                  </TableCell>
                ))}

                <TableCell>
                  <div className="flex items-center space-x-4">
                    <Button
                      layout="link"
                      size="small"
                      aria-label={"View"}
                      onClick={() => ViewUsersDetails(index)}
                    >
                      <ViewIcon className="w-5 h-5" aria-hidden="true" />
                    </Button>
                    {data["status"] === 2 && userDetails?.role === 2 && (
                      <Button
                        layout="link"
                        size="small"
                        aria-label={"Delete"}
                        onClick={() => showDeletePopup(index)}
                      >
                        <TrashIcon className="w-5 h-5" aria-hidden="true" />
                      </Button>
                    )}

                    {userDetails?.role === 2 && data["status"] === 1 && (
                      <Button
                        layout="link"
                        size="small"
                        aria-label={"Edit"}
                        onClick={() => EditUsersDetails(index)}
                      >
                        <EditIcon className="w-5 h-5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooter>
          <div className="flex flex-col sm:flex-row items-center  justify-between">
            {search == "" ? (
              <div className="flex flex-row items-center justify-start text-sm text-black dark:text-white">
                SHOWING {pageTable * resultsPerPage - resultsPerPage + 1} TO{" "}
                {pageTable * resultsPerPage > totalResults
                  ? totalResults
                  : pageTable * resultsPerPage}{" "}
                OF {totalResults} RESULTS
              </div>
            ) : (
              <div className="flex flex-row items-center justify-start text-sm text-black dark:text-white">
                {totalResults} RESULTS FOUND
              </div>
            )}
            {search == "" ? (
              <div className="flex items-center  justify-evenly space-x-2 text-primary">
                <MdOutlineKeyboardDoubleArrowLeft
                  onClick={() => (pageTable == 1 ? null : setPageTable(1))}
                  className="text-2xl"
                />
                <IoIosArrowBack
                  onClick={() =>
                    pageTable == 1 ? null : setPageTable(pageTable - 1)
                  }
                  className="text-2xl"
                />

                <span className="text-black dark:text-white text-lg  ">
                  {pageTable}
                </span>
                <IoIosArrowForward
                  onClick={() =>
                    Math.ceil(totalResults / resultsPerPage) == pageTable
                      ? null
                      : setPageTable(pageTable + 1)
                  }
                  className="text-2xl"
                />
                <MdOutlineKeyboardDoubleArrowRight
                  onClick={() =>
                    Math.ceil(totalResults / resultsPerPage) == pageTable
                      ? null
                      : setPageTable(Math.ceil(totalResults / resultsPerPage))
                  }
                  className="text-2xl"
                />
              </div>
            ) : (
              <></>
            )}
          </div>
        </TableFooter>
      </TableContainer>
      {isDeleteModelOpen && (
        <PopUp
          isModalOpen={isDeleteModelOpen}
          popUpHeader={"Deleting the User Confirmation"}
          closeModal={() => setIsDeleteModelOpen(false)}
          popUpBody={
            "Are you sure you want to delete this user details completely? This action cannot be undone and will permanently delete the user."
          }
          popBtn={DeleteUserModelBtn}
        />
      )}
    </>
  );
}
