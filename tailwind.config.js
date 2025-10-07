import windmill from "@roketid/windmill-react-ui/config";

const windmillConfig = windmill({
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6C22A6",
        secondary: "#A187B0",
        background: "#FDF7FF",
      },
    },
  },
  plugins: [require("daisyui")],
});

export default windmillConfig;
