// src/services/imgbb.service.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'a4f5c180c07ea3daa980fcfb759c35a7';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload image file to ImgBB
 * @param {string|Buffer} imageData - File path, Buffer, or base64 string
 * @param {string} name - Name for the image
 * @param {number} expiration - Expiration time in seconds (optional)
 * @returns {Promise<Object>} Upload response
 */
const uploadToImgBB = async (imageData, name = 'product-image', expiration = null) => {
    try {
        if (!IMGBB_API_KEY) {
            throw new Error('IMGBB_API_KEY is not set in environment variables');
        }

        let base64Image;

        // If it's a file path, read the file
        if (typeof imageData === 'string' && fs.existsSync(imageData)) {
            const fileBuffer = fs.readFileSync(imageData);
            base64Image = fileBuffer.toString('base64');
        }
        // If it's a Buffer
        else if (Buffer.isBuffer(imageData)) {
            base64Image = imageData.toString('base64');
        }
        // If it's already base64 or data URL
        else if (typeof imageData === 'string') {
            if (imageData.startsWith('data:image')) {
                // Extract base64 from data URL
                base64Image = imageData.split(',')[1];
            } else if (imageData.startsWith('/uploads') || imageData.startsWith('uploads')) {
                // It's a relative path - try to read the file
                const filePath = path.join(__dirname, '../../', imageData);
                if (fs.existsSync(filePath)) {
                    const fileBuffer = fs.readFileSync(filePath);
                    base64Image = fileBuffer.toString('base64');
                } else {
                    throw new Error(`File not found: ${filePath}`);
                }
            } else {
                // Assume it's a base64 string
                base64Image = imageData;
            }
        } else {
            throw new Error('Invalid image data format. Provide file path, Buffer, or base64 string.');
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Image);
        formData.append('name', name);

        if (expiration && expiration > 0) {
            formData.append('expiration', expiration);
        }

        // Upload to ImgBB
        const response = await axios.post(IMGBB_API_URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000 // 30 seconds
        });

        if (response.data && response.data.success) {
            return {
                success: true,
                url: response.data.data.url,
                displayUrl: response.data.data.display_url,
                thumbUrl: response.data.data.thumb?.url,
                mediumUrl: response.data.data.medium?.url,
                deleteUrl: response.data.data.delete_url,
                filename: response.data.data.image?.filename,
                id: response.data.data.id,
                width: response.data.data.width,
                height: response.data.data.height,
                size: response.data.data.size,
                expiration: response.data.data.expiration,
                fullResponse: response.data.data
            };
        } else {
            throw new Error(response.data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ ImgBB upload error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload multiple images to ImgBB
 * @param {Array} images - Array of image data (file paths, Buffers, or base64 strings)
 * @param {string} baseName - Base name for images
 * @param {number} expiration - Expiration time in seconds (optional)
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleToImgBB = async (images, baseName = 'product', expiration = null) => {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
        const result = await uploadToImgBB(
            images[i],
            `${baseName}-${i + 1}`,
            expiration
        );
        results.push(result);
    }
    
    return results;
};

/**
 * Delete image from ImgBB using delete URL
 * @param {string} deleteUrl - The delete URL from upload response
 * @returns {Promise<boolean>} Success status
 */
const deleteFromImgBB = async (deleteUrl) => {
    try {
        if (!deleteUrl) return false;
        
        const response = await axios.post(deleteUrl);
        return response.data?.success || false;
    } catch (error) {
        console.error('❌ ImgBB delete error:', error.message);
        return false;
    }
};

/**
 * Get image info from ImgBB
 * @param {string} imageId - The image ID
 * @returns {Promise<Object>} Image info
 */
const getImageInfo = async (imageId) => {
    try {
        // Note: ImgBB doesn't have a direct info endpoint, 
        // but we can use the delete URL pattern
        // You'd need to store the full response
        return null;
    } catch (error) {
        console.error('❌ ImgBB get info error:', error.message);
        return null;
    }
};

module.exports = {
    uploadToImgBB,
    uploadMultipleToImgBB,
    deleteFromImgBB,
    getImageInfo,
    IMGBB_API_KEY
};