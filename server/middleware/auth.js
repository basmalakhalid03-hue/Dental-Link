const jwt = require('jsonwebtoken');

// All system roles
const ROLES = {
  ADMIN:          'ADMIN',
  TECHNICIAN:     'TECHNICIAN',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
  DOCTOR:         'DOCTOR',
};

// Verify JWT and attach decoded payload to req.user
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Factory: allow only the listed roles to proceed
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({
      message: `Access denied. Required: ${roles.join(' or ')}`,
    });
  next();
};

// Pre-built guards used across routes
const requireAdmin        = requireRole(ROLES.ADMIN);
const requireLabStaff     = requireRole(ROLES.ADMIN, ROLES.TECHNICIAN);
const requireDelivery     = requireRole(ROLES.ADMIN, ROLES.DELIVERY_AGENT);
const requireNotDoctor    = requireRole(ROLES.ADMIN, ROLES.TECHNICIAN, ROLES.DELIVERY_AGENT);
const requireAdminOrDoctor = requireRole(ROLES.ADMIN, ROLES.DOCTOR);
const requireCaseEditor    = requireRole(ROLES.ADMIN, ROLES.TECHNICIAN, ROLES.DOCTOR);
const requireNotDelivery   = requireRole(ROLES.ADMIN, ROLES.TECHNICIAN, ROLES.DOCTOR);

module.exports = {
  authenticate, requireRole,
  requireAdmin, requireLabStaff, requireDelivery, requireNotDoctor,
  requireAdminOrDoctor, requireCaseEditor, requireNotDelivery,
  ROLES,
};
