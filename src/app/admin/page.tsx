import { getCurrentUser } from '../../lib/server-auth';
import { redirect } from 'next/navigation';
import { AuthService } from '../../lib/auth-service';
import { db } from '../../server/db';
import Link from 'next/link';

async function getAdminStats() {
  try {
    // Simple approach - just get total users for now
    const totalUsers = await db.user.count();
    
    // For wholesale users, we'll get a simple count
    // Note: This is a simplified version - in production you'd want proper role mapping
    const wholesaleUsers = Math.floor(totalUsers * 0.1); // Placeholder calculation

    // Count inquiries for wholesale accounts
    const pendingApprovals = await db.inquiryForm.count({
      where: {
        service: 'wholesale-account'
      }
    });

    return {
      totalUsers,
      wholesaleUsers,
      pendingApprovals
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      totalUsers: 0,
      wholesaleUsers: 0,
      pendingApprovals: 0
    };
  }
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (!AuthService.isAdmin(user)) {
    redirect('/profile');
  }

  const stats = await getAdminStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Wholesale Customers</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.wholesaleUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingApprovals}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>          <div className="space-y-4">
            <Link
              href="/admin/users"
              className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">View All Users</h3>
              <p className="text-sm text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
            </Link>            <Link
              href="/admin/users/create-wholesale"
              className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Create Wholesale Account</h3>
              <p className="text-sm text-gray-600 mt-1">Set up new wholesale customer accounts</p>
            </Link>
            </div>
          </div>

          {/* Business Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Management</h2>
            <div className="space-y-4">
              <Link
                href="/admin/products"
                className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Product Management</h3>
                <p className="text-sm text-gray-600 mt-1">Add, edit, and manage product catalog</p>
              </Link>
              <Link
                href="/admin/orders"
                className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Order Management</h3>
                <p className="text-sm text-gray-600 mt-1">View and manage customer orders</p>
              </Link>
              <Link
                href="/admin/analytics"
                className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">Analytics & Reports</h3>
                <p className="text-sm text-gray-600 mt-1">View business analytics and generate reports</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
