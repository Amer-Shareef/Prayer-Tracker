const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  // For development: bypass authentication
  req.user = { id: 1, role: 'Founder', mosqueId: 1 };
  return next();
  
  // Normal authentication logic
  /*
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
  */
};

exports.authorizeFounder = (req, res, next) => {
  // For development: bypass authorization
  return next();
  
  // Normal authorization logic
  /*
  if (req.user.role !== 'Founder') {
    return res.status(403).json({ 
      message: 'Access denied. Founder permission required.'
    });
  }
  next();
  */
};
