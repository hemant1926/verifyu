'use client'
import React, { useState } from 'react'
import PropTypes from "prop-types"
import {
    Label,
    Input,
} from "@roketid/windmill-react-ui";
import { toast } from 'react-toastify'
import axios from 'axios';
import { useRouter } from 'next/navigation'
import { AiFillEyeInvisible, AiFillEye } from 'react-icons/ai'
NewAdminForm.propTypes = {
    employee: PropTypes.any.isRequired,
};



function NewAdminForm() {
    const [userData, setUserData] = useState({});
    const [showLoader, setShowLoader] = useState(false);
    const route = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [showComPassword, setShowComPassword] = useState(false);




    const onSubmit = async (e) => {
        e.preventDefault()
        try {
            setShowLoader(true)
            let formData = Object.fromEntries(
                Array.from(new FormData(e.currentTarget))
            );
            // Check the confirm password
            if (formData.password != formData.confirmPassword) {
                toast.error('Confirm password did not match');
                setShowLoader(false)
                return;
            }

            formData = {
                "name": formData.name,
                "mobileno": "91" + formData.mobileno,
                "email": formData.email,
                "userName": formData.userName,
                "password": formData.password,
                "role": 1
            }
            setUserData(
                formData

            )

            const res = await axios.post('/api/admin/auth', formData, {

            })
            if (res.data.success) {
                route.push('/dashboard/employee');
                toast.success("Employee details updated successfully")
                setShowLoader(false)
                return;
            }

            toast.error("Something went wrong")
            setShowLoader(false)


        } catch (error) {
            console.error(error);
            toast.error("Something went wrong")
            setShowLoader(false)

        }
    }



    return (
        <div className="flex flex-col w-full  mb-5">
            <form onSubmit={onSubmit}>
                <div className="flex flex-row w-full justify-between">

                    <p className=" font-bold text-lg my-3 text-black dark:text-white">Employee Details</p>
                    <button
                        type="submit"
                        size="small"
                        className="bg-primary  rounded-lg font-semibold text-white h-fit py-2 my-auto hidden md:block w-1/6 "
                        disabled={showLoader}
                    >
                        {showLoader ? (
                            <span className="loading loading-dots loading-md h-5 text-white"></span>
                        ) : (
                            <span className="m-2"> Submit </span>
                        )}
                    </button>
                </div>




                <div className='flex flex-col space-y-3 mt-2 md:space-x-28 md:space-y-0 md:flex-row  '>
                    <div className='flex flex-col text-black dark:text-white space-y-2'>
                        <Label>
                            <span>
                                User Name
                            </span>
                            <Input
                                className="mt-1 focus:border-0  focus-within:border-0"
                                type="text"
                                defaultValue={userData.userName}
                                placeholder={"User Name"}
                                name="userName"
                                required

                            />
                        </Label>
                        <Label>
                            <span>
                                Name
                            </span>
                            <Input
                                className="mt-1 focus:border-0  focus-within:border-0"
                                type="text"
                                defaultValue={userData.name}
                                placeholder={"Name"}
                                name="name"
                                required

                            />
                        </Label>
                        <Label>
                            <span>
                                Mobile No.
                            </span>
                            <Input
                                className="mt-1 focus:border-0  focus-within:border-0"
                                type="text"
                                maxLength={10}
                                pattern="\d{10}"
                                defaultValue={userData.mobileno}
                                placeholder={"Mobile No"}
                                name="mobileno"
                                title='10 digit mobile number'
                                required

                            />
                        </Label>
                        <Label>
                            <span>
                                Email Id
                            </span>
                            <Input
                                className="mt-1 focus:border-0  focus-within:border-0"
                                type="email"
                                defaultValue={userData.email}
                                placeholder={"Email"}
                                name="email"
                                required

                            />
                        </Label>

                        <Label className="relative">
                            <span>
                                Password
                            </span>
                            <Input
                                className="mt-1 focus:border-0  focus-within:border-0"
                                type={showPassword ? "text" : "password"}
                                placeholder={"**********"}
                                name="password"
                                required
                                title='Password must contain at least 4 characters'

                                pattern=".{4,}"

                            />
                            <button
                                type="button"
                                className="absolute w-10 text-lg  text-center right-0  top-9 items-center"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <AiFillEyeInvisible className="items-center m-auto text-black" /> : <AiFillEye className="items-center  m-auto text-black" />}
                            </button>

                        </Label>
                        <Label className="relative">

                            <span>
                                Confirm Password
                            </span>
                            <Input
                                className="mt-1 focus:border-0  focus-within:border-0"
                                type={showComPassword ? "text" : "password"}
                                placeholder={"**********"}
                                name="confirmPassword"
                                required
                                title='Password must contain at least 4 characters'
                                pattern=".{4,}"

                            />
                            <button
                                type="button"
                                className="absolute w-10 text-lg  text-center right-0  top-9 items-center"
                                onClick={() => setShowComPassword((prev) => !prev)}
                            >
                                {showComPassword ? <AiFillEyeInvisible className="items-center m-auto text-black" /> : <AiFillEye className="items-center  m-auto text-black" />}
                            </button>
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


        </div>
    )
}

export default NewAdminForm