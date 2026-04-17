const jwt = require('jsonwebtoken');


exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];


  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
    }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: ... }
   
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
