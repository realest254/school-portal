import React from 'react';

const TeacherDashboard = () => {
  return (
    <div>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Teacher Dashboard</h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-indigo-600 text-lg font-semibold">Classes</h3>
            <p className="text-2xl font-bold">5</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-green-600 text-lg font-semibold">Students</h3>
            <p className="text-2xl font-bold">150</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-purple-600 text-lg font-semibold">Assignments</h3>
            <p className="text-2xl font-bold">25</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4">
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-gray-800">New assignment submitted by Class 10A</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <p className="text-sm text-gray-600">Yesterday</p>
              <p className="text-gray-800">Grade updates for Math Quiz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
