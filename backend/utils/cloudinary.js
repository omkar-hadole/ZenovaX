const { v2: cloudinary } = require("cloudinary");
const config = require("../config");

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    console.warn("WARNING: Cloudinary environment variables are missing!");
}

const uploadToCloudinary = (fileBuffer, filename = "") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "zenovax/profiles",
                resource_type: "image",
                public_id: filename ? filename.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_") : undefined,
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                return resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

module.exports = { cloudinary, uploadToCloudinary };





