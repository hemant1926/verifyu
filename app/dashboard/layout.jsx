
import Sidebar from "@/components/SideBar/sideBar";
import { SidebarProvider } from "@/context/SidebarContext";
import React from "react";
import Header from "@/components/Navbar/Navbar";
import PropTypes from "prop-types";

// make a copy of the data, for the second table


/**
 * This is the layout component that wraps the main content of the dashboard.
 * It includes the sidebar, header, and the main content area.
 * 
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The children nodes to be rendered inside the Main component.
 */
export default function layout({ children }) {
  // Wrap the content with the SidebarProvider to manage sidebar state
  return (
    <SidebarProvider>
      {/* Sidebar component for navigation */}
      <Sidebar />
      {/* Main content area */}
      <div className="flex flex-col flex-1 w-full">
        {/* Header component at the top of the page */}
        <Header />
        {/* Main component that renders the children content */}
        <Main>{children}</Main>
      </div>
    </SidebarProvider>

  );
}

Main.propTypes = {
  children: PropTypes.any.isRequired,
};
/**
 * The Main component renders the main content area of the dashboard.
 * It renders the content wrapped in a container with a grid layout.
 * 
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The children nodes to be rendered inside the Main component.
 * @return {React.ReactElement} The rendered component.
 */
function Main({ children }) {
  return (
    <main className="h-full overflow-y-auto ">
      {/* Container with a grid layout */}
      <div className="container grid px-6 mx-auto">{children}</div>
    </main>
  );
}

