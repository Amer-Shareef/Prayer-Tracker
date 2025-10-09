import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FounderLayout from "../../components/layouts/FounderLayout";
import feedsService from "../../services/feedsService";
import { uploadFiles } from "../../utils/uploadthing";
import { useAuth } from "../../context/AuthContext";
import { areaService } from "../../services/api";

const PostFeeds = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get editId from URL params if available
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("edit")
    ? parseInt(queryParams.get("edit"))
    : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    video_url: "",
    sendNotification: false,
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeeds, setTotalFeeds] = useState(0);
  const [pagination, setPagination] = useState({});

  // Add date and area state
  const [currentDate, setCurrentDate] = useState({
    gregorian: "Loading...",
    hijri: "Loading...",
  });
  const [areaName, setAreaName] = useState("Loading...");

  // Fetch current date
  useEffect(() => {
    const today = new Date();

    const gregorianDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let hijriDate;
    try {
      hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(today);
    } catch (error) {
      hijriDate = "Hijri date not supported";
    }

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate,
    });
  }, []);

  // Fetch user area name
  useEffect(() => {
    const fetchUserArea = async () => {
      if (user?.areaId || user?.area_id) {
        try {
          const response = await areaService.getAreaStats(
            user.areaId || user.area_id
          );
          if (response.data.success) {
            setAreaName(response.data.data.area.name || "Area");
          }
        } catch (error) {
          console.error("Error fetching area:", error);
          setAreaName("Area");
        }
      }
    };

    if (user) {
      fetchUserArea();
    }
  }, [user]);

  // Helper function to extract YouTube video ID and generate thumbnail
  const getYouTubeThumbnail = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return "";
  };

  // Helper function to clear image data
  const clearImageData = () => {
    setUploadedImageUrl("");
    setSelectedFile(null);
    setSelectedImageFile(null);
    setFormData((prev) => ({
      ...prev,
      image_url: "",
    }));
  };

  // Helper function to clear video data
  const clearVideoData = () => {
    setVideoThumbnail("");
    setFormData((prev) => ({
      ...prev,
      video_url: "",
    }));
  };

  // Handle image file selection (preview only)
  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show alert if video URL exists
      if (formData.video_url.trim()) {
        const confirmed = window.confirm(
          "You have a video URL entered. Selecting an image will remove the video URL. Do you want to continue?"
        );
        if (!confirmed) {
          e.target.value = ""; // Clear the file input
          return;
        }
      }

      // Clear video data
      clearVideoData();

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedImageFile(file);
      setUploadedImageUrl(previewUrl);
    }
  };

  // Fetch feeds from API with pagination
  const fetchFeeds = async (page = 1) => {
    try {
      setLoading(true);
      setApiError("");

      // Use getFeeds which supports pagination (limit of 5)
      const response = await feedsService.getFeeds({
        page: page,
        limit: 15, // #Change for Production
      });

      if (response.success) {
        setFeeds(response.data);
        setPagination(response.pagination);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotalFeeds(response.pagination.total);
      } else {
        setApiError(response.message || "Failed to fetch feeds");
      }
    } catch (error) {
      console.error("Error fetching feeds:", error);
      setApiError(error.message || "Failed to fetch feeds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test UploadThing endpoint
    const testEndpoint = async () => {
      try {
        const backendUrl =
          process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/uploadthing`);
        console.log(
          "🧪 UploadThing endpoint test:",
          response.status,
          response.statusText
        );
      } catch (error) {
        console.error("🧪 UploadThing endpoint error:", error);
      }
    };
    testEndpoint();

    // Fetch feeds from API
    fetchFeeds(1); // Start with page 1

    // Check if we're in edit mode
    if (editId) {
      const loadFeed = async () => {
        try {
          const response = await feedsService.getFeedById(editId);
          if (response.success) {
            setFormData({
              title: response.data.title,
              content: response.data.content,
              image_url: response.data.image_url || "",
              video_url: response.data.video_url || "",
              sendNotification: response.data.send_notification === 1,
            });
            setUploadedImageUrl(response.data.image_url || "");

            // Generate video thumbnail if video URL exists
            if (response.data.video_url) {
              const thumbnail = getYouTubeThumbnail(response.data.video_url);
              setVideoThumbnail(thumbnail);
            }

            setIsEditing(true);
            setShowModal(true);
          }
        } catch (error) {
          console.error("Error loading feed:", error);
        }
      };

      loadFeed();
    }
  }, [editId]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Feed title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Feed content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "video_url") {
      // Show alert if image is selected
      if (value.trim() && (uploadedImageUrl || selectedImageFile)) {
        const confirmed = window.confirm(
          "You have an image selected. Entering a video URL will remove the selected image. Do you want to continue?"
        );
        if (!confirmed) {
          return;
        }
      }

      // Clear image data when video URL is entered
      if (value.trim()) {
        clearImageData();
        // Generate YouTube thumbnail
        const thumbnail = getYouTubeThumbnail(value);
        setVideoThumbnail(thumbnail);
      } else {
        setVideoThumbnail("");
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Remove uploaded image
  const removeUploadedImage = () => {
    clearImageData();
    // Clear the file input if it exists
    const fileInput = document.getElementById("imageFileInput");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Generate filename with ddmmyy_timestamp format
  const generateFileName = (originalFile) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const timestamp = now.getTime();

    // Get file extension
    const extension = originalFile.name.split(".").pop() || "png";

    return `${day}${month}${year}_${timestamp}.${extension}`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      let imageUrl = formData.image_url;

      // Upload selected image file to UploadThing if there's one
      if (selectedImageFile && !imageUrl) {
        console.log("📤 Uploading selected image to UploadThing...");
        setUploadingImage(true);

        try {
          // Generate new filename
          const newFileName = generateFileName(selectedImageFile);

          // Create a new file with the new name
          const renamedFile = new File([selectedImageFile], newFileName, {
            type: selectedImageFile.type,
          });

          console.log("📤 Uploading file:", newFileName);

          // Use the proper UploadThing helper function
          const uploadResult = await uploadFiles("imageUploader", {
            files: [renamedFile],
          });

          console.log("📤 UploadThing result:", uploadResult);

          if (uploadResult && uploadResult.length > 0 && uploadResult[0].url) {
            imageUrl = uploadResult[0].url;
            console.log(
              "✅ File uploaded successfully with new name:",
              newFileName
            );
            console.log("✅ Upload URL:", imageUrl);
          } else {
            throw new Error("Upload failed: No URL returned");
          }
        } catch (uploadError) {
          console.error("❌ Upload failed:", uploadError);
          setApiError("Failed to upload image: " + uploadError.message);
          setLoading(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const dataToSend = {
        title: formData.title,
        content: formData.content,
        image_url: imageUrl,
        video_url: formData.video_url,
        send_notification: formData.sendNotification,
      };

      let response;

      if (isEditing) {
        // Update feed
        response = await feedsService.updateFeed(editId, dataToSend);
        setSuccessMessage("Feed updated successfully!");
      } else {
        // Create new feed
        response = await feedsService.createFeed(dataToSend);
        setSuccessMessage("Feed created successfully!");
      }

      if (response.success) {
        // Reset form
        setFormData({
          title: "",
          content: "",
          image_url: "",
          video_url: "",
          sendNotification: false,
        });

        // Reset upload states
        setUploadedImageUrl("");
        setSelectedFile(null);
        setSelectedImageFile(null);
        setVideoThumbnail("");
        setUploadingImage(false);

        // Clear file input
        const fileInput = document.getElementById("imageFileInput");
        if (fileInput) {
          fileInput.value = "";
        }

        setIsEditing(false);
        setSuccess(true);
        setShowModal(false);

        // Refresh feeds list
        fetchFeeds(currentPage);

        // Reset URL parameter if we were editing
        if (editId) {
          navigate("/founder/reminder");
        }

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setApiError(response.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving feed:", error);
      setApiError(error.message || "Failed to save feed");
    } finally {
      setLoading(false);
    }
  };

  // Handle feed deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feed?")) {
      try {
        setLoading(true);

        const response = await feedsService.deleteFeed(id);

        if (response.success) {
          // Refresh feeds list
          fetchFeeds(currentPage);

          if (editId === id) {
            // Reset form and navigate back if we were editing the deleted feed
            setFormData({
              title: "",
              content: "",
              image_url: "",
              video_url: "",
              sendNotification: false,
            });
            setUploadedImageUrl("");
            setSelectedFile(null);
            setSelectedImageFile(null);
            setVideoThumbnail("");
            setUploadingImage(false);

            // Clear file input
            const fileInput = document.getElementById("imageFileInput");
            if (fileInput) {
              fileInput.value = "";
            }

            setIsEditing(false);
            setShowModal(false);
            navigate("/founder/reminder");
          }

          setSuccessMessage("Feed deleted successfully!");
          setSuccess(true);

          // Hide success message after 3 seconds
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } else {
          setApiError(response.message || "Failed to delete feed");
        }
      } catch (error) {
        console.error("Error deleting feed:", error);
        setApiError(error.message || "Failed to delete feed");
      } finally {
        setLoading(false);
      }
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination functions
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchFeeds(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Daily Reminders</h2>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                title: "",
                content: "",
                image_url: "",
                video_url: "",
                sendNotification: false,
              });
              setUploadedImageUrl("");
              setSelectedFile(null);
              setSelectedImageFile(null);
              setVideoThumbnail("");
              const fileInput = document.getElementById("imageFileInput");
              if (fileInput) {
                fileInput.value = "";
              }
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Feed
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* API Error message */}
        {apiError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{apiError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feed List */}
        <div className="bg-white rounded-lg shadow">
          {/* Feed List */}
          {loading && !feeds.length ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading feeds...</p>
            </div>
          ) : feeds.length === 0 ? (
            <div className="p-12 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500 text-lg">No feeds yet</p>
              <p className="mt-2 text-gray-400 text-sm">
                Create your first feed to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex flex-col min-h-[750px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Media
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Feed
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feeds.map((feed) => (
                    <tr key={feed.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {feed.video_url ? (
                          <a
                            href={feed.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group relative"
                            title="Click to watch video"
                          >
                            <img
                              src={getYouTubeThumbnail(feed.video_url)}
                              alt="Video thumbnail"
                              className="w-28 h-20 object-cover rounded-lg border-[3px] border-red-500 group-hover:border-red-600 transition-all shadow-sm"
                            />
                          </a>
                        ) : feed.image_url ? (
                          <img
                            src={feed.image_url}
                            alt="Feed image"
                            className="w-28 h-20 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                          />
                        ) : (
                          <div className="w-28 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                            <svg
                              className="w-8 h-8 text-gray-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {feed.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate mt-1">
                          {feed.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(feed.created_at || feed.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setFormData({
                              title: feed.title,
                              content: feed.content,
                              image_url: feed.image_url || "",
                              video_url: feed.video_url || "",
                              sendNotification: feed.send_notification === 1,
                            });
                            setUploadedImageUrl(feed.image_url || "");
                            setSelectedFile(null);
                            setSelectedImageFile(null);

                            const fileInput =
                              document.getElementById("imageFileInput");
                            if (fileInput) {
                              fileInput.value = "";
                            }

                            if (feed.video_url) {
                              const thumbnail = getYouTubeThumbnail(
                                feed.video_url
                              );
                              setVideoThumbnail(thumbnail);
                            } else {
                              setVideoThumbnail("");
                            }

                            setUploadingImage(false);
                            navigate(`/founder/reminder?edit=${feed.id}`);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(feed.id)}
                          className="inline-flex items-center text-red-600 hover:text-red-900"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {totalFeeds} total
                    feeds
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      Previous
                    </button>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal for Create/Edit Feed */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Edit Feed" : "Create Feed"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    if (editId) {
                      navigate("/founder/reminder");
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                <form onSubmit={handleSubmit}>
                  {/* Feed Title */}
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="title"
                    >
                      Feed Title*
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter feed title"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Feed Content */}
                  <div className="mb-6">
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="content"
                    >
                      Feed Content*
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows="6"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.content ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter feed content"
                    ></textarea>
                    {errors.content && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.content}
                      </p>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-3">
                      Upload Image (Optional)
                    </label>

                    {uploadedImageUrl || formData.image_url ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={uploadedImageUrl || formData.image_url}
                            alt="Feed image"
                            className="max-w-xs h-40 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeUploadedImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={removeUploadedImage}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Upload different image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-full border-2 border-dashed border-gray-300 rounded-lg py-12 px-8 text-center">
                          <div className="space-y-4">
                            <svg
                              className="w-16 h-16 text-gray-400 mx-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <div>
                              <label
                                htmlFor="imageFileInput"
                                className="text-gray-700 text-lg font-medium block mb-2"
                              >
                                Choose Image File
                              </label>
                              <p className="text-gray-500 text-sm mb-4">
                                Select an image to preview (will upload when you
                                publish)
                              </p>
                              <input
                                id="imageFileInput"
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileSelect}
                                disabled={uploadingImage || loading}
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-3 file:px-6
                                  file:rounded-lg file:border-0
                                  file:text-sm file:font-medium
                                  file:bg-green-500 file:text-white
                                  hover:file:bg-green-600
                                  file:cursor-pointer cursor-pointer
                                  disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      Select an image to preview. It will be uploaded when you
                      publish the feed.
                    </p>
                  </div>

                  {/* Video URL */}
                  <div className="mb-6">
                    <label
                      className="block text-gray-700 font-medium mb-2"
                      htmlFor="video_url"
                    >
                      Video URL (Optional)
                    </label>

                    {videoThumbnail && (
                      <div className="mb-3">
                        <div className="relative inline-block">
                          <img
                            src={videoThumbnail}
                            alt="Video thumbnail"
                            className="max-w-xs h-40 object-cover rounded-lg border border-gray-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                            <svg
                              className="w-12 h-12 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="url"
                        id="video_url"
                        name="video_url"
                        value={formData.video_url}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add a YouTube or video URL to embed with your feed.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setIsEditing(false);
                        if (editId) {
                          navigate("/founder/reminder");
                        }
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      disabled={loading}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || uploadingImage}
                    >
                      {loading || uploadingImage ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {uploadingImage
                            ? "Uploading Image..."
                            : isEditing
                            ? "Updating..."
                            : "Publishing..."}
                        </span>
                      ) : isEditing ? (
                        "Update Feed"
                      ) : (
                        "Publish Feed"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default PostFeeds;
