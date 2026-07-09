const prisma = require("../config/db");
const ApiError = require("../utils/apiError");
const { verifyAccessToken } = require("../utils/tokens");

const extractBearerToken = (req) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.replace("Bearer ", "").trim();
};

const protect = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(403, "This account is not active");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid or expired token"));
  }
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have access to this resource"));
  }

  return next();
};

module.exports = {
  protect,
  authorize,
};
