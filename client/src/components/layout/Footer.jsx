// src/components/layout/Footer.jsx

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
        <div className="mb-2 md:mb-0">
          &copy; {currentYear} reACT Platform. All rights reserved.
        </div>
        <div className="space-x-4">
          <a href="#" className="hover:text-indigo-400 transition duration-150">Privacy Policy</a>
          <a href="#" className="hover:text-indigo-400 transition duration-150">Terms of Service</a>
          <a href="#" className="hover:text-indigo-400 transition duration-150">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;