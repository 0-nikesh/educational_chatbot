/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(249 250 251)",
        foreground: "rgb(17 24 39)",
        panel: "rgb(255 255 255)",
        muted: "rgb(243 244 246)",
        border: "rgb(229 231 235)"
      },
    },
  },
  plugins: [],
};
