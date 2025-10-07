'use client'
import React, { useState  , useRef} from 'react'
import {
    Label,
    Input,
} from "@roketid/windmill-react-ui";
import { toast } from 'react-toastify'
import axios from 'axios';
import Cookies from 'js-cookie';
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";

function Settings() {
    // Ref to the form element for resetting it
    const ref = useRef(null)
    // State to toggle the loader
    const [showLoader, setShowLoader] = useState(false)
    // State for storing the old password
    const [oldPassword, setOldPassword] = useState('');
    // State for storing the new password
    const [password, setPassword] = useState('');
    // State for storing the confirm password
    const [confirmPassword, setConfirmPassword] = useState('');

    /**
     * Submits the form data for updating the admin's password.
     *
     * @param {Event} e - The form submit event.
     * @return {Promise<void>} A promise that resolves when the password is successfully updated.
     * @throws {Error} If there is an error during the update process.
     */
    const onSubmit = async (e) => {
        e.preventDefault()
        try {
            setShowLoader(true)
            // Extract the form data
            const formData = Object.fromEntries(
                Array.from(new FormData(e.currentTarget))
            );
            // Check the confirm password
            if (formData.password !== formData.confirmPassword) {
                // Show error message if passwords do not match
                toast.error('Confirm password did not match');
                setShowLoader(false)
                return;
            }

            if (formData.oldPassword === formData.password) {
                // Show error message if new password is the same as old password
                toast.error('New password cannot be the same as old password');
                setShowLoader(false);
                return;
            }

            const res = await axios.put('/api/admin/auth', {
                oldPassword: formData.oldPassword,
                password: formData.password
            },
                {
                    headers: {
                        "x-access-token": Cookies.get("token"),
                    },
                }
            )

            if (res.data.success) {
                // Show success message if password is updated successfully
                toast.success("Password Updated successfully")
                setShowLoader(false)
                ref.current?.reset()
                return;
            }

            // Show error message if there is an error during the update process
            toast.error(res.data.message)
            setShowLoader(false)


        } catch (error) {
            // Log the error and show error message if there is an exception
            console.error(error);
            toast.error("Something went wrong")
            setShowLoader(false)

        }
    }


    return (
        <div className="flex flex-col w-full md:w-1/2  mb-5">
            <div className="flex flex-row w-ful  my-4 justify-between">

                <p className=" font-bold text-lg my-3 text-black dark:text-white">Settings</p>

            </div>
            <form onSubmit={onSubmit} ref={ref}>

                <div className='flex flex-col text-black dark:text-white space-y-2'>
                    <Label>
                        <span>
                            Current Password
                        </span>

                    </Label>
                    <div className="relative">
                        <Input
                            className="my-1 focus:border-0  focus-within:border-0"
                            type={oldPassword ? "text" : "password"}
                            name="oldPassword"
                            required
                            placeholder="***************"
                        />
                        <button
                            type="button"
                            onClick={() => setOldPassword(!oldPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        >
                            {oldPassword ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-gray-500" />
                            )}
                        </button>
                    </div>
                    <Label>
                        <span>
                            New Password
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type={password ? "text" : "password"}
                                name="password"
                                required
                                placeholder="***************"
                            />
                            <button
                                type="button"
                                onClick={() => setPassword(!password)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                            >
                                {password ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                        </div>
                    </Label>
                    <Label>
                        <span>
                            Confirm Password
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type={confirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                placeholder="***************"
                            />
                            <button
                                type="button"
                                onClick={() => setConfirmPassword(!confirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                            >
                                {confirmPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <EyeIcon className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                        </div>
                    </Label>

                </div>

                <button
                    className="bg-primary block my-4  font-semibold h-fit py-2 w-full text-white rounded-lg"
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
            </form >


        </div >
    )
}

export default Settings