"use client";
import React, { useState } from "react";

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@roketid/windmill-react-ui";
import PropTypes from "prop-types";
import { Input, Button } from "@roketid/windmill-react-ui";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

OTPPopUp.propTypes = {
  popUpHeader: PropTypes.string.isRequired,
  phoneNumber: PropTypes.string.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  ShowUpdateModel: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
};
export default function OTPPopUp({
  phoneNumber,
  userData,
  popUpHeader,
  isModalOpen,
  ShowUpdateModel,
}) {
  const [otp, setOtp] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();

  /**
   * Submits the form data for updating a user's information.
   *
   * @return {Promise<void>} A promise that resolves when the user is successfully updated.
   * @throws {Error} If there is an error during the update process.
   */
  async function OnSubmit() {
    try {
      // Set the loading state to true
      setShowLoader(true);

      // Create a new FormData object and append the necessary data
      const formData = new FormData();
      formData.append("mobileno", phoneNumber);
      formData.append("userId", userData.userId);
      formData.append("firstname", userData.firstname);
      formData.append("middlename", userData.middlename);
      formData.append("lastname", userData.lastname);
      formData.append("bloodType", userData.bloodType);
      formData.append("dateofbirth", userData.dateofbirth);
      formData.append("aadharno", userData.aadharno);

      formData.append("gender", userData.gender);
      formData.append("panno", userData.panno);
      formData.append("currentAddress", userData.currentAddress);
      formData.append("permanentAddress", userData.permanentAddress);
      formData.append("geolocation", JSON.stringify(userData.geolocation));
      formData.append(
        "emergencyDetails",
        JSON.stringify(userData.emergencyDetails)
      );
      if (userData.photo) {
        formData.append("photo", userData.photo);
      }
      formData.append("email", userData.email);
      formData.append("medicalhistory", userData.medicalhistory);
      formData.append("allergydetails", userData.allergydetails);
      formData.append("mode", phoneNumber);
      formData.append("otp", otp);

      // Send a PUT request to the server to update the user's information
      const res = await axios.put("/api/admin/userpermission", formData, {
        headers: {
          "x-access-token": Cookies.get("token"),
        },
      });

      // If the update is successful, show a success message and redirect to the user list page
      if (res.data.success) {
        setShowLoader(false);
        ShowUpdateModel(false);
        toast.success("User updated successfully");
        router.replace("/dashboard/users/");
        return;
      }

      // If there is an error, show an error message
      toast.error("Something went wrong");
      setShowLoader(false);
    } catch (error) {
      // If there is an unhandled error, log it to the console
      toast.error("Something went wrong");
      console.error(error);
      setShowLoader(false);
    }
  }

  return (
    <Modal isOpen={isModalOpen} onClose={() => ShowUpdateModel(false)}>
      <ModalHeader> {popUpHeader}</ModalHeader>
      <ModalBody>
        <p className="font-bold my-2  ">OTP sent to {phoneNumber}</p>
        <Input onChange={(e) => setOtp(e.target.value)} maxLength={4} />
      </ModalBody>
      <ModalFooter>
        <div className="hidden  space-x-3 w-full flex-row sm:flex">
          <Button
            key={"cancel"}
            block
            size="regular"
            layout="outline"
            onClick={() => ShowUpdateModel(false)}
          >
            Cancel
          </Button>
          <Button
            key={"sendOTP"}
            block
            size="regular"
            className="bg-green-500"
            onClick={() => OnSubmit()}
          >
            Submit OTP
          </Button>
        </div>
        <div className="block w-full sm:hidden">
          <Button
            key={"cancel"}
            block
            size="regular"
            layout="outline"
            onClick={() => ShowUpdateModel(false)}
          >
            Cancel
          </Button>
          <Button
            key={"sendOTP"}
            block
            size="regular"
            className="bg-green-500 my-4"
            onClick={() => OnSubmit()}
            disabled={showLoader}
          >
            {showLoader ? (
              <span className="loading loading-dots loading-md h-5 dark:text-white text-black"></span>
            ) : (
              <span className="m-2"> Submit OTP </span>
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
