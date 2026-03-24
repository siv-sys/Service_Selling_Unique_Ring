const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

function sanitizePrefix(prefix) {
  return String(prefix || 'avatar')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'avatar';
}

async function persistAvatarUpload(filePrefix, avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  if (!avatarUrl.startsWith('data:image/')) {
    return avatarUrl;
  }

  const match = avatarUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Unsupported image format.');
  }

  const normalizedExtension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.has(normalizedExtension)) {
    throw new Error('Please upload a PNG, JPG, GIF, or WEBP image.');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) {
    throw new Error('The selected image could not be read.');
  }

  if (buffer.length > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('Image is too large. Please use a file under 5MB.');
  }

  const uploadsDir = path.resolve(__dirname, '../../uploads/profile');
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `${sanitizePrefix(filePrefix)}-${crypto.randomUUID()}.${normalizedExtension}`;
  await fs.writeFile(path.join(uploadsDir, fileName), buffer);

  return `/uploads/profile/${fileName}`;
}

module.exports = {
  persistAvatarUpload,
};
