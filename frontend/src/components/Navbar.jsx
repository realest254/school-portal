import React from 'react';
import PropTypes from 'prop-types';
import { FaBars } from 'react-icons/fa';

const Navbar = ({ collapsed, toggleCollapsed }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <FaBars className="text-gray-600 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center space-x-4">
          {/* Add any additional navbar items here */}
        </div>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  toggleCollapsed: PropTypes.func.isRequired
};

export default Navbar;
