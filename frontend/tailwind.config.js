/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#136dec",
                "background-light": "#f6f7f8",
                "background-dark": "#101822",
                "positive": "#28A745",
                "negative": "#DC3545",
                "content-light": "#ffffff",
                "content-dark": "#1c2a3a",
                "text-primary-light": "#0d131b",
                "text-primary-dark": "#f6f7f8",
                "text-secondary-light": "#4c6c9a",
                "text-secondary-dark": "#a2b4c7",
                "border-light": "#e7ecf3",
                "border-dark": "#34455a",
                "interactive-light": "#e7ecf3",
                "interactive-dark": "#34455a"
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
    plugins: [],
}
