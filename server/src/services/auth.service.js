const ApiError = require("../utils/apiError");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  buildAuthPayload,
  createPasswordResetToken,
  hashToken,
} = require("../utils/tokens");
const prisma = require("../config/db");
const { sanitizeUser } = require("../utils/user");
const userRepository = require("../repositories/user.repository");

const buildUsernameBase = (name, email) => {
  const source = name || email.split("@")[0];
  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18);
};

const generateUniqueUsername = async (name, email) => {
  const base = buildUsernameBase(name, email) || "skillswap_user";
  let username = base;
  let attempt = 0;

  while (await userRepository.findByUsername(username)) {
    attempt += 1;
    username = `${base}_${attempt}`;
  }

  return username;
};

const issueAuthTokens = async (user) => {
  const payload = buildAuthPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await userRepository.updateUser(user.id, {
    refreshToken,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const register = async (payload) => {
  const { offeredSkill, learningSkill, ...userPayload } = payload;
  const existingUser = await userRepository.findByEmail(userPayload.email);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const username = await generateUniqueUsername(userPayload.name, userPayload.email);
  const password = await hashPassword(userPayload.password);

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        ...userPayload,
        username,
        password,
      },
    });

    const offeredCatalogSkill = await tx.skill.upsert({
      where: {
        name_category: {
          name: offeredSkill.name,
          category: offeredSkill.category,
        },
      },
      create: {
        name: offeredSkill.name,
        category: offeredSkill.category,
        description: offeredSkill.description,
      },
      update: {
        description: offeredSkill.description,
      },
    });

    const learningCatalogSkill = await tx.skill.upsert({
      where: {
        name_category: {
          name: learningSkill.name,
          category: learningSkill.category,
        },
      },
      create: {
        name: learningSkill.name,
        category: learningSkill.category,
        description: learningSkill.description,
      },
      update: {
        description: learningSkill.description,
      },
    });

    await tx.userOfferedSkill.create({
      data: {
        userId: user.id,
        skillId: offeredCatalogSkill.id,
        level: offeredSkill.level,
      },
    });

    await tx.userLearningSkill.create({
      data: {
        userId: user.id,
        skillId: learningCatalogSkill.id,
        goal: learningSkill.goal,
        currentLevel: learningSkill.currentLevel,
      },
    });

    return user;
  });

  const tokens = await issueAuthTokens(createdUser);
  const profile = await userRepository.findProfileById(createdUser.id);

  return {
    user: sanitizeUser(profile),
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);

  if (!user || !(await comparePassword(password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "This account has been restricted");
  }

  const tokens = await issueAuthTokens(user);
  const profile = await userRepository.findProfileById(user.id);

  return {
    user: sanitizeUser(profile),
    ...tokens,
  };
};

const logout = async (userId) => {
  await userRepository.updateUser(userId, {
    refreshToken: null,
  });

  return {
    success: true,
  };
};

const refreshSession = async (payload, refreshToken) => {
  const user = await userRepository.findById(payload.sub);

  if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh token is invalid");
  }

  const tokens = await issueAuthTokens(user);
  const profile = await userRepository.findProfileById(user.id);

  return {
    user: sanitizeUser(profile),
    ...tokens,
  };
};

const forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return {
      message: "If the account exists, a password reset flow has been created.",
    };
  }

  const reset = createPasswordResetToken();

  await userRepository.updateUser(user.id, {
    passwordResetToken: reset.hashedToken,
    passwordResetTokenExpiry: reset.expiresAt,
  });

  return {
    message: "If the account exists, a password reset flow has been created.",
    resetTokenPreview:
      process.env.NODE_ENV === "production" ? undefined : reset.rawToken,
  };
};

const resetPassword = async ({ token, password }) => {
  const hashedToken = hashToken(token);
  const now = new Date();

  const users = await userRepository.listUsers({
    where: {
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: {
        gt: now,
      },
    },
    skip: 0,
    take: 1,
    orderBy: {
      createdAt: "desc",
    },
  });

  const user = users[0];

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or expired");
  }

  const hashedPassword = await hashPassword(password);

  await userRepository.updateUser(user.id, {
    password: hashedPassword,
    passwordResetToken: null,
    passwordResetTokenExpiry: null,
    refreshToken: null,
  });

  return {
    success: true,
  };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);

  if (!user || !(await comparePassword(currentPassword, user.password))) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);

  await userRepository.updateUser(userId, {
    password: hashedPassword,
    refreshToken: null,
  });

  return {
    success: true,
  };
};

const getCurrentUser = async (userId) => {
  const profile = await userRepository.findProfileById(userId);

  if (!profile) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(profile);
};

module.exports = {
  register,
  login,
  logout,
  refreshSession,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
};
