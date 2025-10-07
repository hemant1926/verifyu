"use client";
import Link from "next/link";
import React from "react";
import * as Icons from "@/assets/icons";
import { Button } from "@roketid/windmill-react-ui";
import { usePathname, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import { IoIosLogOut } from "react-icons/io";
import Cookies from "js-cookie";
import { useAuth } from "@/context/authContext";
Icon.propTypes = {
  icon: PropTypes.any.isRequired,
};
SidebarContent.propTypes = {
  linkClicked: PropTypes.any.isRequired,
};

/**
 * Renders an icon component based on the provided icon name.
 *
 * @param {Object} props - The component props.
 * @param {string} props.icon - The name of the icon to render.
 * @param {Object} props.rest - Additional props to pass to the icon component.
 * @return {ReactElement} The rendered icon component.
 */
function Icon({ icon, ...props }) {
  // Get the icon component from the Icons module based on the provided icon name
  // @ts-ignore
  const IconComponent = Icons[icon];

  // Render the icon component with the provided props
  return <IconComponent {...props} />;
}

/**
 * Renders the sidebar content component.
 *
 * @param {Object} props - The component props.
 * @param {function} props.linkClicked - The function to call when a link is clicked.
 * @return {ReactElement} The rendered sidebar content component.
 */

function SidebarContent({ linkClicked }) {
  const { userDetails } = useAuth();
  const pathname = usePathname();
  const appName = "Verifyu";
  const route = useRouter();
  /**
   * Removes user-related cookies and redirects to the login page.
   */
  const logout = () => {
    // Remove cookies related to user authentication
    Cookies.remove("userId");
    Cookies.remove("token");
    Cookies.remove("data");

    // Redirect to the login page
    route.replace("/login");
  };
  return (
    <div className="text-gray-500 dark:text-gray-400 lg:h-screen  flex flex-col">
      <Link href="/#" passHref>
        <div className="ml-6 py-6">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {appName}
          </p>
          <p className=" block sm:hidden text-xs font-semibold">
            Welcome {userDetails ? userDetails.name : ""}
          </p>
        </div>
      </Link>

      <ul className="lg:flex-grow flex-col flex">
        {routes.map((route, index) => {
          return route.checkRoute <= userDetails?.role ? (
            <li className="relative px-6 py-3 " key={index}>
              <Link href={route.path || "#"} scroll={false}>
                <p
                  className={`inline-flex items-center w-full text-xs font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 ${
                    routeIsActive(pathname, route)
                      ? "dark:text-gray-100 text-gray-800"
                      : ""
                  }`}
                  onClick={linkClicked}
                >
                  {routeIsActive(pathname, route) && (
                    <span
                      className="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg"
                      aria-hidden="true"
                    ></span>
                  )}

                  <Icon
                    className="w-5 h-5"
                    aria-hidden="true"
                    icon={route.icon || ""}
                  />
                  <span className="ml-4">{route.name}</span>
                </p>
              </Link>
            </li>
          ) : (
            <span key={index}></span>
          );
        })}
      </ul>
      <ul>
        <li className="relative px-6 py-3" key={"logout"}>
          <Button
            onClick={logout}
            block
            size="regular"
            className="inline-flex items-center w-full bg-red-500  rounded-lg text-white text-sm font-semibold transition-colors duration-150  dark:hover:text-gray-200"
          >
            <IoIosLogOut className="w-5 h-5" />
            <span className="ml-4">Logout</span>
          </Button>
        </li>
      </ul>
    </div>
  );
}

export default SidebarContent;

export function routeIsActive(pathname, route) {
  if (route.checkActive) {
    return route.checkActive(pathname, route);
  }

  return route?.exact
    ? pathname == route?.path
    : route?.path
    ? pathname.indexOf(route.path) === 0
    : false;
}

const routes = [
  {
    path: "/dashboard", // the url
    icon: "HomeIcon", // the component being exported from icons/index.js
    name: "Dashboard", // name that appear in Sidebar
    exact: true,
    checkRoute: 1,
  },
  {
    path: "/dashboard/users", // the url
    icon: "PeopleIcon", // the component being exported from icons/index.js
    name: "Users", // name that appear in Sidebar
    exact: true,
    checkRoute: 1,
  },
  {
    path: "/dashboard/employee", // the url
    icon: "EmployeeIcon", // the component being exported from icons/index.js
    name: "Employee", // name that appear in Sidebar
    exact: true,
    checkRoute: 2,
  },
  {
    path: "/dashboard/settings", // the url
    icon: "SettingsIcon", // the component being exported from icons/index.js
    name: "Settings", // name that appear in Sidebar
    exact: true,
    checkRoute: 2,
  },
  {
    path: "/dashboard/stepconfig", // the url
    icon: "SettingsIcon", // the component being exported from icons/index.js
    name: "Step Configuration", // name that appear in Sidebar
    exact: true,
    checkRoute: 2,
  },
];
