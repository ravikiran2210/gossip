export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  admin: {
    seedName: process.env.ADMIN_SEED_NAME || 'Super Admin',
    seedEmail: process.env.ADMIN_SEED_EMAIL || 'admin@example.com',
    seedUsername: process.env.ADMIN_SEED_USERNAME || 'superadmin',
    seedPassword: process.env.ADMIN_SEED_PASSWORD || 'Admin@123456',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'messenger',
  },
  media: {
    maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
    maxVideoSizeMb: parseInt(process.env.MAX_VIDEO_SIZE_MB || '100', 10),
    maxAudioSizeMb: parseInt(process.env.MAX_AUDIO_SIZE_MB || '20', 10),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
    allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm').split(','),
    allowedAudioTypes: (process.env.ALLOWED_AUDIO_TYPES || 'audio/mpeg,audio/ogg,audio/wav,audio/webm').split(','),
    allowedDocumentTypes: (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,text/plain').split(','),
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  accessCode: {
    expiresHours: parseInt(process.env.ACCESS_CODE_EXPIRES_HOURS || '48', 10),
  },
});
