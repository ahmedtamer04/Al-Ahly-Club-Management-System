import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authentication middleware - checks if user is logged in
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password_hash');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Authorization middleware - checks user roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Please login first.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = authorize('Admin');
export const requireAdminOrEventsOffice = authorize('Admin', 'EventsOffice');
export const requireStaffOrAbove = authorize('Admin', 'EventsOffice', 'Staff', 'Professor', 'TA');
export const requireStudentOrAbove = authorize('Admin', 'EventsOffice', 'Staff', 'Professor', 'TA', 'Student');
export const requireVendor = authorize('Vendor');