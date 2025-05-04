document.addEventListener("DOMContentLoaded", function () {
  const forgotPasswordForm = document.getElementById("forgot-password-form");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");

  forgotPasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous messages
    errorMessage.textContent = "";
    successMessage.textContent = "";

    const username = document.getElementById("username").value;

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset request failed");
      }

      // Show success message
      successMessage.textContent =
        data.message ||
        "Password reset instructions sent! Please check your email.";

      // Clear the form
      forgotPasswordForm.reset();
    } catch (error) {
      console.error("Password reset error:", error);
      errorMessage.textContent =
        error.message || "An error occurred. Please try again.";
    }
  });
});
