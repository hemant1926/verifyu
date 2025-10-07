"use client";
import moment from "moment";
import React, { createRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Label, Select, Input } from "@roketid/windmill-react-ui";
import { bloodGroups, gender, relations } from "@/assets/data/constant";
import { toast } from "react-toastify";
import OTPPopUp from "@/components/Popup/OtpPopup";
import axios from "axios";
import Cookies from "js-cookie";
import { CameraIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useRouter } from "next/navigation";
UserDetailsEditForm.propTypes = {
  user: PropTypes.any.isRequired,
};

function UserDetailsEditForm({ user }) {
  const [userData, setUserData] = useState({});
  const [showLoader, setShowLoader] = useState(false);
  const [isUpdateModelOpen, setIsUpdateModelOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [sameResident, setSameResident] = useState(false);
  const route = useRouter();
  const imagePickerRef = createRef();
  useEffect(() => {
    setUserData(user);
    setSelectedImage(user.photo);
    setSameResident(user.permanentAddress === user.currentAddress);
  }, [user]);

  if (user == null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold">User Not Found</h2>
      </div>
    );
  }

  function ShowUpdateModel(value) {
    setShowLoader(value);
    setIsUpdateModelOpen(value);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setShowLoader(true);
      const formData = Object.fromEntries(
        Array.from(new FormData(e.currentTarget))
      );

      if (selectedImage && !selectedImage.startsWith("https:")) {
        const base64Data = selectedImage.replace(
          /^data:([\s\S]*);base64,([\s\S]*)$/,
          "$2"
        );
        const binaryData = Buffer.from(base64Data, "base64");
        const fileData = {
          data: binaryData,
          name: "userImage.png",
          type: "image/png",
        };
        formData.photo = new File([fileData.data], fileData.name, {
          type: fileData.type,
        });
      }

      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        formData.geolocation = [latitude, longitude];
      });

      const emergencyDetails = [];
      for (let i = 0; ; i++) {
        const nameKey = `EmergencyDetails-${i}-name`;
        const phoneNumberKey = `EmergencyDetails-${i}-phoneNumber`;
        const relationKey = `EmergencyDetails-${i}-relation`;
        const othersKey = `EmergencyDetails-${i}-others`;
        const name = formData[nameKey];
        if (!name) break;
        const phoneNumber = formData[phoneNumberKey];
        const relation = formData[relationKey];
        const others = formData[othersKey] ?? "";
        delete formData[nameKey];
        delete formData[phoneNumberKey];
        delete formData[relationKey];
        delete formData[othersKey];
        await new Promise((resolve) => {
          setTimeout(() => {
            emergencyDetails.push({
              name,
              phoneNumber,
              relation,
              others,
            });
            resolve();
          }, 0);
        });
      }
      formData.emergencyDetails = emergencyDetails;
      formData.email = user.email;
      formData.userId = user.id;
      setUserData(formData);
      const res = await axios.get("/api/admin/userpermission", {
        params: { userId: user.id },
        headers: {
          "x-access-token": Cookies.get("token"),
        },
      });

      if (res.data.success) {
        toast.success("OTP send to user registered mobile number");
        ShowUpdateModel(true);
        return;
      }
      console.log(res.data);
      toast.error("Something went wrong");
      setShowLoader(false);
    } catch (error) {
      console.error(error);
      setShowLoader(false);
      toast.error("Something went wrong");
    }
  };

  const onPickImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col w-full  mb-5">
      <form onSubmit={onSubmit}>
        <div className="flex flex-row  h-fit justify-between my-3 align-middle">
          <p className=" text-2xl text-gray-900 my-2 dark:text-white">
            Update Profile
          </p>
          <div className="flex space-x-2">
            <button
              type="button"
              size="small"
              className="bg-primary  rounded-lg font-semibold text-white h-fit py-2 my-auto hidden md:block  w-36 "
              disabled={showLoader}
              onClick={() => route.back()}
            >
              <span className="m-2"> Back </span>
            </button>
            <button
              type="submit"
              size="small"
              className="bg-primary  rounded-lg font-semibold text-white h-fit py-2 my-auto hidden md:block   w-36"
              disabled={showLoader}
            >
              {showLoader ? (
                <span className="loading loading-dots loading-md h-5 dark:text-white text-black"></span>
              ) : (
                <span className="m-2"> Submit </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col md:h-72  mb-8 w-full space-y-5 md:space-y-0 md:space-x-10 justify-self-center align-top md:flex-row  md:justify-start">
          <div className="md:text-start text-center  ">
            <div className="relative w-fit mx-auto md:mx-0 align-middle justify-center rounded-xl">
              <div
                className="w-56 h-72 bg-transparent shadow-md rounded-md dark:shadow-gray-600 text-center   flex flex-col justify-center items-center cursor-pointer"
                onClick={() => imagePickerRef.current.click()}
              >
                {selectedImage ? (
                  <div className="relative w-full h-full">
                    <CameraIcon
                      className="text-gray-300 hover:text-white align-middle w-12 h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ transform: "translate(-50%, -50%)" }}
                    />
                    <Image
                      src={selectedImage}
                      alt="selected"
                      priority
                      width={1001}
                      height={1001}
                      className="w-full h-full object-cover rounded-md "
                    />
                  </div>
                ) : (
                  <CameraIcon className="text-black dark:text-white w-12 h-12" />
                )}
                <input
                  type="file"
                  ref={imagePickerRef}
                  className="hidden"
                  onChange={(e) => onPickImage(e)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap w-full h-full p-5  align-top sm:space-x-7  justify-start rounded-xl text-black dark:text-white ">
            <div className="flex flex-col align-top">
              <span className=" font-bold">
                <span className="text-sm font-medium">Mobile No. :</span>{" "}
                {user.mobileno}
              </span>
              <span className=" font-bold">
                <span className="text-sm font-medium">Email :</span>{" "}
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <span className=" font-bold text-lg text-black dark:text-white">
          Personal Details
        </span>
        <div className="flex flex-col space-y-3 md:space-x-28 md:space-y-0 md:flex-row  ">
          <div className="flex flex-col text-black dark:text-white space-y-2">
            <Label>
              <span>First Name</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.firstname}
                placeholder={user.firstname}
                name="firstname"
                required
              />
            </Label>
            <Label>
              <span>Middle Name</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.middlename}
                placeholder={user.middlename}
                name="middlename"
              />
            </Label>
            <Label>
              <span>Last Name</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.lastname}
                placeholder={user.lastname}
                name="lastname"
                required
              />
            </Label>
            <Label>
              <span>Date of Birth</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="date"
                defaultValue={moment(user.dateofbirth).format("YYYY-MM-DD")}
                placeholder={moment(user.dateofbirth).format("DD-MMM-YYYY")}
                name="dateofbirth"
                required
              />
            </Label>
            <Label>
              <span>Blood Group</span>
              <Select
                className="mt-1"
                name="bloodType"
                defaultValue={user.bloodType}
              >
                {bloodGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </Select>
            </Label>
            <Label>
              <span>Gender</span>
              <Select className="mt-1" name="gender">
                {gender.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </Select>
            </Label>
          </div>
          <div className="flex flex-col text-black dark:text-white space-y-2">
            <Label>
              <span>Aadhaar No</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.aadharno}
                placeholder={user.aadharno}
                name="aadharno"
                maxLength={12}
                required
                pattern="^\d{4}\s?\d{4}\s?\d{4}$"
                title="Please enter the Aadhaar number in the format XXXX XXXX XXXX"
              />
            </Label>
            <Label>
              <span>Pan No</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.panno}
                placeholder={user.panno}
                name="panno"
                pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
                title="Please enter the PAN number in the format AAAAA9999A"
                maxLength={10}
              />
            </Label>
            <Label>
              <span>Permanent Address</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.permanentAddress}
                placeholder={user.permanentAddress}
                value={userData.permanentAddress}
                onChange={(e) => {
                  setUserData((prev) => {
                    if (sameResident) {
                      prev.currentAddress = e.target.value;
                    }
                    return {
                      ...prev,
                      permanentAddress: e.target.value,
                    };
                  });
                }}
                name="permanentAddress"
                required
              />
            </Label>
            <Label>
              <span>Residential Address</span>
              <Input
                className="mt-1 focus:border-0 mb-1  focus-within:border-0"
                type="text"
                defaultValue={userData.currentAddress}
                placeholder={user.currentAddress}
                value={userData.currentAddress}
                name="currentAddress"
                onChange={(e) => {
                  setUserData((prev) => {
                    if (sameResident) {
                      prev.permanentAddress = e.target.value;
                    }
                    return {
                      ...prev,
                      currentAddress: e.target.value,
                    };
                  });
                }}
                required
              />
              <span>
                <Input
                  type="checkbox"
                  className={`mr-2 ${
                    sameResident ? "dark:bg-primary" : "dark:bg-gray-700"
                  }`}
                  checked={sameResident}
                  onChange={() => {
                    setUserData((prev) => ({
                      ...prev,
                      currentAddress: userData.permanentAddress,
                    }));
                    setSameResident(!sameResident);
                  }}
                />
                Same as Permanent Address
              </span>
            </Label>
          </div>
        </div>
        <div className="flex flex-col-reverse mt-5 space-y-6 md:space-x-28 md:space-y-0 md:flex-row  ">
          <div className="flex flex-col my-5 md:my-0 text-black dark:text-white space-y-2">
            <span className=" font-bold text-lg">Emergency Contacts</span>
            {user.emergencyDetails.map((element, index) => (
              <div key={index}>
                <div className="border-t border-gray-300 dark:border-gray-600 my-2 w-full" />
                <p className="font-semibold text-sm text-gray-500 dark:text-white mb-2">
                  Person {index + 1}
                </p>
                <div className="space-y-1">
                  <Label>
                    <span>Name</span>
                    <Input
                      className="mt-1 focus:border-0  focus-within:border-0"
                      type="text"
                      defaultValue={element.name}
                      placeholder={element.name}
                      name={`EmergencyDetails-${index}-name`}
                      required
                    />
                  </Label>
                  <Label>
                    <span>Relation</span>
                    <Select
                      className="mt-1"
                      name={`EmergencyDetails-${index}-relation`}
                      value={element.relation}
                      onChange={(e) => {
                        const updatedEmergencyDetails = [
                          ...user.emergencyDetails,
                        ];
                        updatedEmergencyDetails[index].relation =
                          e.target.value;
                        setUserData({
                          ...user,
                          emergencyDetails: updatedEmergencyDetails,
                        });
                      }}
                    >
                      {relations.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </Select>
                    {element.relation == "Other" && (
                      <Input
                        className="mt-[10px] focus:border-0  focus-within:border-0"
                        type="text"
                        defaultValue={element.others}
                        placeholder="relation"
                        name={`EmergencyDetails-${index}-others`}
                        required
                        title="Phone number should be in the format: +91 1234567890"
                      />
                    )}
                  </Label>
                  <Label>
                    <span>Mobile No.</span>
                    <Input
                      className="mt-1 focus:border-0  focus-within:border-0"
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      defaultValue={element.phoneNumber}
                      placeholder={element.phoneNumber}
                      name={`EmergencyDetails-${index}-phoneNumber`}
                      required
                    />
                  </Label>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col text-black dark:text-white space-y-2">
            <span className=" font-bold text-lg">Medical Details</span>
            <div className="border-t border-gray-300 dark:border-gray-600 my-2 w-full" />
            <Label>
              <span>Medical History</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.medicalhistory}
                placeholder={user.medicalhistory}
                name="medicalhistory"
              />
            </Label>
            <Label>
              <span>Allergy to any Medicine</span>
              <Input
                className="mt-1 focus:border-0  focus-within:border-0"
                type="text"
                defaultValue={userData.allergydetails}
                placeholder={user.allergydetails}
                name="allergydetails"
              />
            </Label>
          </div>
        </div>
        <button
          className="bg-primary  block md:hidden    font-semibold h-fit py-2 w-full text-white rounded-lg"
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
      {isUpdateModelOpen && (
        <OTPPopUp
          isModalOpen={isUpdateModelOpen}
          userData={userData}
          popUpHeader={"Send OTP"}
          phoneNumber={user.mobileno}
          ShowUpdateModel={ShowUpdateModel}
        />
      )}
    </div>
  );
}

export default UserDetailsEditForm;
