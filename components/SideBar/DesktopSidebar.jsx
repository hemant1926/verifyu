"use client";
import React, { useContext, useRef } from "react";
import SidebarContext from "@/context/SidebarContext";
import SidebarContent from "@/components/SideBar/SidebarContent";

/**
 * Renders the desktop sidebar component.
 * This component includes the sidebar content and manages its scroll position.
 */
function DesktopSidebar() {
  // Reference to the sidebar element for managing scroll position.
  const sidebarRef = useRef(null);

  // Context to save the current scroll position of the sidebar.
  const { saveScroll } = useContext(SidebarContext);

  /**
   * Handles click event on links within the sidebar.
   * Saves the current scroll position when a link is clicked.
   */
  const linkClickedHandler = () => {
    saveScroll(sidebarRef.current);
  };

  return (
    <div
      id="desktopSidebar"
      ref={sidebarRef}
      className="z-30 flex-shrink-0 hidden w-48 overflow-y-auto bg-white dark:bg-gray-800 lg:block"
    >
      {/* Sidebar content with a callback for link click events */}
      <SidebarContent linkClicked={linkClickedHandler} />
    </div>
  );
}

export default DesktopSidebar;
