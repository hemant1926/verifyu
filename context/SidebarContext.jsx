"use client";
import React, {
  useCallback,
  createContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
// import { useRouter } from "next/router";
import PropTypes from "prop-types";

const SidebarContext = createContext({
  isSidebarOpen: false,
  scrollY: { id: null, position: 0 },
  closeSidebar: () => { },
  toggleSidebar: () => { },
  saveScroll: () => { },
});

export const SidebarProvider = ({ children }) => {
  // const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  const defaultScrollY = useMemo(() => {
    return { id: null, position: 0 };
  }, []);

  const storageScrollY = useCallback(() => {
    return JSON.parse(
      sessionStorage.getItem("sidebarScrollY") || JSON.stringify(defaultScrollY)
    );
  }, [defaultScrollY]);

  const [scrollY, setScrollY] = useState(
    typeof window !== "undefined" ? storageScrollY() : defaultScrollY
  );

  function saveScroll(el) {
    const id = el?.id || null;
    const position = el?.scrollTop || 0;
    setScrollY({ id, position });
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sidebarScrollY", JSON.stringify(scrollY));
    }
  }, [scrollY]);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const { id, position } = storageScrollY();
      document.getElementById(id)?.scrollTo(0, position);

      if (isSidebarOpen) {
        document.getElementById(id)?.scrollTo(0, position);
      }
    }
  }, [scrollY, storageScrollY, isSidebarOpen]);

  const context = {
    isSidebarOpen,
    scrollY,
    toggleSidebar,
    closeSidebar,
    saveScroll,
  };

  return (
    <SidebarContext.Provider value={context}>
      <div
        className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${isSidebarOpen && "overflow-hidden"
          }`}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

SidebarProvider.propTypes = {
  children: PropTypes.any.isRequired,
};
export default SidebarContext;
