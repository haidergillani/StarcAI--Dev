import { type AppType } from "next/dist/shared/lib/utils";
import { useState, useEffect } from 'react';
import Menu from "./components/Menu";
import { withAuth } from "../components/withAuth";
import { getStoredTokens } from "../utils/auth";
import { jwtDecode } from "jwt-decode";
import { api } from "../utils/auth";

interface UserStats {
  email: string;
  totalDocuments: number;
  totalRewrites: number;
  timeSaved: number;  // in minutes
  lastActivity: string;
}

interface DecodedToken {
  sub: string;
  email: string;
  auth_method: string;
  iat: number;
}

const AccountPage: AppType = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<UserStats>({
    email: '',
    totalDocuments: 0,
    totalRewrites: 0,
    timeSaved: 0,
    lastActivity: ''
  });
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens.access_token) {
      try {
        const decoded = jwtDecode<DecodedToken>(tokens.access_token);
        setUserInfo(decoded);
        
        const fetchStats = async () => {
          try {
            const response = await api.get<UserStats>('/docs/user/stats');
            if (response.data) {
              setUserStats(response.data);
            }
          } catch (error) {
            console.error('Error fetching user stats:', error);
          }
        };
        void fetchStats();
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 ${
        activeTab === id
          ? 'bg-indigo-800 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </button>
  );

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} minutes`;
    } else if (hours === 1) {
      return `${hours} hour ${remainingMinutes} minutes`;
    } else {
      return `${hours} hours ${remainingMinutes} minutes`;
    }
  };

  const StatCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{title}</h4>
      <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-400 mb-2">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Menu />
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center space-x-6">
          <div className="w-20 h-20 bg-indigo-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {userStats.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {userStats.email ?? 'Loading...'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Member since {userInfo ? new Date(userInfo.iat * 1000).toLocaleDateString() : 'Loading...'}
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <TabButton id="overview" label="Overview" />
          <TabButton id="activity" label="Activity" />
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Documents" 
                  value={userStats.totalDocuments}
                  subtitle="documents created"
                />
                <StatCard 
                  title="Total Rewrites" 
                  value={userStats.totalRewrites}
                  subtitle="successful rewrites"
                />
                <StatCard 
                  title="Time Saved" 
                  value={formatTime(userStats.timeSaved)}
                  subtitle="at 20 mins per rewrite"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Efficiency Score</h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      You&#39;ve saved {formatTime(userStats.timeSaved)} using our AI rewrite feature
                    </p>
                  </div>
                  <div className="text-5xl font-bold text-indigo-800">
                    {((userStats.timeSaved / (userStats.totalDocuments * 30)) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-indigo-800 pl-4">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Last Activity</h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      {userStats.lastActivity ? new Date(userStats.lastActivity).toLocaleString() : 'No recent activity'}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-600 pl-4">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-2">Productivity Impact</h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      Average time saved: {userStats.totalDocuments ? (userStats.timeSaved / userStats.totalDocuments).toFixed(1) : "0"} minutes per document
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(AccountPage); 