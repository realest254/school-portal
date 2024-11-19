import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
