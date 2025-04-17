const jwt = require('jsonwebtoken');

// Middleware to verify JWT and attach user to req
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader); // Log the header for debugging
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('Token valid, user:', decoded); // Log decoded user
        next();
    } catch (err) {
        console.log('JWT verification error:', err.message); // Log JWT error
        res.status(401).json({ message: 'Token is not valid' });
    }
}

// Middleware for role-based access
function requireRole(role) {
    return function (req, res, next) {
        if (req.user && req.user.role === role) {
            next();
        } else {
            console.log('Forbidden: insufficient privileges. User:', req.user); // Log insufficient privilege
            res.status(403).json({ message: 'Forbidden: insufficient privileges' });
        }
    };
}

module.exports = { authMiddleware, requireRole };
