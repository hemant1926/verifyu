"use client";
import moment from "moment";
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Label, Input } from "@roketid/windmill-react-ui";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
AdminDetailsEditForm.propTypes = {
  employee: PropTypes.any.isRequired,
};

function AdminDetailsEditForm({ employee }) {
  const [userData, setUserData] = useState({});
  const [showLoader, setShowLoader] = useState(false);
  const route = useRouter();
  useEffect(() => {
    setUserData(employee);
  }, [employee]);

  if (employee == null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold">User Not Found</h2>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setShowLoader(true);
      const formData = Object.fromEntries(
        Array.from(new FormData(e.currentTarget))
      );
      // Check the confirm password
      if (formData.password != formData.confirmPassword) {
        toast.error("Confirm password did not match");
        setShowLoader(false);
        return;
      }
      formData.id = employee.id;
      setUserData({
        ...userData,
        ...formData,
      });
      let data = {
        ...userData,
        ...formData,
      };
      delete data.confirmPassword;

      const res = await axios.put("/api/admin/employee", data, {
        headers: {
          "x-access-token": Cookies.get("token"),
        },
      });
      if (res.data.success) {
        route.push("/dashboard/employee");
        toast.success("Employee details updated successfully");
        setShowLoader(false);
        return;
      }

      toast.error("Something went wrong");
      setShowLoader(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setShowLoader(false);
    }
  };

  return (
    <form className="flex flex-col w-full  mb-5" onSubmit={onSubmit}>
      <div className="flex flex-row  h-fit justify-end my-3 align-middle">
        <button
          type="submit"
          size="small"
          className="bg-primary  rounded-lg font-semibold text-white h-fit py-2 my-auto hidden md:block w-1/6 "
          disabled={showLoader}
        >
          {showLoader ? (
            <span className="loading loading-dots loading-md h-5 dark:text-white text-black"></span>
          ) : (
            <span className="m-2"> Submit </span>
          )}
        </button>
      </div>
      <div className="flex flex-col space-y-1  sm:flex-row  sm:space-y-0 sm:space-x-2">
        <div className="text-sm font-semibold">
          Create on :{" "}
          <span className="font-medium text-lg ml-1">
            {moment(employee.createddate).format("DD-MM-YYYY")}{" "}
          </span>
        </div>
        <div className="text-sm font-semibold">
          Updated on :{" "}
          <span className="font-medium text-lg ml-1 ">
            {moment(employee.updatedAt).format("DD-MM-YYYY")}
          </span>
        </div>
      </div>

      <div className="flex flex-col space-y-3 mt-2 md:space-x-5  w-full md:space-y-0 md:flex-row  ">
        <div className="flex flex-col text-black w-full md:w-1/3 dark:text-white space-y-2">
          <Label>
            <span>
              User Name
              <span className="text-red-500 ml-1">*</span>
            </span>
            <Input
              className="mt-1 focus:border-0  focus-within:border-0"
              type="text"
              defaultValue={userData.userName}
              placeholder={employee.userName}
              name="userName"
              required
            />
          </Label>
          <Label>
            <span>
              Name
              <span className="text-red-500 ml-1">*</span>
            </span>
            <Input
              className="mt-1 focus:border-0  focus-within:border-0"
              type="text"
              defaultValue={userData.name}
              placeholder={employee.name}
              name="name"
              required
            />
          </Label>
          <Label>
            <span>
              Mobile No.
              <span className="text-red-500 ml-1">*</span>
            </span>
            <Input
              className="mt-1 focus:border-0  focus-within:border-0"
              type="text"
              defaultValue={userData.mobileno}
              placeholder={employee.mobileno}
              name="mobileno"
              required
            />
          </Label>
          <Label>
            <span>Status</span>
            <button type="button" size="small"></button>
            <div>
              <input
                id="status-toggle"
                type="checkbox"
                className="sr-only peer"
                checked={userData.status === 1}
                onChange={(e) =>
                  setUserData({ ...userData, status: e.target.checked ? 1 : 0 })
                }
              />
              <label
                htmlFor="status-toggle"
                className={` bg-gray-300 relative inline-flex w-10 h-6 transition-colors duration-200 flex-shrink-0  items-center justify-start peer-checked:justify-end rounded-full focus-within:outline-0 focus:outline-none peer-checked:bg-green-600 peer-checked:dark:bg-green-400 peer-checked:shadow-inner-green-900 peer-checked:dark:shadow-inner-green-500 peer-checked:ring-0 peer-checked:dark:ring-0`}
              >
                <span
                  className={`bg-white dark:bg-gray-800 w-4 h-4 rounded-full mx-1  transition-transform peer-checked:translate-x-8 peer-checked:shadow-none peer-checked:ring-0 `}
                ></span>
              </label>
            </div>
          </Label>
        </div>
        <div className="flex flex-col text-black w-full md:w-1/3 dark:text-white space-y-2">
          <Label>
            <span>
              Email Id
              <span className="text-red-500 ml-1">*</span>
            </span>
            <Input
              className="mt-1 focus:border-0  focus-within:border-0"
              type="email"
              defaultValue={userData.email}
              placeholder={employee.email}
              name="email"
              required
            />
          </Label>
          <Label>
            <span>New Password</span>
            <Input
              className="mt-1 focus:border-0  focus-within:border-0"
              type="text"
              placeholder={"**********"}
              name="password"
              title="Password must contain at least 4 characters"
              pattern=".{4,}"
            />
          </Label>
          <Label>
            <span>Confirm Password</span>
            <Input
              className="mt-1 focus:border-0  focus-within:border-0"
              type="text"
              placeholder={"**********"}
              name="confirmPassword"
              title="Password must contain at least 4 characters"
              pattern=".{4,}"
            />
          </Label>
        </div>
      </div>

      <button
        className="bg-primary  block md:hidden   my-4 font-semibold h-fit py-2 w-full text-white rounded-lg"
        type="submit"
        disabled={showLoader}
        size="small"
      >
        {showLoader ? (
          <span className="loading loading-dots loading-md h-5 dark:text-white text-black"></span>
        ) : (
          <span className="m-2"> Submit </span>
        )}
      </button>
    </form>
  );
}

export default AdminDetailsEditForm;
