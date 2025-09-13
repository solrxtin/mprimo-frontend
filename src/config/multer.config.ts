import cloudinary from './cloudinary.config';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import util from 'util';



// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk Storage Configuration for temporary storage
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Helper functions
const readFile = util.promisify(fs.readFile);

async function calculateHash(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  const hash = crypto.createHash("sha1").update(fileBuffer).digest("hex");
  return hash;
}

async function searchImageByHash(hash: string): Promise<string | null> {
  const searchResult = await cloudinary.search
    .expression(`context.hash=${hash}`)
    .execute();
  return searchResult.resources.length > 0
    ? searchResult.resources[0].secure_url
    : null;
}

// File filters
const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
  }
};

const videoFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MOV and AVI are allowed.'));
  }
};

const documentFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX and TXT are allowed.'));
  }
};

// Create Multer configurations
export const multerConfig = {
  uploadImage: multer({
    storage: diskStorage,
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    }
  }),
  uploadVideo: multer({
    storage: diskStorage,
    fileFilter: videoFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1
    }
  }),
  uploadDocument: multer({
    storage: diskStorage,
    fileFilter: documentFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1
    }
  })
};

// Upload handlers
export const uploadImageToCloudinary = async (filePath: string, folder: string = 'product-images'): Promise<{ url: string; public_id: string }> => {
  try {
    // Calculate file hash for deduplication
    const fileHash = await calculateHash(filePath);
    
    // Check if image already exists
    const existingUrl = await searchImageByHash(fileHash);
    if (existingUrl) {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return {
        url: existingUrl,
        public_id: `${folder}/${fileHash}`
      };
    }
    
    // Upload to Cloudinary with watermark
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: `${folder}/${fileHash}`,
      context: {
        hash: fileHash,
      },
      transformation: [
        {
          overlay: {
            font_family: "Arial",
            font_size: 24,
            font_weight: "bold",
            text: "Mprimo", // The text to overlay
          },
          gravity: "south", // Position in the bottom center
          color: "#F5F5F5", // Gray text
          background: "#000000",
          opacity: 50,
        },
      ],
    });
    
    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export const uploadVideoToCloudinary = async (filePath: string, folder: string = 'product-videos'): Promise<{ url: string; public_id: string }> => {
  try {
    // Calculate file hash for deduplication
    const fileHash = await calculateHash(filePath);
    
    // Check if video already exists
    const existingUrl = await searchImageByHash(fileHash);
    if (existingUrl) {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return {
        url: existingUrl,
        public_id: `${folder}/${fileHash}`
      };
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      public_id: `${folder}/${fileHash}`,
      context: {
        hash: fileHash,
      }
    });
    
    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export const uploadDocumentToCloudinary = async (filePath: string, folder: string = 'documents'): Promise<{ url: string; public_id: string }> => {
  try {
    const fileHash = await calculateHash(filePath);
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      public_id: `${folder}/${fileHash}`,
      context: {
        hash: fileHash,
      }
    });
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Export individual upload middlewares
export const uploadImage = multerConfig.uploadImage.single('productImage');
export const uploadVideo = multerConfig.uploadVideo.single('video');
export const uploadDocument = multerConfig.uploadDocument.single('document');

// Dispute chat media uploads
export const uploadDisputeImage = multerConfig.uploadImage.single('image');
export const uploadDisputeVideo = multerConfig.uploadVideo.single('video');
export const uploadDisputeDocument = multerConfig.uploadDocument.single('document');
