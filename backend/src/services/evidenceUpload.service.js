const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const uploadEvidenceToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "shield/emergency-evidence",
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          mediaType: resourceType,
          uploadedAt: new Date(),
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

module.exports = { uploadEvidenceToCloudinary };