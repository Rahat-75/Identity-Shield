'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useState } from 'react';
import { ShieldAlert, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import PrivacyPassCard from '@/components/credentials/PrivacyPassCard';
import ConsentManager from '@/components/consent/ConsentManager';
import { cn, formatDate } from '@/lib/utils';
import { enrollmentApi, EnrollmentCase } from '@/lib/enrollment-api';
import { adminApi } from '@/lib/admin-api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [recentCase, setRecentCase] = useState<EnrollmentCase | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'ORG_USER') {
        router.push('/org/dashboard');
      } else if (user.role === 'ADMIN') {
        // No redirect, stay here
        loadAdminStats();
      } else if (user.role === 'CITIZEN') {
        loadEnrollmentStatus();
      }
    }
  }, [user, loading, router]);

  const loadEnrollmentStatus = async () => {
    const { data } = await enrollmentApi.listCases();
    if (data && data.length > 0) {
      // Get the most recent case
      setRecentCase(data[0]);
    }
  };

  const loadAdminStats = async () => {
    try {
      const { data } = await adminApi.getDashboardStats();
      if (data) setStats(data);
    } catch (err) {
      console.error("Failed to load admin stats", err);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">
                  {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Citizen Dashboard'}
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user.email}</span>
                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* USER PROFILE INFO (Left Column) */}
          <div className="bg-white shadow rounded-lg p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">My Profile</h2>
              <span className={cn(
                "px-2 py-1 text-xs font-semibold rounded-full",
                user.role === 'ADMIN' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              )}>
                {user.role}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-base font-medium">{user.phone || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA (Middle Column) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* CITIZEN VIEW */}
            {user.role === 'ADMIN' ? (
                <div className="space-y-6">
                  <div className="bg-white shadow-lg rounded-xl p-8 border-l-4 border-purple-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Administrative Control Center</h3>
                        <p className="text-gray-600 mb-6 max-w-lg">
                          You have access to the identity management and verification oversight tools. 
                          Review pending enrollments, manage organizations, and view system audit logs.
                        </p>
                        <Link 
                          href="/admin-portal"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition shadow-md hover:shadow-lg"
                        >
                          <ShieldAlert className="w-5 h-5" /> Enter Admin Portal
                        </Link>
                      </div>
                      <ShieldAlert className="w-24 h-24 text-purple-100" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {stats ? (
                      <>
                         <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Users</h4>
                          <p className="text-2xl font-bold text-purple-600 mt-2">{stats.total_citizens}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending Review</h4>
                          <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.enrollment_stats.pending}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                           <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Approved</h4>
                           <p className="text-2xl font-bold text-green-600 mt-2">{stats.enrollment_stats.approved}</p>
                        </div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border">
                           <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Approval Rate</h4>
                           <p className="text-2xl font-bold text-blue-600 mt-2">{stats.enrollment_stats.approval_rate}%</p>
                        </div>
                      </>
                    ) : ( 
                      // Loading State
                      [1,2,3,4].map(i => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border animate-pulse">
                           <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                           <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      ))
                     )}
                  </div>
                </div>
            ) : (
              /* CITIZEN VIEW */
              <>
                {/* 1. Enrollment Status or CTA */}
                {!recentCase ? (
                  <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Identity Verification</h3>
                    <p className="text-gray-600 mb-4">You need to verify your NID to unlock all features.</p>
                    <Link 
                      href="/enrollment"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start Enrollment <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className={cn(
                    "bg-white shadow rounded-lg p-6 border-l-4",
                    recentCase.status === 'PENDING_REVIEW' && "border-yellow-400",
                    recentCase.status === 'APPROVED' && "border-green-500",
                    recentCase.status === 'REJECTED' && "border-red-500"
                  )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {recentCase.status === 'PENDING_REVIEW' && 'Application Under Review'}
                          {recentCase.status === 'APPROVED' && 'Identity Verified'}
                          {recentCase.status === 'REJECTED' && 'Application Update Required'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Case ID: #{recentCase.id} • Submitted on {formatDate(recentCase.submitted_at)}
                        </p>
                        
                        {recentCase.status === 'PENDING_REVIEW' && (
                          <p className="text-gray-700">
                            Your application is currently being reviewed by our team. You will be able to generate your Privacy Pass once approved.
                          </p>
                        )}
                        
                        {recentCase.status === 'APPROVED' && (
                          <p className="text-green-700 font-medium">
                            Congratulations! Your identity has been verified. Your Privacy Pass features are now fully active.
                          </p>
                        )}

                        {recentCase.status === 'REJECTED' && (
                          <div className="space-y-3">
                            <p className="text-red-600 font-medium">
                              Your application was returned. Please address the feedback below and resubmit.
                            </p>
                            {recentCase.admin_notes && (
                              <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 border border-red-100">
                                <strong>Admin Feedback:</strong> {recentCase.admin_notes}
                              </div>
                            )}
                            <Link 
                              href="/enrollment"
                              className="inline-flex items-center text-sm font-bold text-red-600 hover:text-red-700 underline"
                            >
                              Restart Enrollment
                            </Link>
                          </div>
                        )}
                      </div>
                      
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        recentCase.status === 'PENDING_REVIEW' && "bg-yellow-100 text-yellow-600",
                        recentCase.status === 'APPROVED' && "bg-green-100 text-green-600",
                        recentCase.status === 'REJECTED' && "bg-red-100 text-red-600"
                      )}>
                        {recentCase.status === 'PENDING_REVIEW' && <Clock className="w-6 h-6" />}
                        {recentCase.status === 'APPROVED' && <CheckCircle className="w-6 h-6" />}
                        {recentCase.status === 'REJECTED' && <XCircle className="w-6 h-6" />}
                      </div>
                    </div>
                  </div>
                )}

                <PrivacyPassCard />
                <ConsentManager />
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
