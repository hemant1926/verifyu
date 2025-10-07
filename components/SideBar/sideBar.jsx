import React from 'react'
import DesktopSidebar from './DesktopSidebar'
import MobileSidebar from './MobileSidebar'

/**
 * Sidebar component.
 *
 * This component renders the sidebar for both desktop and mobile devices.
 *
 * @return {JSX.Element} The Sidebar component.
 */
function Sidebar() {
  return (
    <>
      {/* Render the desktop sidebar */}
      <DesktopSidebar />

      {/* Render the mobile sidebar */}
      <MobileSidebar />
    </>
  );
}

export default Sidebar
