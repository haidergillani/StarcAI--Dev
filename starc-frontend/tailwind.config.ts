import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      minWidth: {
        '250': '250px',
      },
      fontSize: {
        // TODO: not sure the best way to name these so use is easy
        sm_1: ['10px', { lineHeight: '20px' }],
        sm_2: ['12px', { lineHeight: '20px' }],
        sm_3: ['14px', { lineHeight: '20px' }],
        m_1: ['16px', { lineHeight: '24px' }],
        m_2: ['18px', { lineHeight: '24px' }],
        lg_1: ['25px', { lineHeight: '45px' }],
        lg_2: ['26px', { lineHeight: '45px' }],
        xl: ['40px', { lineHeight: '60px' }],
        xxl: ['60px', { lineHeight: '90px' }],
        base: ['16px', { lineHeight: '24px' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        '6': '6px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '18': '18px',
        '24': '24px',
        '33': '33px',
				'37': '37px',
				'42': '42px',
        '57': '57px',
        '66': '66px',
        '83': '83px',
        '116': '116px',
        '124': '124px',
        '150': '150px',
        '208': '208px',
        '250': '250px',
        '380': '380px',
      },
      colors: { 
        'primary-purple': '#5D5FEF',
        'primary-blue': '#0043CE',
        'secondary-light-blue': '#D0E2FF',
        'primary-pink': '#EF5DA8',
        'secondary-pink': '#FCDDEC',
        'primary-green': '#37C6AB',
        'secondary-green': '#CAFAE4',
        'black': '#000',
        'white': '#FFF',
        'background': '#F2F3F9',
        'gray-10': '#FCFCFC',
        'gray-20': '#D2D2D2',
        'gray-50': '#717171',
        'gray-70': '#525252',
        'gray-90': '#262626',
        'secondary-background-404': '#D7D7F4',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(90deg, #3A3DE1 0%, #5D5FEF 100%)',
      },
    },
    
  },
  plugins: [],
} satisfies Config;
