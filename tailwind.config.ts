// tailwind.config.ts
import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        offwhite: '#f4f4f5',   // or #f5f5f0, adjust to your liking
      },

    },
  },
  plugins: [

    animate,
  ],
}

export default config