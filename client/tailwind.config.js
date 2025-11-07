/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // V3.0: EXTEND UTILITIES FOR BACKDROP BLUR
      backdropBlur: {
        'lg': '12px'
      },
    },
  },
  plugins: [
    // V3.0: REQUIRE TAILWIND CSS FORMS PLUGIN (Optional but helpful)
    //require('@tailwindcss/forms'),
  ],
}
