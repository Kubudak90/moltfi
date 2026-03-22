import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MoltFi palette — JP Morgan blue / Goldman meets Uniswap
        navy: {
          950: '#060E1A',  // deepest bg
          900: '#0A1628',  // page bg
          800: '#0F2645',  // card bg
          700: '#163360',  // card hover / elevated
          600: '#1D4178',  // borders
        },
        jpm: {
          DEFAULT: '#003A70', // JP Morgan blue — primary buttons
          light: '#0D5CA8',  // hover
          dark: '#002B54',   // pressed
        },
        gold: {
          DEFAULT: '#C5A55A', // Goldman accent
          light: '#D4BA78',   // hover
          dim: '#8B7440',     // muted text
        },
        uni: {
          DEFAULT: '#FF007A', // Uniswap pink — interactive highlights
          light: '#FF3D9A',   // hover
          dim: '#B3005C',     // pressed
        },
      },
    },
  },
  plugins: [],
}
export default config
