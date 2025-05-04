document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");

  // Show initial status
  console.log("Login form script loaded");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear any previous error messages
    errorMessage.textContent = "";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("Attempting login for user:", username);

    try {
      // Build the API URL using the current origin
      const apiUrl = window.location.origin + "/api/auth/login";
      console.log("Sending request to:", apiUrl);

      // Show details of what we're sending
      console.log("Request payload:", { username, password: "***" });

      // Open the request with more detailed error handling
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important for cookies/sessions
      }).catch((fetchError) => {
        console.error("Fetch error details:", fetchError);
        throw new Error(
          "Network error: Unable to connect to the server. Please check if the server is running."
        );
      });

      console.log("Response received:", response.status, response.statusText);

      // Try to parse the response as JSON with error handling
      let data;
      try {
        const responseText = await response.text();
        console.log("Raw response:", responseText);

        // Try to parse as JSON
        try {
          data = JSON.parse(responseText);
          console.log("Parsed response data:", data);
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          throw new Error("Error processing server response (invalid JSON)");
        }
      } catch (textError) {
        console.error("Error getting response text:", textError);
        throw new Error("Error processing server response");
      }

      if (!response.ok) {
        // Handle login failure
        throw new Error(
          data?.message || "Login failed with status: " + response.status
        );
      }

      // Handle successful login
      console.log("Login successful!", data);

      // Redirect based on role
      console.log("User role:", data.user.role);

      switch (data.user.role) {
        case "SuperAdmin":
          window.location.href = "/admin/dashboard.html";
          break;
        case "Founder":
          window.location.href = "/founder/dashboard.html";
          break;
        case "Member":
          window.location.href = "/member/dashboard.html";
          break;
        default:
          // Default dashboard if role is not recognized
          console.log("Unknown role, using default dashboard");
          window.location.href = "/dashboard.html";
      }
    } catch (error) {
      console.error("Login error:", error);
      errorMessage.textContent =
        error.message || "An error occurred during login. Please try again.";
      // Display the error message prominently
      errorMessage.style.padding = "10px";
      errorMessage.style.backgroundColor = "#ffeeee";
      errorMessage.style.border = "1px solid #ff0000";
      errorMessage.style.borderRadius = "5px";
      errorMessage.style.marginBottom = "15px";
    }
  });
});
