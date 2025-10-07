"use client";
import React, { useContext, useRef } from "react";
import { Transition, Backdrop } from "@roketid/windmill-react-ui";
import SidebarContext from "@/context/SidebarContext";
import SidebarContent from "./SidebarContent";

/**
 * MobileSidebar component.
 *
 * This component represents the mobile sidebar. It is displayed on smaller screens
 * and is used to navigate between different pages.
 *
 * @return {JSX.Element} The MobileSidebar component.
 */
function MobileSidebar() {
  // Reference to the sidebar element
  const sidebarRef = useRef(null);

  // Get the sidebar context values
  const { isSidebarOpen, closeSidebar, saveScroll } =
    useContext(SidebarContext);

  /**
   * Handler function for when a link is clicked.
   *
   * Saves the scroll position of the sidebar before navigation.
   */
  const linkClickedHandler = () => {
    saveScroll(sidebarRef.current);
  };

  return (
    <Transition show={isSidebarOpen}>
      {/* Transition for the sidebar */}
      <>
        {/* Transition for the backdrop */}
        <Transition
          enter="transition ease-in-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in-out duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Backdrop onClick={closeSidebar} />
        </Transition>

        {/* Transition for the sidebar */}
        <Transition
          enter="transition ease-in-out duration-150"
          enterFrom="opacity-0 transform -translate-x-20"
          enterTo="opacity-100"
          leave="transition ease-in-out duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0 transform -translate-x-20"
        >
          {/* Sidebar element */}
          <aside
            id="mobileSidebar"
            ref={sidebarRef}
            className="fixed inset-y-0 z-50 flex-shrink-0 w-64 mt-16 overflow-y-auto bg-white dark:bg-gray-800 lg:hidden"
          >
            {/* Sidebar content */}
            <SidebarContent linkClicked={linkClickedHandler} />
          </aside>
        </Transition>
      </>
    </Transition>
  );
}

export default MobileSidebar;
