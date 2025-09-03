import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";

// Generate the upload components with your backend URL
const getUploadThingUrl = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
  return `${backendUrl}/api/uploadthing`;
};

export const UploadButton = generateUploadButton({
  url: getUploadThingUrl(),
});

export const UploadDropzone = generateUploadDropzone({
  url: getUploadThingUrl(),
});

export const { useUploadThing, uploadFiles } = generateReactHelpers({
  url: getUploadThingUrl(),
});
