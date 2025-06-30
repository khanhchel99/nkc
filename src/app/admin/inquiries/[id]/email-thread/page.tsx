'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useState } from 'react';
import { ChevronLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import EmailComposer from '@/app/_components/EmailComposer';

interface EmailMessage {
  id: string;
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sentAt: Date;
  isFromAdmin: boolean;
  emailType: string;
}

interface EmailThread {
  id: string;
  threadId: string;
  inquiryId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  emails: EmailMessage[];
  inquiry: {
    id: string;
    customerName: string;
    customerEmail: string;
    companyName?: string;
    phone?: string;
    message?: string;
    status: string;
    createdAt: Date;
    items: Array<{
      productName: string;
      productId: string;
      quantity: number;
      notes?: string;
    }>;
    user: {
      name?: string;
      email: string;
    };
  };
}

export default function EmailThreadPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params?.id as string;
  
  const [showComposer, setShowComposer] = useState(false);

  const { data: emailThread, isLoading, error, refetch } = api.admin.getEmailThread.useQuery(
    { inquirySubmissionId: inquiryId },
    { enabled: !!inquiryId }
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Email Thread</h2>
          <p className="text-red-600">
            {error?.message || 'Failed to load email thread.'}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle case where no email thread exists yet
  if (!emailThread) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Inquiries
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Email Thread
            </h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Email Thread Yet
            </h3>
            <p className="text-gray-500 mb-6">
              This inquiry doesn't have an email thread yet. An email thread will be created automatically when you send the first email to the customer.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Inquiries
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back to Inquiries
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Email Thread: {emailThread.customerName}
          </h1>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
          Send Reply
        </button>
      </div>

      {/* Inquiry Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-medium">{emailThread.customerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{emailThread.customerEmail}</p>
          </div>
          {emailThread.inquiry.companyName && (
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-medium">{emailThread.inquiry.companyName}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              emailThread.inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              emailThread.inquiry.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
              emailThread.inquiry.status === 'quoted' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {emailThread.inquiry.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="font-medium">{formatDate(emailThread.inquiry.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Email Conversation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Email Conversation ({emailThread.emails.length} messages)
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {emailThread.emails.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No emails in this thread yet.</p>
              <p className="text-sm mt-1">Click "Send Reply" to start the conversation.</p>
            </div>
          ) : (
            emailThread.emails.map((email: EmailMessage) => (
              <div key={email.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      email.isFromAdmin 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {email.isFromAdmin ? 'A' : 'C'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {email.isFromAdmin ? 'Admin' : emailThread.customerName}
                      </p>
                      <p className="text-sm text-gray-600">{email.fromEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatDate(email.sentAt)}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {email.emailType}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h3 className="font-medium text-gray-900">Subject: {email.subject}</h3>
                </div>
                
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: email.htmlContent }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Composer Modal */}
      {showComposer && (
        <EmailComposer
          isOpen={showComposer}
          onClose={() => {
            setShowComposer(false);
            refetch(); // Refresh the thread after sending
          }}
          threadId={emailThread?.id} // Pass the thread ID
          inquiry={{
            id: emailThread.inquiry.id,
            customerName: emailThread.inquiry.customerName,
            customerEmail: emailThread.inquiry.customerEmail,
            companyName: emailThread.inquiry.companyName,
            phone: emailThread.inquiry.phone,
            message: emailThread.inquiry.message,
            items: emailThread.inquiry.items,
            createdAt: emailThread.inquiry.createdAt
          }}
        />
      )}
    </div>
  );
}
