const User = require("../models/user");

/**
 * Middleware to check if a user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized. Please log in." });
};

/**
 * Middleware to check if a user has a specific role
 * @param {string|string[]} roles - Role or array of roles allowed to access the route
 */
const hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized. Please log in." });
      }

      // Get user details from database to verify role
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found." });
      }

      // Check if user has the required role
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      if (requiredRoles.includes(user.role)) {
        // Add user to the request object for use in route handlers
        req.user = user;
        return next();
      }

      return res.status(403).json({
        message:
          "Forbidden. You do not have permission to access this resource.",
      });
    } catch (error) {
      console.error("Error in role-based authorization middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

/**
 * Add the current user to the request object if they are logged in
 */
const loadUser = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error("Error loading user:", error);
    next();
  }
};

module.exports = {
  isAuthenticated,
  hasRole,
  loadUser,
};
