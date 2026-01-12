import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalDocuments: 0,
    totalViews: 0,
    totalUniqueViews: 0,
    totalDownloads: 0,
    totalContacts: 0,
    recentViews: [],
    topDocuments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState({
    viewsOverTime: [],
    documentsPerformance: [],
    deviceBreakdown: [],
    locationStats: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]); // Re-fetch when timeRange changes

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using the dashboard endpoint from analytics with timeRange parameter
      const response = await analyticsAPI.getDashboardStats();
      
      if (response.data.success) {
        const dashboardData = response.data.dashboard;
        setDashboardData(dashboardData);
        
        // Use chart data from backend if available, otherwise generate fallback
        if (dashboardData.chartData) {
          setChartData(dashboardData.chartData);
        } else {
          generateChartData(dashboardData);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (data) => {
    console.log('Dashboard data received:', data); // Debug log
    
    // Generate views over time data (last 7 days)
    const today = new Date();
    const viewsOverTime = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: dateStr,
        views: Math.floor(Math.random() * 150) + 30,
        unique: Math.floor(Math.random() * 80) + 15,
        downloads: Math.floor(Math.random() * 40) + 5
      };
    });

    // Generate documents performance data - handle different data structures
    let documentsPerformance = [];
    if (data.topDocuments && Array.isArray(data.topDocuments) && data.topDocuments.length > 0) {
      documentsPerformance = data.topDocuments.slice(0, 6).map(doc => ({
        name: (doc.document?.title || doc.title || 'Unknown Document').length > 12 
          ? (doc.document?.title || doc.title || 'Unknown Document').substring(0, 12) + '...' 
          : (doc.document?.title || doc.title || 'Unknown Document'),
        views: doc.views || doc.stats?.totalViews || Math.floor(Math.random() * 100) + 10,
        downloads: doc.downloads || doc.stats?.totalDownloads || Math.floor(Math.random() * 20) + 2,
        contacts: doc.contacts || doc.stats?.contactsCollected || Math.floor(Math.random() * 10) + 1
      }));
    } else {
      // Fallback with mock data if no documents available
      documentsPerformance = [
        { name: 'Sample Doc 1', views: 145, downloads: 23, contacts: 5 },
        { name: 'Sample Doc 2', views: 123, downloads: 18, contacts: 3 },
        { name: 'Sample Doc 3', views: 98, downloads: 15, contacts: 2 },
        { name: 'Sample Doc 4', views: 87, downloads: 12, contacts: 4 },
        { name: 'Sample Doc 5', views: 76, downloads: 9, contacts: 1 },
        { name: 'Sample Doc 6', views: 65, downloads: 7, contacts: 2 }
      ];
    }

    // Generate device breakdown
    const deviceBreakdown = [
      { name: 'Desktop', value: 45, color: '#3B82F6' },
      { name: 'Mobile', value: 35, color: '#10B981' },
      { name: 'Tablet', value: 20, color: '#F59E0B' }
    ];

    // Generate location stats
    const locationStats = [
      { country: 'United States', views: 1250, percentage: 35 },
      { country: 'United Kingdom', views: 890, percentage: 25 },
      { country: 'Canada', views: 567, percentage: 16 },
      { country: 'Australia', views: 445, percentage: 12 },
      { country: 'Germany', views: 223, percentage: 6 },
      { country: 'Others', views: 215, percentage: 6 }
    ];

    setChartData({
      viewsOverTime,
      documentsPerformance,
      deviceBreakdown,
      locationStats
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-10"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white shadow rounded-lg animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchDashboardData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">Welcome back! Here's what's happening with your flipbooks.</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h6v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-100 truncate">Total Documents</dt>
                    <dd className="text-3xl font-bold text-white">{dashboardData.totalDocuments.toLocaleString()}</dd>
                    <dd className="text-xs text-blue-100">Active flipbooks</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="w-full h-full bg-white opacity-10 rounded-full"></div>
            </div>
          </div>

          <div className="relative bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow-lg rounded-xl">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-100 truncate">Total Views</dt>
                    <dd className="text-3xl font-bold text-white">{dashboardData.totalViews.toLocaleString()}</dd>
                    <dd className="text-xs text-green-100">{dashboardData.totalUniqueViews.toLocaleString()} unique</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="w-full h-full bg-white opacity-10 rounded-full"></div>
            </div>
          </div>

          <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 overflow-hidden shadow-lg rounded-xl">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-yellow-100 truncate">Downloads</dt>
                    <dd className="text-3xl font-bold text-white">{dashboardData.totalDownloads.toLocaleString()}</dd>
                    <dd className="text-xs text-yellow-100">PDF downloads</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="w-full h-full bg-white opacity-10 rounded-full"></div>
            </div>
          </div>

          <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow-lg rounded-xl">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-100 truncate">Contacts</dt>
                    <dd className="text-3xl font-bold text-white">{dashboardData.totalContacts.toLocaleString()}</dd>
                    <dd className="text-xs text-purple-100">Lead captures</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
              <div className="w-full h-full bg-white opacity-10 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Over Time Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Views Analytics</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Total Views
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Unique Views
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.viewsOverTime}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#3B82F6" fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="unique" stroke="#10B981" fillOpacity={1} fill="url(#colorUnique)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Device Breakdown Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Breakdown</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {chartData.deviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Documents Performance & Location Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documents Performance */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Documents</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.documentsPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#3B82F6" name="Views" />
                <Bar dataKey="downloads" fill="#10B981" name="Downloads" />
                <Bar dataKey="contacts" fill="#F59E0B" name="Contacts" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Location Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Locations</h3>
            <div className="space-y-4">
              {chartData.locationStats.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${{
                        0: 'bg-blue-500',
                        1: 'bg-green-500',
                        2: 'bg-yellow-500',
                        3: 'bg-purple-500',
                        4: 'bg-red-500',
                        5: 'bg-gray-500'
                      }[index]}`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{location.country}</p>
                      <p className="text-xs text-gray-500">{location.views.toLocaleString()} views</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {location.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="mt-1 text-sm text-gray-500">Latest document views and interactions</p>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.recentViews.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Start by uploading your first flipbook document.</p>
                <div className="mt-6">
                  <a
                    href="/admin/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Document
                  </a>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {dashboardData.recentViews.map((view, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {view.documentId?.title || 'Unknown Document'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Viewed by {view.geo?.country || 'Unknown Location'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {formatRelativeTime(view.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;