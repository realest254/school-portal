import React from 'react';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Clock
} from 'lucide-react';

const Overview = () => {
  const metrics = [
    { 
      label: 'Total Students', 
      value: '1,234', 
      change: '+5%', 
      trend: 'positive',
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    },
    { 
      label: 'Total Teachers', 
      value: '89', 
      change: '+2%', 
      trend: 'positive',
      icon: <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
    },
    { 
      label: 'Indiscipline Cases', 
      value: '23', 
      change: '-10%', 
      trend: 'negative',
      icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
    }
  ];

  const recentActivities = [
    { 
      type: 'enrollment',
      description: 'New student enrolled in Grade 10',
      time: '2 hours ago'
    },
    {
      type: 'attendance',
      description: 'Attendance marked for all classes',
      time: '3 hours ago'
    },
    {
      type: 'discipline',
      description: 'Disciplinary action recorded for Grade 8',
      time: '5 hours ago'
    },
    {
      type: 'academic',
      description: 'Term results uploaded for Grade 12',
      time: '1 day ago'
    }
  ];

  const quickStats = [
    { label: 'Attendance Rate', value: '95%' },
    { label: 'Average GPA', value: '3.5' },
    { label: 'Active Classes', value: '32' },
    { label: 'Upcoming Events', value: '8' }
  ];

  return (
    <div className="w-full p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
              <div>{metric.icon}</div>
            </div>
            <div className="mt-4 flex items-center">
              {metric.trend === 'positive' ? (
                <TrendingUp className="w-4 h-4 text-green-500 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
              )}
              <span className={`ml-2 text-sm font-medium ${
                metric.trend === 'positive' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Recent Activities Card */}
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activities</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivities.map((activity, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
