import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:'#F0F6FA',100:'#D9E8F1',200:'#B8D3E3',300:'#8DB8D0',400:'#5E99B9',
          500:'#2E779E',600:'#115E86',700:'#003C5F',800:'#002C46',900:'#001C2D',
        },
        secondary: {
          50:'#FFF4EC',100:'#FFE6D2',200:'#FFCBA6',300:'#FFAE78',400:'#FF8F49',
          500:'#FF7321',600:'#E35D12',700:'#BD4B10',800:'#953B0E',900:'#612608',
        },
        accent: {
          50:'#E6FAF7',100:'#C8F4EC',200:'#97E7DC',300:'#67D9CA',400:'#3AC9B6',
          500:'#14B8A6',600:'#0F9E8F',700:'#0B7E72',800:'#075F56',900:'#04453F',
        },
        neutral: {
          50:'#F8FAFC',100:'#EEF2F6',200:'#E2E8F0',300:'#CBD5E1',400:'#94A3B8',
          500:'#64748B',600:'#475569',700:'#334155',800:'#1F2937',900:'#0B1220',
        },
      },
    },
  },
  plugins: [],
};
export default config;
