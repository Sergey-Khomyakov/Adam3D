/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
module.exports = {
  corePlugins: {
    preflight: false,
 },
  prefix: 'tw-',
  variants: {
    extend: {
      textColor: ['group-hover'],
      backgroundColor: ['peer-checked', 'peer-focus'],
      borderColor: ['peer-focus'],
      ringWidth: ['peer-focus'],
      ringColor: ['peer-focus'], 
      transform: ['peer-checked'],
    },
  },
  content: ['./**/*.html','./**/*.js','./**/*.pug'],
  theme: {
    extend: {
      marging:{
        'unset': 'unset',
      },
      width: {
        'fill-available': 'fill-available',
      },
      container:{
        screens:{
          xs: "100%",
          sm: "100%",
          md: '100%',
          lg: '90rem',
        }
      },
      gridTemplateColumns: {
        'full': '100%',
        'auto-1fr': 'auto 1fr',
        'auto-auto': 'auto auto',
        '1fr-auto': '1fr auto',
        '1fr-1fr': '1fr 1fr',
        'auto-auto-1fr': 'auto auto 1fr',
        '1fr-auto-1fr' : '1fr auto 1fr',
        'auto-1fr-auto' : 'auto 1fr auto',
        'auto-auto-auto-5': 'auto auto auto 5%',
        'auto-auto-auto-30': 'auto auto auto 30%',
        'auto-auto-auto-40': 'auto auto auto 40%',
        'auto-auto-auto': 'auto auto auto',
        'custom-2': '67rem 21.75rem',
      },
      boxShadow: {
        'custom-1': '0 1px 2px 0 rgba(51, 56, 66, 0.08), 0 1px 4px 0 rgba(16, 24, 40, 0.08)',
        'custom-2': '0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)',
        'custom-3': '0 1px 2px 0 rgba(51, 56, 66, 0.08)',
        'custom-4': '0 4px 4px 0 rgba(0, 0, 0, 0.15)',
        'custom-5': '0 2px 4px -2px rgba(16, 24, 40, 0.06), 0 4px 8px -2px rgba(51, 56, 66, 0.16)',
        'custom-6': '0 4px 8px -2px rgba(51, 56, 66, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.25)',
        'custom-7': '0 0 0 4px #d1fadf',
        'custom-8': '0 0 0 4px rgba(4, 189, 123, 0.2), 0 1px 2px 0 rgba(16, 24, 40, 0.05)',
      },
      backgroundImage: {
        'widget-user-profile': "url('./../img/other/bg-3.svg')",
      },
      colors: {
        'custom-black': 'rgba(0, 0, 0, 0.2)',
      },
    },
    screens: {
      xs: '20rem',
      sm: '48rem',
      md: '64rem',
      lg: '92.5rem',
    },
    fontFamily:{
      'arial': ['Arial', 'Helvetica', 'sans-serif']
     },
    colors: {
      dialog: 'rgb(76 92 105 / 80%)',
      transparent: 'transparent',
      white: '#FFFFFF',
      black: '#000000',
      primary: {
        DEFAULT: '#2B2D42', // Темно-серый вместо синего
        '25': "#F8F9FA",
        '50': "#EDF2F4",
        '100': "#E0E5EC",
        '200': "#8D99AE",
        '300': "#6C757D",
        '400': "#495057",
        '500': "#2B2D42",
        '600': "#212529",
        '700': "#1A1B1E",
        '800': "#141517",
        '900': "#0A0A0B"
      },
      gray: {
        DEFAULT: '#6B7280',
        '50': '#f9fafb',
        '100': '#f3f4f6',
        '200': '#e5e7eb',
        '300': '#d1d5db',
        '400': '#AFB5BB',
        '500': '#6B7280',
        '600': '#4b5563',
        '700': '#374151',
        '800': '#1f2937',
        '900': '#111827'
      },
      success: {
        DEFAULT: '#C11D1D', // Красный для иконок и кнопок
        '25': "#f6f6f7", // Белый для ховера
        '50': "#FFFFFF",
        '100': "#FFFFFF",
        '200': "#C11D1D",
        '300': "#C11D1D",
        '400': "#C11D1D",
        '500': "#C11D1D",
        '600': "#C11D1D",
        '700': "#C11D1D",
        '800': "#C11D1D",
        '900': "#C11D1D"
      },
      error: {
        DEFAULT: '#C11D1D',
        '25': "#C11D1D",
        '50': "#C11D1D",
        '100': "#C11D1D",
        '200': "#C11D1D",
        '300': "#C11D1D",
        '400': "#C11D1D",
        '500': "#C11D1D",
        '600': "#C11D1D",
        '700': "#C11D1D",
        '800': "#C11D1D",
        '900': "#C11D1D"
      }
    }
  },
  plugins: [
    plugin(function({ addComponents }) {
      addComponents({
        '.container': {
          maxWidth: '100%',
          '@screen xs': {
            maxWidth: 'calc(100% - 1rem)', // Пользовательская настройка
          },
          '@screen sm': {
            maxWidth: 'calc(100% - 1.75rem)', // Пользовательская настройка
          },
          '@screen md': {
            maxWidth: 'calc(100% - 3rem)', // Пользовательская настройка
          },
          '@screen lg': {
            maxWidth: '90rem',
          },
        },
      });
    }),
  ],
}

