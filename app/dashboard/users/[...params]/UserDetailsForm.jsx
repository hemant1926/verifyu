"use client";
import moment from "moment";
// import Image from 'next/image'
import React from "react";
import PropTypes from "prop-types";
import ImageViewer from "awesome-image-viewer";
import { useRouter } from "next/navigation";
import Image from "next/image";

UserDetailsForm.propTypes = {
  user: PropTypes.any.isRequired,
};

function UserDetailsForm({ user }) {
  const route = useRouter();

  const onPressImageView = () => {
    new ImageViewer({
      images: [{ mainUrl: user.photo }],
    });
  };

  if (user == null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-semibold">User Not Found</h2>
      </div>
    );
  }
  return (
    <div className="flex flex-col w-full  mb-5">
      <div className="flex flex-row  h-fit justify-between my-3 align-middle">
        <p className=" text-2xl text-gray-900 my-2 dark:text-white">
        {`${user.firstname} ${user.middlename} ${user.lastname}`} Profile
        </p>
        <div className="flex space-x-2">
          <button
            type="button"
            size="small"
            className="bg-primary  rounded-lg font-semibold text-white h-fit py-2 my-auto hidden md:block  w-36 "
            onClick={() => route.back()}
          >
            <span className="m-2"> Back </span>
          </button>
        </div>
      </div>
      <div className="flex flex-col md:h-fit  mb-8 w-full space-y-5 md:space-y-0 md:space-x-10 justify-self-center align-top md:flex-row  md:justify-start">
        <Image
          onClick={() => onPressImageView()}
          src={user.photo}
          alt={"profile"}
          loading="eager"
          width={4000}
          height={4000}
          className="w-56 h-full object-cover mx-auto md:mx-0 rounded-xl"
        />
        <div className="flex flex-wrap w-full h-full p-5  align-top sm:space-x-7  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <div className="flex flex-col align-top">
            <span className=" font-bold">
              <span className="text-sm font-medium">Name :</span>{" "}
              {`${user.firstname} ${user.middlename} ${user.lastname}`}
            </span>
            <span className=" font-bold">
              <span className="text-sm font-medium">Mobile No. :</span>{" "}
              {user.mobileno}
            </span>
            <span className=" font-bold">
              <span className="text-sm font-medium">Email :</span> {user.email}
            </span>
            <div className="h-3 w-5 " />
            <span className=" font-bold text-lg">KYC Details</span>
            <div className="flex flex-row gap-4">
              <span className="text-sm font-semibold">
                {" "}
                <p className=" font-medium">Aadhaar No</p> {user.aadharno}
              </span>
              <span className="text-sm font-semibold">
                {" "}
                <p className=" font-medium">Pan No</p> {user.panno}
              </span>
            </div>
          </div>
          <div className="flex flex-col align-top">
            <span className=" font-bold text-lg">Personal Details</span>
            <span className="text-[12px] font-normal">
              Date of Birth{" "}
              <p className="font-medium text-sm">
                {" "}
                {moment(user.dateofbirth).format("DD-MMM-YYYY")}
              </p>
            </span>
            <span className="text-[12px] font-normal">
              Blood Group{" "}
              <p className="font-medium text-sm"> {user.bloodType}</p>
            </span>
            <span className="text-[12px] font-normal">
              Permanent Address{" "}
              <p className="font-medium text-sm"> {user.permanentAddress}</p>
            </span>
            <span className="text-[12px] font-normal">
              Residential Address{" "}
              <p className="font-medium text-sm"> {user.currentAddress}</p>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center  sm:justify-start    w-full ">
        <div className="flex flex-col w-full md:w-fit h-fit p-5  align-top  justify-start rounded-xl m-2   text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Emergency Contacts</span>
          {user.emergencyDetails.map((element, index) => (
            <div key={index}>
              <div className="border-t border-gray-300 dark:border-gray-600 my-2 w-full" />
              <p className="font-semibold text-sm text-gray-500 dark:text-white mb-2 mt-1">
                Person {index + 1}
              </p>
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  Name : <p className="font-medium ">{element.name}</p>
                </div>
                <div className="text-sm font-semibold">
                  Relation :{" "}
                  <p className="font-medium ">{`${element.relation} ${
                    element.relation == "Other" ? ` : ${element.others}` : ""
                  }`}</p>
                </div>
                <div className="text-sm font-semibold">
                  Mobile No. :{" "}
                  <p className="font-medium ">{element.phoneNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* <div className='flex flex-wrap space-x-0 xl:space-x-2 w-full md:w-fit xl:space-y-0 space-y-2'> */}

        <div className="flex flex-col w-full    md:max-w-sm md:w-fit h-fit p-5 m-2 align-top  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Medical History</span>
          <div className="text-sm font-semibold">{user.medicalhistory}</div>
        </div>
        <div className="flex flex-col w-full  md:max-w-sm md:w-fit h-fit p-5  align-top m-2  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Allergy to any Medicine</span>
          <div className="text-sm font-semibold">{user.allergydetails}</div>
        </div>
        <div className="flex flex-col w-full  md:max-w-sm md:w-fit h-fit p-5  align-top m-2  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Steps Details</span>
          <div className="text-sm font-semibold">Total Steps : {user.userSteps?.total_steps}</div>
          <div className="text-sm font-semibold">Current Steps : {user.userSteps?.current_steps}</div>
          <div className="text-sm font-semibold">Total Coins Earned : {user.userSteps?.total_coins}</div>
          <div className="text-sm font-semibold">Last Threshold : {user.userSteps?.last_threshold}</div>
          <div className="text-sm font-semibold">Total Money Earned ({(user.mobileno.includes("91") ? "₹" : "$")}) : {user.userSteps?.total_coins * (user.mobileno.includes("91") ? user.stepConfig?.coin_value_in_rupees : user.stepConfig?.coin_value_in_usd)}</div>
          <div className="text-sm font-semibold">Created Date : {user.userSteps?.createddate}</div>
          <div className="text-sm font-semibold">Updated Date : {user.userSteps?.updatedAt}</div>
        </div>



        {/* </div> */}
      </div>
          {user.childDetails && user.childDetails.map((element,index)=>(
  <div className="flex flex-wrap justify-center  sm:justify-start    w-full ">

        <div className="flex flex-col w-full  md:max-w-sm md:w-fit h-fit p-5  align-top m-2  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Child {index+1}</span>
            <div  >
             <div className="flex text-sm font-semibold">
              Name : <p className="font-medium ml-2 "> {element.firstname} {element.middlename} {element.lastname}</p>
              </div>
             
              <div className="flex text-sm font-semibold">
              Gender : <p className="font-medium ml-2"> {element.gender}</p>
              </div>
              <div className="flex text-sm font-semibold">
              Aadhar No : <p className="font-medium ml-2"> {element.aadharno}</p>
              </div>
              <div className="flex text-sm font-semibold">
              DOB : <p className="font-medium ml-2"> {element.dateofbirth}</p>
              </div>
              <div className="text-sm font-semibold">
              Photo : <img src={element.photo} alt="" height={100} width={100}/>
              </div>

            </div> 
        </div>

        <div className="flex flex-col w-full    md:max-w-sm md:w-fit h-fit p-5 m-2 align-top  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Medical History</span>
          <div className="text-sm font-semibold">{element.medicalhistory}</div>
        </div>
        <div className="flex flex-col w-full  md:max-w-sm md:w-fit h-fit p-5  align-top m-2  justify-start rounded-xl text-black dark:text-white bg-white dark:bg-gray-800">
          <span className=" font-bold text-lg">Allergy to any Medicine</span>
          <div className="text-sm font-semibold">{element.allergydetails}</div>
        </div>


        </div>

        
          ))}
    </div>
  );
}

export default UserDetailsForm;
