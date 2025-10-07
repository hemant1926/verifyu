"use client";
import React, { useContext } from "react";
import SidebarContext from "@/context/SidebarContext";
import { MoonIcon, SunIcon, MenuIcon,  } from "@/assets/icons";
import { WindmillContext } from "@roketid/windmill-react-ui";
import { useAuth } from "@/context/authContext";
import { UserCircleIcon } from '@heroicons/react/24/outline';


function Header() {
  const { mode, toggleMode } = useContext(WindmillContext);
  const { toggleSidebar } = useContext(SidebarContext);
  const { userDetails } = useAuth();
  return (
    <header className="z-40 py-4 bg-white shadow-bottom dark:bg-gray-800">
      <div className="container flex items-center justify-between h-full px-6 mx-auto text-purple-600 dark:text-purple-300">
        {/* <!-- Mobile hamburger --> */}
        <button
          className="p-1 mr-5 -ml-1 rounded-md lg:hidden focus:outline-none focus:shadow-outline-purple"
          onClick={toggleSidebar}
          aria-label="Menu"
        >
          <MenuIcon className="w-6 h-6" aria-hidden="true" />
        </button>
        {/* <!-- Search input --> */}
        <div className="flex justify-center flex-1 lg:mr-32" />

        <ul className="flex items-center flex-shrink-0 space-x-6">
          {/* <!-- Theme toggler --> */}
          <li className=" hidden sm:block text-xs font-semibold">
            <div className="flex-row flex text-center align-middle justify-center space-x-2">

              <UserCircleIcon className="w-6 h-6" alt="Logo" />
              <span className="my-auto">

                 {userDetails ? userDetails.name : ""}
              </span>
            </div>
          </li>
          <li className="flex">
            <button
              className="rounded-md focus:outline-none focus:shadow-outline-purple"
              onClick={() => {
                toggleMode();
              }}
              aria-label="Toggle color mode"
            >
              {mode === "dark" ? (
                <SunIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <MoonIcon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}

export default Header;
