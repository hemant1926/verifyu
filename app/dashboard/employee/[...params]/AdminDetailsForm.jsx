'use client'
import React from 'react'
import PropTypes from "prop-types"
import {

    Badge,
    Input,
    Label,
} from '@roketid/windmill-react-ui'
import moment from 'moment';
AdminDetailsForm.propTypes = {
    employee: PropTypes.any.isRequired,
};


function AdminDetailsForm({ employee }) {


    if (employee == null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h2 className="text-2xl font-semibold">User Not Found</h2>
            </div>
        )
    }
    return (

        <div className="flex flex-col w-full  mb-5" >


            <div className='flex flex-col space-y-1  sm:flex-row  sm:space-y-0 sm:space-x-2'>

                <div className="text-sm font-semibold">Create on : <span className="font-medium text-lg ml-1">
                    {moment(employee.createddate).format("DD-MM-YYYY")} </span></div>
                <div className="text-sm font-semibold">Updated on : <span className="font-medium text-lg ml-1 ">{moment(employee.updatedAt).format("DD-MM-YYYY")}</span></div>
            </div>

            <div className='flex flex-col space-y-3 mt-2 md:space-x-5  w-full md:space-y-0 md:flex-row  '>
                <div className='flex flex-col text-black w-full md:w-1/3 dark:text-white space-y-2'>
                    <Label>
                        <span>
                            User Name

                        </span>
                        <Input
                            className="mt-1 focus:border-0  disabled:opacity-100  disabled:bg-white focus-within:border-0"
                            type="text"
                            defaultValue={employee.userName}
                            placeholder={employee.userName}
                            name="userName"
                            disabled
                            required

                        />
                    </Label>
                    <Label>
                        <span>
                            Name


                        </span>
                        <Input
                            className="mt-1 focus:border-0  disabled:opacity-100  disabled:bg-white  focus-within:border-0"
                            type="text"
                            defaultValue={employee.name}
                            placeholder={employee.name}
                            disabled

                            name="name"
                            required

                        />
                    </Label>
                    <Label>
                        <span>
                            Mobile No.
                        </span>
                        <Input
                            className="mt-1 focus:border-0  disabled:opacity-100  disabled:bg-white focus-within:border-0"
                            type="text"
                            defaultValue={employee.mobileno}

                            placeholder={employee.mobileno}
                            disabled

                            name="mobileno"
                            required

                        />
                    </Label>



                </div>
                <div className='flex flex-col text-black w-full md:w-1/3 dark:text-white space-y-2'>

                    <Label>
                        <span>
                            Email Id


                        </span>
                        {/* <span className="font-medium text-lg ml-1 ">{employee.name}</span> */}
                        <Input
                            className="mt-1 focus:border-0  disabled:opacity-100  disabled:bg-white   focus-within:border-0"
                            type="email"
                            value={employee.email}
                            placeholder={employee.email}
                            name="email"
                            disabled
                            required

                        />
                    </Label>
                    <Label>
                        <div>
                            Status
                        </div>
                        <Badge type={employee.status == 1 ? "success" : "danger"} className='my-2' >
                            <span className='font-medium  text-lg'>
                                {employee.status == 1 ? "Active" : "Inactive"}
                            </span>
                        </Badge>
                    </Label>



                </div>


            </div>


        </div >


    )
}



export default AdminDetailsForm