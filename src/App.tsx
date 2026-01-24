import React, { useState } from 'react';
import { Droplet } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginSignup } from './components/Auth/LoginSignup';
import { DonorRegistration } from './components/DonorRegistration';
import { DonorProfile } from './components/DonorProfile';
import { EmergencyRequest } from './components/EmergencyRequest';
import { DonorSearch } from './components/DonorSearch';
import { Statistics } from './components/Statistics';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminAddDonor } from './components/Admin/AdminAddDonor';
import { AdminDonorList } from './components/Admin/AdminDonorList';
import { AdminEmergencyRequests } from './components/Admin/AdminEmergencyRequests';

function AppContent() {
  const { isAuthenticated, logout, user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'register' | 'profile' | 'emergency' | 'search' | 'stats' | 'admin' | 'admin-add' | 'admin-list' | 'admin-edit' | 'admin-stats' | 'admin-settings' | 'admin-inactive' | 'admin-emergency-requests'>('register');
  const [hasProfile, setHasProfile] = useState(false);

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginSignup />;
  }

  // Admin user - show admin dashboard or admin tabs
  if (user?.isAdmin) {
    if (activeTab === 'admin-add') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
          <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 md:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white rounded-lg flex-shrink-0">
                    <Droplet className="text-red-600" size={28} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                    <p className="text-red-100 text-xs md:text-sm">Admin Panel</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 md:py-8">
            <AdminAddDonor 
              onBack={() => setActiveTab('admin')} 
              onSuccess={() => setActiveTab('admin-list')}
            />
          </main>
        </div>
      );
    }

    if (activeTab === 'admin-list' || activeTab === 'admin-edit' || activeTab === 'admin-inactive') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
          <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 md:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white rounded-lg flex-shrink-0">
                    <Droplet className="text-red-600" size={28} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                    <p className="text-red-100 text-xs md:text-sm">Admin Panel</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 md:py-8">
            <AdminDonorList onBack={() => setActiveTab('admin')} />
          </main>
        </div>
      );
    }

    if (activeTab === 'admin-stats') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
          <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 md:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white rounded-lg flex-shrink-0">
                    <Droplet className="text-red-600" size={28} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                    <p className="text-red-100 text-xs md:text-sm">Admin Panel - Statistics & Reports</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 md:py-8">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setActiveTab('admin')}
                className="mb-4 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium min-h-[44px] px-3 py-2"
              >
                ← Back to Dashboard
              </button>
              <Statistics />
            </div>
          </main>
        </div>
      );
    }

    if (activeTab === 'admin-settings') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
          <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 md:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white rounded-lg flex-shrink-0">
                    <Droplet className="text-red-600" size={28} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                    <p className="text-red-100 text-xs md:text-sm">Admin Panel - System Settings</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 md:py-8">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setActiveTab('admin')}
                className="mb-4 flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium min-h-[44px] px-3 py-2"
              >
                ← Back to Dashboard
              </button>
              <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
                <p className="text-gray-700 text-base">System configuration and settings will be available in a future update.</p>
              </div>
            </div>
          </main>
        </div>
      );
    }

    if (activeTab === 'admin-emergency-requests') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
          <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 md:py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white rounded-lg flex-shrink-0">
                    <Droplet className="text-red-600" size={28} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                    <p className="text-red-100 text-xs md:text-sm">Admin Panel - Emergency Requests</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6 md:py-8">
            <AdminEmergencyRequests onBack={() => setActiveTab('admin')} />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 md:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white rounded-lg flex-shrink-0">
                  <Droplet className="text-red-600" size={28} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                  <p className="text-red-100 text-xs md:text-sm">Admin Panel</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="text-right hidden lg:block">
                  <p className="text-xs md:text-sm text-red-100">Admin</p>
                  <p className="font-medium text-sm md:text-base">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 md:py-8">
          <AdminDashboard onNavigate={(view) => {
            const viewMap: Record<string, typeof activeTab> = {
              'add': 'admin-add',
              'list': 'admin-list',
              'edit': 'admin-edit',
              'stats': 'admin-stats',
              'settings': 'admin-settings',
              'inactive': 'admin-inactive',
              'emergency-requests': 'admin-emergency-requests'
            };
            setActiveTab(viewMap[view] || 'admin');
          }} />
        </main>
      </div>
    );
  }

  // New user (not registered) - show registration form
  if (!user?.isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 md:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white rounded-lg flex-shrink-0">
                  <Droplet className="text-red-600" size={28} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                  <p className="text-red-100 text-xs md:text-sm">Complete Your Registration</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 md:py-8">
          <DonorRegistration onSuccess={() => {
            setHasProfile(true);
            setActiveTab('profile');
            // Update user registration status
            updateUser({ isRegistered: true });
          }} />
        </main>
      </div>
    );
  }

  // Existing registered user - show full dashboard
  const tabs = [
    { id: 'profile' as const, name: '👤 My Profile', show: true },
    { id: 'emergency' as const, name: '🚨 Emergency Request', show: true },
    { id: 'search' as const, name: '🔍 Find Donors', show: true },
    { id: 'stats' as const, name: '📊 Statistics', show: true },
  ].filter(tab => tab.show);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white rounded-lg flex-shrink-0">
                <Droplet className="text-red-600" size={28} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold truncate">Blood Donor Management System</h1>
                <p className="text-red-100 text-xs md:text-sm hidden sm:block">Saving Lives Through Smart Blood Matching</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-right hidden lg:block">
                <p className="text-xs md:text-sm text-red-100">Welcome!</p>
                <p className="font-medium text-sm md:text-base">{user?.email || user?.phone}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 md:px-6 py-2 md:py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors text-sm md:text-base font-medium whitespace-nowrap min-h-[44px]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-md sticky top-[68px] md:top-[76px] z-40">
        <div className="container mx-auto px-2 md:px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-3 md:py-4 font-medium whitespace-nowrap transition-colors border-b-2 text-sm md:text-base min-h-[44px] ${
                  activeTab === tab.id
                    ? 'text-red-600 border-red-600'
                    : 'text-gray-700 border-transparent hover:text-red-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {activeTab === 'profile' && (
          <DonorProfile />
        )}
        
        {activeTab === 'emergency' && (
          <EmergencyRequest />
        )}
        
        {activeTab === 'search' && (
          <DonorSearch />
        )}
        
        {activeTab === 'stats' && (
          <Statistics />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Droplet className="text-red-600" size={20} />
                Key Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ OTP-based secure authentication</li>
                <li>✓ 90-day availability logic</li>
                <li>✓ Blood compatibility matching</li>
                <li>✓ Location-based donor search</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Data Protection</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Duplicate entry prevention</li>
                <li>✓ Soft delete functionality</li>
                <li>✓ Privacy-protected contacts</li>
                <li>✓ Normalized database (3NF)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Validation & Security</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Age validation (18+)</li>
                <li>✓ Valid blood group enforcement</li>
                <li>✓ Phone number validation</li>
                <li>✓ Email verification</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            <p>© 2026 Blood Donor Management System. Designed for efficient blood bank operations.</p>
            <p className="mt-2">🔒 Secure • 🚀 Fast • ❤️ Saving Lives</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
