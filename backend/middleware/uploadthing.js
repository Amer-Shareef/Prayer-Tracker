const { createUploadthing } = require("uploadthing/express");

const f = createUploadthing();

const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      console.log("🔐 UploadThing middleware - checking authorization");
      
      // You can add authentication here if needed
      // For now, we'll allow uploads but you can add JWT validation
      
      return { userId: "anonymous" }; // Return any data you want to use in onUploadComplete
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("📁 Upload completed", {
        userId: metadata.userId,
        file: {
          name: file.name,
          size: file.size,
          url: file.url,
          key: file.key,
        },
      });
      
      // This code RUNS ON YOUR SERVER after upload
      // Return anything you want to the client
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
        size: file.size,
        key: file.key
      };
    }),
};

module.exports = { uploadRouter };
