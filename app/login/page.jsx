"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { loginImage } from "@/assets/img/index";

import { Label, Input, Button } from "@roketid/windmill-react-ui";
import { useAuth } from "@/context/authContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const router = new useRouter();
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setShowLoader(true);
      toast.dismiss();
      const userName = e.target.elements.userId.value;
      const password = e.target.elements.password.value;
      const response = await axios.get("/api/admin/auth", {
        params: {
          userName,
          password,
        },
      });
      if (response.data.success) {
        const userDetails = { ...response.data.data };
        Cookies.set("userId", userDetails.id);
        Cookies.set("token", userDetails.token);
        login(userDetails);
        toast.success(response.data.message);
        router.push("/dashboard");
      } else {
        toast.error(response.data.message);
        setShowLoader(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during login");
      setShowLoader(false);
    }
  };

  return (
    <div className="flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl shadow-gray-600 dark:bg-gray-800">
        <div className="flex flex-col overflow-y-auto md:flex-row">
          <div className="relative h-32  max-h-[400px] md:h-auto md:w-1/2">
            <Image
              aria-hidden="true"
              className="w-full h-full object-cover"
              src={loginImage}
              alt="Office"
              priority
            />
          </div>
          <main className="flex items-center justify-center p-6 sm:p-12 md:w-1/2">
            <div className="w-full">
              <h1 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
                Login
              </h1>
              <form onSubmit={handleLogin}>
                <Label>
                  <span>UserId</span>
                  <Input
                    className="mt-1 focus:border-0  focus-within:border-0"
                    type="text"
                    placeholder="emp124 or admin123"
                    name="userId"
                    required
                  />
                </Label>

                <Label className="mt-4">
                  <span>Password</span>
                  <div className="relative">
                    <Input
                      className="my-1 focus:border-0  focus-within:border-0"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      placeholder="***************"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </Label>
                <Button
                  block
                  className="mt-4"
                  type="submit"
                  disabled={showLoader}
                >
                  {showLoader ? (
                    <span className="loading loading-dots loading-lg h-8 dark:text-white text-black"></span>
                  ) : (
                    <span className="m-2"> {"Log in"} </span>
                  )}
                </Button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
