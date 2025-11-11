import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE") {
      setError("Please type 'DELETE' to confirm account deletion");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("🗑️ Initiating account deletion for user:", user?.username);

      const response = await userService.deleteAccount();

      console.log("✅ Account deletion response:", response);

      if (response.success) {
        console.log("✅ Account successfully deleted, logging out user");

        // Show success notification
        alert(
          response.message || "Your account has been successfully deleted."
        );

        // Logout the user after successful deletion
        await logout();

        // Redirect to login page with success message
        navigate("/login", {
          state: {
            message:
              response.message ||
              "Your account has been successfully deleted. We're sorry to see you go.",
            type: "success",
          },
          replace: true,
        });
      } else {
        console.error("❌ Account deletion failed:", response.message);
        setError(response.message || "Failed to delete account");
      }
    } catch (err) {
      console.error("❌ Delete account error:", err);

      // Handle specific error scenarios
      if (err.response?.status === 401) {
        // Session expired - show error without redirecting
        setError(
          "Your session has expired. Please refresh this page and try again, or login again if needed."
        );
        // Optionally: Auto-logout to clear invalid token
        setTimeout(() => {
          logout();
        }, 3000);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Account is already deleted");
      } else if (err.response?.status === 404) {
        setError("Account not found. Please contact support.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to delete account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl shadow-gray-900/10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Delete Account</h2>
          <p className="text-gray-600 mt-2">
            This action cannot be undone. Your account will be permanently
            deleted.
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Logged in as: <strong>{user.username}</strong>
            </p>
          )}
        </div>

        {/* Warning Section */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Warning: This action is permanent
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>All your prayer tracking data will be lost</li>
                  <li>You will lose access to all meetings and activities</li>
                  <li>Your account cannot be recovered</li>
                  <li>This action affects your membership status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Section */}
        {!showConfirmation ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              If you're sure you want to delete your account, click the button
              below to proceed.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(true)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete My Account
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="confirmation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                id="confirmation"
                type="text"
                value={confirmationText}
                onChange={(e) =>
                  setConfirmationText(e.target.value.toUpperCase())
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-mono text-lg"
                placeholder="DELETE"
                maxLength="6"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                {error.includes("session has expired") && (
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login", {
                        state: {
                          message: "Please login again to delete your account",
                          returnUrl: "/delete-account",
                        },
                      });
                    }}
                    className="mt-2 text-sm underline hover:text-red-800"
                  >
                    Click here to login again
                  </button>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading || confirmationText !== "DELETE"}
                className={`flex-1 py-2 px-4 rounded-md text-white font-medium transition-colors ${
                  loading || confirmationText !== "DELETE"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                    Deleting...
                  </div>
                ) : (
                  "Confirm Deletion"
                )}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Need help? Contact support before deleting your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;
