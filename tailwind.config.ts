import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [forms],
};

export default config;
