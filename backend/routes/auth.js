const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const loginValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("username").notEmpty().withMessage("Username is required"),
];

// Routes
router.post("/login", loginValidation, authController.login);
router.post("/logout", isAuthenticated, authController.logout);
router.get("/me", isAuthenticated, authController.getCurrentUser);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  authController.resetPassword
);

module.exports = router;
