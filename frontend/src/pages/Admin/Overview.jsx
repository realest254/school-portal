import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  Clock
} from 'lucide-react';
import axios from '../../utils/axios';

const Overview = () => {
  const [stats, setStats] = useState({
    students: { total: 0 },
    teachers: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/dashboard/stats/basic');
        setStats(response.data.stats);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const metrics = [
    { 
      label: 'Total Students', 
      value: loading ? '...' : stats.students.total.toString(), 
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    },
    { 
      label: 'Total Teachers', 
      value: loading ? '...' : stats.teachers.total.toString(),
      icon: <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
    },
    { 
      label: 'Indiscipline Cases', 
      value: '0', 
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
    }
  ];

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                {metric.icon}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {metric.label}
            </h3>
            <div className="flex items-center mt-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                {metric.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div 
              key={index}
              className="flex items-start space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex-shrink-0">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
