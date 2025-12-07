import EventResource from "../models/EventResource.js";
import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/event-resources");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_');
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow PDFs, images, documents
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Upload file resource
export const uploadFileResource = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get event and check authorization
    const event = await Event.findById(eventId);
    if (!event) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is organizer, Admin, or EventsOffice
    const isCreator = event.created_by.toString() === req.user._id.toString();
    const isAuthorized = isCreator || req.user.role === 'Admin' || req.user.role === 'EventsOffice';

    if (!isAuthorized) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ 
        message: "Only event organizers can upload resources" 
      });
    }

    // Create resource record
    const resource = new EventResource({
      event_id: eventId,
      uploaded_by: req.user._id,
      resource_type: 'file',
      title: title || req.file.originalname,
      description: description || '',
      file_path: req.file.path,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });

    await resource.save();

    const populatedResource = await EventResource.findById(resource._id)
      .populate('uploaded_by', 'first_name last_name');

    res.status(201).json({
      message: "Resource uploaded successfully",
      resource: populatedResource
    });

  } catch (error) {
    console.error('Error uploading resource:', error);
    
    // Clean up uploaded file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Add link resource
export const addLinkResource = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, url } = req.body;

    if (!title || !url) {
      return res.status(400).json({ message: "Title and URL are required" });
    }

    // Get event and check authorization
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isCreator = event.created_by.toString() === req.user._id.toString();
    const isAuthorized = isCreator || req.user.role === 'Admin' || req.user.role === 'EventsOffice';

    if (!isAuthorized) {
      return res.status(403).json({ 
        message: "Only event organizers can add resources" 
      });
    }

    // Create resource record
    const resource = new EventResource({
      event_id: eventId,
      uploaded_by: req.user._id,
      resource_type: 'link',
      title,
      description: description || '',
      url
    });

    await resource.save();

    const populatedResource = await EventResource.findById(resource._id)
      .populate('uploaded_by', 'first_name last_name');

    res.status(201).json({
      message: "Link added successfully",
      resource: populatedResource
    });

  } catch (error) {
    console.error('Error adding link resource:', error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all resources for an event
export const getEventResources = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get resources
    const resources = await EventResource.find({ event_id: eventId })
      .populate('uploaded_by', 'first_name last_name role')
      .sort({ createdAt: -1 });

    res.json({ resources });

  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Download a file resource
export const downloadResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await EventResource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.resource_type !== 'file') {
      return res.status(400).json({ message: "This resource is not a file" });
    }

    // Check if user is registered for the event (or is organizer/admin)
    const registration = await Registration.findOne({
      event_id: resource.event_id,
      user_id: req.user._id,
      status: 'registered'
    });

    const event = await Event.findById(resource.event_id);
    const isCreator = event && event.created_by.toString() === req.user._id.toString();
    const isAuthorized = registration || isCreator || req.user.role === 'Admin' || req.user.role === 'EventsOffice';

    if (!isAuthorized) {
      return res.status(403).json({ 
        message: "Only registered participants can download resources" 
      });
    }

    if (!fs.existsSync(resource.file_path)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${resource.file_name}"`);
    res.setHeader("Content-Type", resource.mime_type);
    res.setHeader("Content-Length", resource.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(resource.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Delete a resource
export const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await EventResource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check authorization
    const event = await Event.findById(resource.event_id);
    const isCreator = event && event.created_by.toString() === req.user._id.toString();
    const isUploader = resource.uploaded_by.toString() === req.user._id.toString();
    const isAuthorized = isCreator || isUploader || req.user.role === 'Admin' || req.user.role === 'EventsOffice';

    if (!isAuthorized) {
      return res.status(403).json({ 
        message: "You don't have permission to delete this resource" 
      });
    }

    // Delete file from filesystem if it's a file resource
    if (resource.resource_type === 'file' && resource.file_path && fs.existsSync(resource.file_path)) {
      fs.unlinkSync(resource.file_path);
    }

    await EventResource.findByIdAndDelete(resourceId);

    res.json({ message: "Resource deleted successfully" });

  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};
