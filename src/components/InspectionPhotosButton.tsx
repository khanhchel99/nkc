"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import Image from "next/image";
import { useEffect } from "react";
import { uploadInspectionPhoto } from "@/lib/supabase";

interface InspectionPhotosButtonProps {
  orderId: string;
  itemId: number;
  productName?: string;
  mode?: 'upload' | 'review';
}

export default function InspectionPhotosButton({ 
  orderId, 
  itemId, 
  productName = "Product",
  mode = 'upload' 
}: InspectionPhotosButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reviewMode, setReviewMode] = useState(mode === 'review');
  const [photoReviews, setPhotoReviews] = useState<Record<string, { status: string; reason?: string }>>({});
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Handle escape key to close expanded photo
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedPhoto) {
        setExpandedPhoto(null);
      }
    };

    if (expandedPhoto) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [expandedPhoto]);

  // When modal opens in review mode, ensure we're in review mode
  const openModal = () => {
    setShowModal(true);
    if (mode === 'review') {
      setReviewMode(true);
    }
  };
  
  const { data: inspectionData, refetch } = api.orderManagement.getInspectionDetails.useQuery({
    orderItemId: itemId
  });

  const addPhotoMutation = api.orderManagement.addInspectionPhoto.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedCategory('');
    }
  });

  const deletePhotoMutation = api.orderManagement.deleteInspectionPhoto.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const submitReviewMutation = api.orderManagement.submitPhotoReview.useMutation({
    onSuccess: () => {
      refetch();
      setReviewMode(mode === 'review'); // Reset to initial mode
      setPhotoReviews({});
      setShowModal(false); // Close modal after successful submission
      alert('Photo review submitted successfully!');
    }
  });

  const photoCategories = [
    { value: 'master_box_front', label: 'Master Box - Front' },
    { value: 'master_box_side', label: 'Master Box - Side' },
    { value: 'master_box_top', label: 'Master Box - Top' },
    { value: 'master_box_open', label: 'Master Box - Open' },
    { value: 'product_overall', label: 'Product - Overall' },
    { value: 'product_detail', label: 'Product - Detail' },
    { value: 'defects', label: 'Defects (if any)' },
  ];

  const handleFileUpload = async (file: File) => {
    if (!selectedCategory) {
      alert('Please select a photo category first');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const imageUrl = await uploadInspectionPhoto(
        file,
        orderId,
        itemId,
        selectedCategory
      );
      
      await addPhotoMutation.mutateAsync({
        orderItemId: itemId,
        category: selectedCategory,
        imageUrl,
        caption: `${photoCategories.find(c => c.value === selectedCategory)?.label} - ${productName}`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('unauthorized')) {
          errorMessage = 'Storage configuration error. Please check your Supabase settings.';
        } else if (error.message.includes('bucket')) {
          errorMessage = 'Storage bucket not found. Please check your Supabase storage setup.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoReview = (photoId: string, status: 'approved' | 'rejected', reason?: string) => {
    setPhotoReviews(prev => ({
      ...prev,
      [photoId]: { status, reason }
    }));
  };

  const handleSubmitReview = async () => {
    const photos = inspectionData?.photos || [];
    const reviews = photos.map(photo => ({
      photoId: photo.id,
      status: photoReviews[photo.id]?.status as 'approved' | 'rejected',
      rejectionReason: photoReviews[photo.id]?.reason,
    }));

    // Check if all photos are reviewed
    const allReviewed = reviews.every(review => review.status === 'approved' || review.status === 'rejected');
    if (!allReviewed) {
      alert('Please review all photos before submitting');
      return;
    }

    try {
      await submitReviewMutation.mutateAsync({
        orderItemId: itemId,
        photoReviews: reviews,
      });
    } catch (error) {
      console.error('Review submission failed:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const photosByCategory = inspectionData?.photos?.reduce((acc, photo) => {
    if (!acc[photo.category]) acc[photo.category] = [];
    acc[photo.category]!.push(photo);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const totalPhotos = inspectionData?.photos?.length || 0;
  const approvedPhotos = inspectionData?.photos?.filter(p => p.reviewStatus === 'approved').length || 0;
  const rejectedPhotos = inspectionData?.photos?.filter(p => p.reviewStatus === 'rejected').length || 0;
  const pendingPhotos = inspectionData?.photos?.filter(p => p.reviewStatus === 'pending_review').length || 0;

  // Determine capabilities based on mode
  const canUpload = mode === 'upload';
  const canReview = mode === 'review' || mode === 'upload'; // Admins can also review

  return (
    <>
      <button
        onClick={openModal}
        className={`inline-flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
          rejectedPhotos > 0 
            ? 'bg-red-100 text-red-800 hover:bg-red-200'
            : pendingPhotos > 0
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            : approvedPhotos > 0
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
      >
        📷 {mode === 'review' ? 'Review Photos' : 'Photos'} ({totalPhotos})
        {rejectedPhotos > 0 && <span className="ml-1 text-red-600">❌{rejectedPhotos}</span>}
        {pendingPhotos > 0 && <span className="ml-1 text-yellow-600">⏳{pendingPhotos}</span>}
        {approvedPhotos > 0 && <span className="ml-1 text-green-600">✅{approvedPhotos}</span>}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Inspection Photos - {productName}</h3>
                <div className="flex items-center space-x-4">
                  {canReview && totalPhotos > 0 && mode !== 'review' && (
                    <button
                      onClick={() => setReviewMode(!reviewMode)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        reviewMode 
                          ? 'bg-gray-500 text-white hover:bg-gray-600' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewMode ? 'Cancel Review' : 'Review Photos'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {canUpload && !reviewMode && (
                /* Upload Section */
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photo Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      {photoCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={!selectedCategory || uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    {uploading && (
                      <div className="mt-2 text-sm text-blue-600">Uploading...</div>
                    )}
                  </div>
                </div>
              )}

              {reviewMode && (
                /* Review Mode Header */
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Review Mode</h4>
                  <p className="text-sm text-blue-700">
                    Review each photo below. Select "Approve" or "Reject" for each photo, 
                    and provide a reason for rejection if needed.
                  </p>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm">
                      Progress: {Object.keys(photoReviews).length} / {totalPhotos} photos reviewed
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={submitReviewMutation.isPending || Object.keys(photoReviews).length !== totalPhotos}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Gallery */}
              <div>
                {totalPhotos === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {mode === 'review' ? 'No photos available for review' : 'No photos uploaded yet'}
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">
                      All Photos ({totalPhotos})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                      {inspectionData?.photos?.map((photo) => (
                        <div key={photo.id} className="relative group">
                          {/* Image Container */}
                          <div 
                            className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setExpandedPhoto(photo.id)}
                          >
                            <Image
                              src={photo.imageUrl}
                              alt={photo.caption || 'Inspection photo'}
                              fill
                              className="object-cover hover:scale-105 transition-transform"
                              onError={(e) => {
                                const canvas = document.createElement('canvas');
                                canvas.width = 400;
                                canvas.height = 300;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.fillStyle = '#f3f4f6';
                                  ctx.fillRect(0, 0, 400, 300);
                                  ctx.fillStyle = '#6b7280';
                                  ctx.font = '16px Arial';
                                  ctx.textAlign = 'center';
                                  ctx.fillText('Image Error', 200, 150);
                                  e.currentTarget.src = canvas.toDataURL();
                                }
                              }}
                              unoptimized
                            />
                            
                            {/* CATEGORY BADGE REMOVED - UPDATED VERSION */}
                            
                            {/* Review Status Badge */}
                            <div className="absolute top-2 right-2">
                              {photo.reviewStatus === 'approved' && (
                                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">✅</span>
                              )}
                              {photo.reviewStatus === 'rejected' && (
                                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">❌</span>
                              )}
                              {photo.reviewStatus === 'pending_review' && (
                                <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">⏳</span>
                              )}
                            </div>

                            {/* Delete button for admins */}
                            {canUpload && !reviewMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePhotoMutation.mutate({ photoId: photo.id });
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs z-10"
                              >
                                ×
                              </button>
                            )}

                            {/* Expand Icon */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-black bg-opacity-70 text-white p-1 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Review Controls - positioned below image */}
                          {reviewMode && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                              <div className="text-sm font-medium text-blue-900 mb-2">Review this photo:</div>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handlePhotoReview(photo.id, 'approved');
                                    }}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                      photoReviews[photo.id]?.status === 'approved'
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                    }`}
                                  >
                                    ✅ Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handlePhotoReview(photo.id, 'rejected');
                                    }}
                                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                      photoReviews[photo.id]?.status === 'rejected'
                                        ? 'bg-red-600 text-white shadow-md'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                                    }`}
                                  >
                                    ❌ Reject
                                  </button>
                                </div>
                                {photoReviews[photo.id]?.status === 'rejected' && (
                                  <textarea
                                    placeholder="Reason for rejection..."
                                    value={photoReviews[photo.id]?.reason || ''}
                                    onChange={(e) => handlePhotoReview(photo.id, 'rejected', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={2}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Photo Caption */}
                          {photo.caption && (
                            <p className="text-xs text-gray-500 mt-2 truncate">
                              {photo.caption}
                            </p>
                          )}
                          
                          {/* Rejection Reason */}
                          {photo.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                              Rejected: {photo.rejectionReason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Photo Modal */}
              {expandedPhoto && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[20000] p-4"
                  onClick={() => setExpandedPhoto(null)} // Close when clicking outside
                >
                  <div 
                    className="relative max-w-[90vw] max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
                  >
                    {(() => {
                      const photo = inspectionData?.photos?.find(p => p.id === expandedPhoto);
                      if (!photo) return null;
                      return (
                        <>
                          <Image
                            src={photo.imageUrl}
                            alt={photo.caption || 'Inspection photo'}
                            width={800}
                            height={600}
                            className="object-contain max-w-full max-h-full"
                            unoptimized
                          />
                          {/* Improved close button */}
                          <button
                            onClick={() => setExpandedPhoto(null)}
                            className="absolute top-4 right-4 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all duration-200 border-2 border-white border-opacity-30 hover:border-opacity-60"
                          >
                            ×
                          </button>
                          {/* More transparent description area */}
                          <div className="absolute bottom-4 left-4 bg-black bg-opacity-40 text-white p-3 rounded backdrop-blur-sm">
                            <div className="font-medium">{photo.category.replace('_', ' ')}</div>
                            {photo.caption && <div className="text-sm opacity-90">{photo.caption}</div>}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
