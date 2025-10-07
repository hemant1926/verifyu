'use client'
import React, { useState  , useRef, useEffect} from 'react'
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
    // State to store the step configuration
    const [threshold_steps, setThresholdSteps] = useState({});
    const [coins_per_threshold, setCoinsPerThreshold] = useState({});
    const [max_coins_per_day, setMaxCoinsPerDay] = useState({});
    const [coin_value_in_rupees, setCoinValueInRupees] = useState({});
    const [coin_value_in_usd, setCoinValueInUsd] = useState({});
    const [reset_policy, setResetPolicy] = useState({});

    useEffect(() => {
        const fetchStepConfiguration = async () => {
            const res = await axios.get('/api/mobile/steps/config');
            setThresholdSteps(res.data.data.threshold_steps);
            setCoinsPerThreshold(res.data.data.coins_per_threshold);
            setMaxCoinsPerDay(res.data.data.max_coins_per_day);
            setCoinValueInRupees(res.data.data.coin_value_in_rupees);
            setCoinValueInUsd(res.data.data.coin_value_in_usd);
            setResetPolicy(res.data.data.reset_policy);
        }
        fetchStepConfiguration();
    }, []);

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

            const res = await axios.put('/api/mobile/steps/config', {
                threshold_steps: parseInt(formData.threshold_steps),
                coins_per_threshold: parseInt(formData.coins_per_threshold),
                max_coins_per_day: parseInt(formData.max_coins_per_day),
                coin_value_in_rupees: parseInt(formData.coin_value_in_rupees),
                coin_value_in_usd: parseInt(formData.coin_value_in_usd || 0),
                reset_policy: formData.reset_policy
            },
                {
                    headers: {
                        "x-access-token": Cookies.get("token"),
                    },
                }
            )

            if (res.data.success) {
                // Show success message if password is updated successfully
                toast.success("Step Configuration Updated successfully")
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

                <p className=" font-bold text-lg my-3 text-black dark:text-white">Step Configuration</p>

            </div>
            <form onSubmit={onSubmit} ref={ref}>

                <div className='flex flex-col text-black dark:text-white space-y-2'>
                    <Label>
                        <span>
                            Threshold Steps
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type="number"
                                name="threshold_steps"
                                value={threshold_steps}
                                onChange={e => setThresholdSteps(e.target.value)}
                                required
                            />
                        </div>
                    </Label>
                    <Label>
                        <span>
                            Coins per Threshold
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type="number"
                                name="coins_per_threshold"
                                value={coins_per_threshold}
                                onChange={e => setCoinsPerThreshold(e.target.value)}
                                required
                            />
                        </div>
                    </Label>
                    <Label>
                        <span>
                            Max Coins per Day
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type="number"
                                name="max_coins_per_day"
                                value={max_coins_per_day}
                                onChange={e => setMaxCoinsPerDay(e.target.value)}
                                required
                            />
                        </div>
                    </Label>

                    <Label>
                        <span>
                            Reset Policy
                        </span>

                        <div className="relative">
                            <select
                                className="my-1 focus:border-0  focus-within:border-0"
                                type="number"
                                name="reset_policy"
                                defaultValue={'continuous'}
                                onChange={e => setResetPolicy(e.target.value)}
                                required
                            >
                                <option value="">Choose Option</option>
                                <option value="daily" selected={reset_policy === "daily"}>Daily</option>
                                <option value="continuous" selected={reset_policy === "continuous"}>Continuous</option>
                            </select>
                        </div>
                    </Label>
                    
                    <Label>
                        <span>
                            Coin Value in INR
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type="number"
                                name="coin_value_in_rupees"
                                value={coin_value_in_rupees}
                                onChange={e => setCoinValueInRupees(e.target.value)}
                                required
                            />
                        </div>
                    </Label>
                    <Label>
                        <span>
                            Coin Value in USD
                        </span>

                        <div className="relative">
                            <Input
                                className="my-1 focus:border-0  focus-within:border-0"
                                type="number"
                                name="coin_value_in_usd"
                                value={coin_value_in_usd}
                                onChange={e => setCoinValueInUsd(e.target.value)}
                                required
                            />
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