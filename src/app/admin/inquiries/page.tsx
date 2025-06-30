"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useI18n } from "../../i18n";
import { api } from "@/trpc/react";
import EmailComposer from "../../_components/EmailComposer";

type ApiSubmission = {
  id: string;
  customerName: string;
  customerEmail: string;
  companyName?: string | null;
  phone?: string | null;
  message?: string | null;
  status: string;
  items: any;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
};

type InquirySubmission = {
  id: string;
  customerName: string;
  customerEmail: string;
  companyName?: string | null;
  phone?: string | null;
  message?: string | null;
  status: string;
  items: any[];
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
};

export default function AdminInquiriesPage() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize status from URL parameter if provided
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<InquirySubmission | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailInquiry, setEmailInquiry] = useState<InquirySubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // all, today, week, month
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Set initial status from URL parameter
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['pending', 'reviewing', 'quoted', 'closed'].includes(statusParam)) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams]);

  // Get inquiry submissions
  const { data: submissions, isLoading, refetch } = api.admin.getInquirySubmissions.useQuery();

  // Update submission status
  const updateStatus = api.admin.updateInquiryStatus.useMutation({
    onSuccess: () => {
      refetch();
      setToast({ message: 'Status updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: () => {
      setToast({ message: 'Failed to update status', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  // Convert API submissions to typed submissions
  const typedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.map((submission: ApiSubmission): InquirySubmission => ({
      ...submission,
      items: Array.isArray(submission.items) ? submission.items : [],
      user: {
        name: submission.user.name || '',
        email: submission.user.email || ''
      }
    }));
  }, [submissions]);

  // Filter submissions based on status, search term, and date
  const filteredSubmissions = useMemo(() => {
    if (!typedSubmissions) return [];

    let filtered = typedSubmissions.filter((submission: InquirySubmission) => 
      selectedStatus === "all" || submission.status === selectedStatus
    );

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((submission: InquirySubmission) =>
        submission.customerName.toLowerCase().includes(searchLower) ||
        submission.customerEmail.toLowerCase().includes(searchLower) ||
        (submission.companyName && submission.companyName.toLowerCase().includes(searchLower))
      );
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter((submission: InquirySubmission) =>
        new Date(submission.createdAt) >= filterDate
      );
    }

    return filtered;
  }, [typedSubmissions, selectedStatus, searchTerm, dateFilter]);

  const openEmailComposer = (submission: InquirySubmission) => {
    setEmailInquiry(submission);
    setShowEmailComposer(true);
  };

  const closeEmailComposer = () => {
    setShowEmailComposer(false);
    setEmailInquiry(null);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!typedSubmissions) return null;

    const total = typedSubmissions.length;
    const pending = typedSubmissions.filter((s: InquirySubmission) => s.status === 'pending').length;
    const reviewing = typedSubmissions.filter((s: InquirySubmission) => s.status === 'reviewing').length;
    const quoted = typedSubmissions.filter((s: InquirySubmission) => s.status === 'quoted').length;
    const closed = typedSubmissions.filter((s: InquirySubmission) => s.status === 'closed').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = typedSubmissions.filter((s: InquirySubmission) => 
      new Date(s.createdAt) >= today
    ).length;

    return { total, pending, reviewing, quoted, closed, todayCount };
  }, [typedSubmissions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "reviewing": return "bg-blue-100 text-blue-800";
      case "quoted": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = (submissionId: string, newStatus: string) => {
    updateStatus.mutate({ 
      submissionId, 
      status: newStatus as "pending" | "reviewing" | "quoted" | "closed"
    });
  };

  // Export to CSV function
  const exportToCSV = () => {
    const csvData = filteredSubmissions.map((submission: InquirySubmission) => ({
      'Customer Name': submission.customerName,
      'Email': submission.customerEmail,
      'Company': submission.companyName || '',
      'Phone': submission.phone || '',
      'Status': submission.status,
      'Items Count': submission.items.length.toString(),
      'Items': submission.items.map(item => `${item.productName} (${item.quantity})`).join('; '),
      'Message': submission.message || '',
      'Submitted Date': new Date(submission.createdAt).toLocaleDateString(),
      'Account User': submission.user.name,
      'Account Email': submission.user.email,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map((row: Record<string, string>) => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inquiries-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Statistics */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedStatus === 'pending' ? 'Pending Inquiries' : 
                   selectedStatus === 'reviewing' ? 'Inquiries Under Review' :
                   selectedStatus === 'quoted' ? 'Quoted Inquiries' :
                   selectedStatus === 'closed' ? 'Closed Inquiries' :
                   'Inquiry Dashboard'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {filteredSubmissions.length} of {typedSubmissions?.length || 0} inquiries
                  {selectedStatus !== 'all' && ` (${selectedStatus})`}
                </p>
              </div>
              <nav className="flex space-x-4 text-sm">
                <a href="/" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  ← Back to Site
                </a>
                <span className="text-gray-300">|</span>
                <a href="/admin" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  Admin Dashboard
                </a>
              </nav>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredSubmissions.length === 0}
              className="px-4 py-2 bg-[#895D35] text-white rounded hover:bg-[#7A4F2A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.reviewing}</div>
                <div className="text-sm text-purple-700">Reviewing</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.quoted}</div>
                <div className="text-sm text-green-700">Quoted</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                <div className="text-sm text-gray-700">Closed</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.todayCount}</div>
                <div className="text-sm text-indigo-700">Today</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="quoted">Quoted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("all");
                setDateFilter("all");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
            >
              Clear
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredSubmissions.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No inquiries found</h2>
            <p className="text-gray-600">No inquiries match the selected status filter.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredSubmissions.map((submission: InquirySubmission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{submission.customerName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {submission.customerEmail}
                      </div>
                      {submission.companyName && (
                        <div>
                          <span className="font-medium">Company:</span> {submission.companyName}
                        </div>
                      )}
                      {submission.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {submission.phone}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons with improved styling */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 min-w-fit">
                    {/* Primary Action Button */}
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="px-4 py-2.5 bg-[#895D35] text-white text-sm font-medium rounded-lg hover:bg-[#7A4F2A] transition-colors duration-200 flex items-center justify-center whitespace-nowrap"
                    >
                      View Details
                    </button>
                    
                    {/* Status Dropdown */}
                    <select
                      value={submission.status}
                      onChange={(e) => handleStatusUpdate(submission.id, e.target.value)}
                      className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#895D35] focus:border-[#895D35] bg-white whitespace-nowrap"
                      disabled={updateStatus.isPending}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="quoted">Quoted</option>
                      <option value="closed">Closed</option>
                    </select>
                    
                    {/* Secondary Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEmailComposer(submission)}
                        className="px-3 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center space-x-1.5 whitespace-nowrap"
                        title="Send Email"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Email</span>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/inquiries/${submission.id}/email-thread`)}
                        className="px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1.5 whitespace-nowrap"
                        title="View Email Thread"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Thread</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Requested Items ({submission.items.length}):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {submission.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium text-sm">{item.productName}</span>
                          {item.notes && <p className="text-xs text-gray-600 mt-1">{item.notes}</p>}
                        </div>
                        <span className="text-sm font-semibold text-[#895D35]">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {submission.message && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                    <p className="text-gray-700 text-sm">{submission.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Inquiry Details</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedSubmission.customerName}</div>
                    <div><span className="font-medium">Email:</span> {selectedSubmission.customerEmail}</div>
                    {selectedSubmission.companyName && (
                      <div><span className="font-medium">Company:</span> {selectedSubmission.companyName}</div>
                    )}
                    {selectedSubmission.phone && (
                      <div><span className="font-medium">Phone:</span> {selectedSubmission.phone}</div>
                    )}
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedSubmission.status)}`}>
                        {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                      </span>
                    </div>
                    <div><span className="font-medium">Submitted:</span> {new Date(selectedSubmission.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">User:</span> {selectedSubmission.user.name}</div>
                    <div><span className="font-medium">Account Email:</span> {selectedSubmission.user.email}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Requested Items</h3>
                <div className="space-y-3">
                  {selectedSubmission.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-600">Product ID: {item.productId}</div>
                        {item.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Notes:</span> {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-[#895D35]">×{item.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.message && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Message</h3>
                  <div className="p-4 bg-gray-50 rounded border">
                    <p className="text-gray-700">{selectedSubmission.message}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    openEmailComposer(selectedSubmission);
                  }}
                  className="px-6 py-2 bg-[#895D35] text-white rounded hover:bg-[#7A4F2A] transition"
                >
                  Reply via Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && emailInquiry && (
        <EmailComposer
          isOpen={showEmailComposer}
          onClose={closeEmailComposer}
          inquiry={{
            id: emailInquiry.id,
            customerName: emailInquiry.customerName,
            customerEmail: emailInquiry.customerEmail,
            companyName: emailInquiry.companyName,
            phone: emailInquiry.phone,
            message: emailInquiry.message,
            items: emailInquiry.items,
            createdAt: emailInquiry.createdAt
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
