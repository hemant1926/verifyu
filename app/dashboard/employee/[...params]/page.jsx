"use client";
import Error from "next/error";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import AdminDetailsEditForm from "./AdminDetailsEditForm";
import AdminDetailsForm from "./AdminDetailsForm";
import NewAdminForm from "./NewAdmin";
import { useRouter } from "next/navigation";
import { decrypt } from "@/helper/security";

EmployeeDetails.propTypes = {
  params: PropTypes.object.isRequired,
};

export default function EmployeeDetails({ params }) {
  const [loader, setLoader] = useState(true);
  const [user, setUser] = useState({});
  const id = params.params[0];
  const router = useRouter();

  const checkRole = () => JSON.parse(decrypt(Cookies.get("data"))).role === 1;
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoader(true);
        const res = await axios.get(`/api/admin/employee`, {
          params: { userId: id },
          headers: {
            "x-access-token": Cookies.get("token"),
          },
        });
        if (res.data.success) {
          setLoader(false);
          setUser(res.data.data);
          return res.data.data;
        }
        toast.error(res.data.message);
        return null;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    if (checkRole()) {
      router.replace("/dashboard");
    } else {
      fetchUserData();
    }
  }, [id, router]);

  if (loader) {
    return (
      <div className="justify-center flex h-full w-full align-middle  items-center flex-col">
        <span className="loading loading-dots loading-lg h-8 text-gray-800 dark:text-white " />
      </div>
    );
  }

  if (params.params.length > 1) {
    if (params.params.includes("edit")) {
      return <AdminDetailsEditForm employee={user} />;
    }
    if (params.params.includes("new")) {
      return <NewAdminForm />;
    }
    return <Error statusCode={"Something went wrong"} />;
  }

  return <AdminDetailsForm employee={user} />;
}
