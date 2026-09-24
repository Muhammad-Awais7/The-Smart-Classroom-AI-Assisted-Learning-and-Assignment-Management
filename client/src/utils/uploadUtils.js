import axios from "axios";

// ⚠️ REPLACE WITH YOUR ACTUAL CLOUDINARY KEYS
const CLOUD_NAME = "erjclmad"; 
const UPLOAD_PRESET = "smartclassroom"; 

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  
  // NOTE: removed 'use_filename' to prevent 400 Bad Request error
  
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      formData
    );
    return {
      url: response.data.secure_url,
      fileName: file.name // Pass real name back to save in DB
    };
  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw new Error("Upload Failed");
  }
};