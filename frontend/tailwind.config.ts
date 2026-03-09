import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './index.html',
        './components/**/*.{ts,tsx}',
        './views/**/*.{ts,tsx}',
        './App.tsx',
    ],
    theme: {
        colors: {
            primary: '#ec1380',
            'primary-dark': '#d10d6e',
            'background-light': '#f8fafc',
            white: '#ffffff',
            slate: {
                50: '#f8fafc',
                200: '#e2e8f0',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                900: '#0f172a',
            },
            yellow: {
                50: '#fefce8',
                700: '#b45309',
            },
            green: {
                50: '#f0fdf4',
                100: '#dcfce7',
                600: '#16a34a',
                700: '#15803d',
            },
            red: {
                100: '#fee2e2',
                500: '#ef4444',
                600: '#dc2626',
            },
        },
    },
    plugins: [],
};

export default config;
