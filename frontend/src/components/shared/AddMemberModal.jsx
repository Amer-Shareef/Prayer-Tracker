import React, { useState, useEffect } from "react";
import { memberAPI } from "../../services/api";
import { areaService } from "../../services/areaService";
import { useAuth } from "../../context/AuthContext";

const AddMemberModal = ({ isOpen, onClose, onMemberAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingSubAreas, setLoadingSubAreas] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Member",
    dateOfBirth: "",
    address: "",
    area_id: "",
    subarea_id: "",
    onRent: false,
    zakathEligible: false,
    differentlyAbled: false,
    mobility: "",
    otherSpecify: "",
    MuallafathilQuloob: false,
    placeOfBirth: "",
    nicNo: "",
    occupation: "",
    workplaceAddress: "",
    familyStatus: "",
    widowAssistance: false,
  });

  // Fetch areas on mount
  useEffect(() => {
    if (isOpen) {
      fetchAreas();
    }
  }, [isOpen]);

  const fetchAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await areaService.getAllAreas();
      if (response.success) {
        setAreas(response.data);
      }
    } catch (err) {
      console.error("Error fetching areas:", err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchSubAreas = async (areaId) => {
    if (!areaId) {
      setSubAreas([]);
      return;
    }

    try {
      setLoadingSubAreas(true);
      const response = await areaService.getSubAreas(areaId);
      if (response.success) {
        setSubAreas(response.data.subAreas || []);
      } else {
        setSubAreas([]);
      }
    } catch (err) {
      console.error("Error fetching sub-areas:", err);
      setSubAreas([]);
    } finally {
      setLoadingSubAreas(false);
    }
  };

  const getAllowedRoles = () => {
    if (!user) return [];

    switch (user.role) {
      case "SuperAdmin":
        return [
          { value: "Member", label: "Member" },
          { value: "WCM", label: "Working Committee Member" },
          { value: "Founder", label: "Working Committee Admin" },
          { value: "SuperAdmin", label: "Super Admin" },
        ];
      case "Founder":
      case "WCM":
        return [
          { value: "Member", label: "Member" },
          { value: "WCM", label: "Working Committee Member" },
          { value: "Founder", label: "Working Committee Admin" },
        ];
      default:
        return [{ value: "Member", label: "Member" }];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "area_id") {
      setFormData({
        ...formData,
        [name]: value,
        subarea_id: "",
      });

      if (value) {
        fetchSubAreas(value);
      } else {
        setSubAreas([]);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (error) setError("");
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 9) {
      value = value.substring(0, 9);
    }

    const formattedPhone = value ? `+94${value}` : "";

    setFormData({
      ...formData,
      phone: formattedPhone,
    });

    if (error) setError("");
  };

  const validateForm = () => {
    if (
      !formData.fullName ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      setError(
        "Full name, username, email, phone number, and password are required"
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    const phoneRegex = /^\+94\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError(
        "Phone number is required and must be exactly 9 digits after +94"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await memberAPI.addMember(formData);

      if (response.success) {
        // Reset form
        setFormData({
          fullName: "",
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "Member",
          dateOfBirth: "",
          address: "",
          area_id: "",
          subarea_id: "",
          onRent: false,
          zakathEligible: false,
          differentlyAbled: false,
          mobility: "",
          otherSpecify: "",
          MuallafathilQuloob: false,
          placeOfBirth: "",
          nicNo: "",
          occupation: "",
          workplaceAddress: "",
          familyStatus: "",
          widowAssistance: false,
        });
        setCurrentStep(1);
        onMemberAdded();
        onClose();
      } else {
        setError(response.message || "Failed to add member");
      }
    } catch (err) {
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to add member. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "Member",
        dateOfBirth: "",
        address: "",
        area_id: "",
        subarea_id: "",
        onRent: false,
        zakathEligible: false,
        differentlyAbled: false,
        mobility: "",
        otherSpecify: "",
        MuallafathilQuloob: false,
        placeOfBirth: "",
        nicNo: "",
        occupation: "",
        workplaceAddress: "",
        familyStatus: "",
        widowAssistance: false,
      });
      setCurrentStep(1);
      setError("");
      onClose();
    }
  };

  const nextStep = () => {
    // Validate step 1 fields
    if (currentStep === 1) {
      if (
        !formData.fullName ||
        !formData.username ||
        !formData.email ||
        !formData.phone
      ) {
        setError("Please fill in all required fields in Step 1");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }

      const phoneRegex = /^\+94\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError("Phone number must be exactly 9 digits after +94");
        return;
      }
    }

    // No validation needed for step 2 (location info is optional)

    setError("");
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        ></div>

        {/* Center modal */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="text-lg font-semibold text-white"
                  id="modal-title"
                >
                  Add New Member
                </h3>
                <p className="text-sm text-green-100 mt-1">
                  Step {currentStep} of 3
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-white hover:text-gray-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      step <= currentStep ? "bg-white" : "bg-green-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Modal content */}
            <div className="bg-white px-6 py-6 max-h-[60vh] overflow-y-auto">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Basic Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter username"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="email@example.com"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-700 text-sm">+94</span>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone.replace("+94", "")}
                          onChange={handlePhoneChange}
                          className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="7XXXXXXXX"
                          maxLength="9"
                          required
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* NIC No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIC Number
                      </label>
                      <input
                        type="text"
                        name="nicNo"
                        value={formData.nicNo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter NIC number"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {getAllowedRoles().map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Occupation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupation
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter occupation"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Password */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Location Information
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Place of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        name="placeOfBirth"
                        value={formData.placeOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter place of birth"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter residential address"
                      />
                    </div>

                    {/* Workplace Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workplace Address
                      </label>
                      <textarea
                        name="workplaceAddress"
                        value={formData.workplaceAddress}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter workplace or business address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area
                        </label>
                        <select
                          name="area_id"
                          value={formData.area_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select area</option>
                          {loadingAreas ? (
                            <option value="">Loading...</option>
                          ) : (
                            areas.map((area) => (
                              <option key={area.area_id} value={area.area_id}>
                                {area.area_name || `Area ${area.area_id}`}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Sub-area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sub-area
                        </label>
                        <select
                          name="subarea_id"
                          value={formData.subarea_id}
                          onChange={handleInputChange}
                          disabled={!formData.area_id || loadingSubAreas}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">
                            {!formData.area_id
                              ? "Select area first"
                              : loadingSubAreas
                              ? "Loading..."
                              : "Select sub-area"}
                          </option>
                          {!loadingSubAreas &&
                            subAreas.map((subArea) => (
                              <option key={subArea.id} value={subArea.id}>
                                {subArea.address}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Mobility */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobility
                        </label>
                        <select
                          name="mobility"
                          value={formData.mobility}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select option</option>
                          <option value="Walking">Walking</option>
                          <option value="Bicycle">Bicycle</option>
                          <option value="Motorbike">Motorbike</option>
                          <option value="Car">Car</option>
                          <option value="Public Transport">
                            Public Transport
                          </option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Family Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Family Status
                        </label>
                        <select
                          name="familyStatus"
                          value={formData.familyStatus}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select status</option>
                          <option value="Joint Living">Joint Living</option>
                          <option value="Widow">Widow</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Separated">Separated</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {formData.mobility === "Other" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Specify Other Mobility
                        </label>
                        <input
                          type="text"
                          name="otherSpecify"
                          value={formData.otherSpecify}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Please specify"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Additional Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Additional Information & Security
                  </h4>

                  <div className="space-y-4">
                    {/* Password Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-800 mb-3">
                        Account Security
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Min 6 characters"
                              required
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={
                                    showPassword
                                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  }
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Confirm password"
                              required
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={
                                    showConfirmPassword
                                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  }
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info Checkboxes */}
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-3">
                        Special Categories
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formData.familyStatus === "Widow" && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="widowAssistance"
                              name="widowAssistance"
                              checked={formData.widowAssistance}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  widowAssistance: e.target.checked,
                                })
                              }
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor="widowAssistance"
                              className="ml-2 text-sm text-gray-700"
                            >
                              Receiving Widow Assistance
                            </label>
                          </div>
                        )}

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="onRent"
                            name="onRent"
                            checked={formData.onRent}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                onRent: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="onRent"
                            className="ml-2 text-sm text-gray-700"
                          >
                            Living on Rent
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="zakathEligible"
                            name="zakathEligible"
                            checked={formData.zakathEligible}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                zakathEligible: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="zakathEligible"
                            className="ml-2 text-sm text-gray-700"
                          >
                            Zakath Eligible
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="differentlyAbled"
                            name="differentlyAbled"
                            checked={formData.differentlyAbled}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                differentlyAbled: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="differentlyAbled"
                            className="ml-2 text-sm text-gray-700"
                          >
                            Differently Abled
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="MuallafathilQuloob"
                            name="MuallafathilQuloob"
                            checked={formData.MuallafathilQuloob}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                MuallafathilQuloob: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="MuallafathilQuloob"
                            className="ml-2 text-sm text-gray-700"
                          >
                            Muallafathil Quloob (Convert)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    ← Previous
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
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
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Add Member
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
