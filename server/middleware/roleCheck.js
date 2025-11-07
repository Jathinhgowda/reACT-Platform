/**
 * Middleware to restrict access based on user role.
 * @param {Array<string>} roles - Array of allowed roles (e.g., ['Admin', 'Authority'])
 */
const authorize = (roles = []) => {
  // Check if roles is a string and convert to array for simplicity
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Ensure req.user exists (i.e., protect middleware has run)
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied: User authentication required.' });
    }

    // Check if user's role is included in the allowed roles array
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied: Role '${req.user.role}' is not permitted.` 
      });
    }

    next();
  };
};

module.exports = authorize;