import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F3F7",
        line: "#D5D6DE",
        text: "#2D2E35",
        muted: "#666876",
        accent: "#5A49E8",
        accentSoft: "#ECE9FF",
        title: "#3F327D"
      },
      borderRadius: {
        xl: "14px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(25, 26, 37, 0.05)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Nunito Sans", "Helvetica Neue", "sans-serif"],
        serif: ["Iowan Old Style", "Palatino", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
