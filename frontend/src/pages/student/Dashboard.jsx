import React from 'react';

const StudentDashboard = () => {
  return (
    <div>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-blue-600 text-lg font-semibold">Courses</h3>
            <p className="text-2xl font-bold">6</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-green-600 text-lg font-semibold">Assignments</h3>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-yellow-600 text-lg font-semibold">Average Grade</h3>
            <p className="text-2xl font-bold">85%</p>
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Assignments</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600">Due Tomorrow</p>
              <p className="text-gray-800">Math: Linear Equations Assignment</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-sm text-gray-600">Due in 3 days</p>
              <p className="text-gray-800">Science: Lab Report Submission</p>
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Grades</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">Physics Quiz</p>
                <p className="text-sm text-gray-600">Submitted yesterday</p>
              </div>
              <span className="text-green-600 font-bold">92%</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-medium">English Essay</p>
                <p className="text-sm text-gray-600">Submitted 3 days ago</p>
              </div>
              <span className="text-green-600 font-bold">88%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
