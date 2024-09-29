import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  prefix: "player-",
  darkMode: ["class"],

  content: ["src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--player-border))",
        input: "hsl(var(--player-input))",
        ring: "hsl(var(--player-ring))",
        background: "hsl(var(--player-background))",
        foreground: "hsl(var(--player-foreground))",
        primary: {
          DEFAULT: "hsl(var(--player-primary))",
          foreground: "hsl(var(--player-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--player-secondary))",
          foreground: "hsl(var(--player-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--player-destructive))",
          foreground: "hsl(var(--player-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--player-muted))",
          foreground: "hsl(var(--player-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--player-accent))",
          foreground: "hsl(var(--player-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--player-popover))",
          foreground: "hsl(var(--player-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--player-card))",
          foreground: "hsl(var(--player-card-foreground))",
        },
      },
      borderRadius: {
        lg: `var(--player-radius)`,
        md: `calc(var(--player-radius) - 2px)`,
        sm: "calc(var(--player-radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--player-font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "player-accordion-down": {
          from: { height: "0" },
          to: { height: "var(--player-radix-accordion-content-height)" },
        },
        "player-accordion-up": {
          from: { height: "var(--player-radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "player-accordion-down 0.2s ease-out",
        "accordion-up": "player-accordion-up 0.2s ease-out",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [require("tailwindcss-animate")],
};
