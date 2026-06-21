import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const protocol = req.get('X-Forwarded-Proto') || req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl,
                publicId: req.file.filename
            }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteImage = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        const filePath = path.join(uploadsDir, publicId);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }
    } catch (error) {
        next(error);
    }
};
