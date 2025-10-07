import ThemeProvider from "@/provider/ThemeProvider";
import "./globals.css";
import React from "react";
import { Montserrat } from "next/font/google";
const montserrat = Montserrat({ subsets: ["latin"] });
import PropTypes from "prop-types";

RootLayout.propTypes = {
  children: PropTypes.any.isRequired,
};
export const metadata = {
  title: "VerifyU",
  description: "VerifyU - Verify your identity with ease",
};

export default function RootLayout({ children }) {
  // const { isSidebarOpen } = useContext(SidebarContext);

  return (
    <html lang="en">
      <body className={montserrat.className}>
        <ThemeProvider>
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}








