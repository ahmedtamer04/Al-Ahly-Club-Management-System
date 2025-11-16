import Document from "../models/Document.js";
import Event from "../models/Events.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow all file types for now, can be restricted later
  cb(null, true);
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

/**
 * Upload a document
 * POST /api/documents/upload
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    const { description, event_id, category = "general" } = req.body;

    const document = new Document({
      filename: req.file.filename,
      original_filename: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user._id,
      description: description || "",
      event_id: event_id || null,
      category: category
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        _id: document._id,
        filename: document.original_filename,
        file_size: document.file_size,
        mime_type: document.mime_type,
        description: document.description,
        uploaded_at: document.createdAt
      }
    });

  } catch (err) {
    console.error("Error uploading document:", err);
    
    // Clean up uploaded file if document creation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: err.message 
    });
  }
};

/**
 * Get all documents (with optional filtering)
 * GET /api/documents
 */
export const getDocuments = async (req, res) => {
  try {
    const { event_id, category, uploaded_by } = req.query;
    
    const filter = {};
    if (event_id) filter.event_id = event_id;
    if (category) filter.category = category;
    if (uploaded_by) filter.uploaded_by = uploaded_by;

    const documents = await Document.find(filter)
      .populate("uploaded_by", "first_name last_name email role")
      .populate("event_id", "name type")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      documents: documents.map(doc => ({
        _id: doc._id,
        filename: doc.original_filename,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        description: doc.description,
        category: doc.category,
        uploaded_by: doc.uploaded_by,
        event: doc.event_id,
        uploaded_at: doc.createdAt
      }))
    });

  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: err.message 
    });
  }
};

/**
 * Download a document
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ 
        success: false,
        message: "File not found on server" 
      });
    }

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${document.original_filename}"`);
    res.setHeader("Content-Type", document.mime_type);
    res.setHeader("Content-Length", document.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

  } catch (err) {
    console.error("Error downloading document:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: err.message 
    });
  }
};

/**
 * View a document (inline)
 * GET /api/documents/:id/view
 */
export const viewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ 
        success: false,
        message: "File not found on server" 
      });
    }

    // Set headers for inline viewing
    res.setHeader("Content-Disposition", `inline; filename="${document.original_filename}"`);
    res.setHeader("Content-Type", document.mime_type);
    res.setHeader("Content-Length", document.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

  } catch (err) {
    console.error("Error viewing document:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: err.message 
    });
  }
};

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: "Document not found" 
      });
    }

    // Delete the file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete the document record
    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: err.message 
    });
  }
};

