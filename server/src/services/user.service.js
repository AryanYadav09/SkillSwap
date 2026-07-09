const ApiError = require("../utils/apiError");
const { uploadImageBuffer } = require("../utils/cloudinary");
const { buildPaginatedResponse, buildSearchFilter, parsePagination } = require("../utils/query");
const { sanitizeUser } = require("../utils/user");
const userRepository = require("../repositories/user.repository");

const listUsers = async (query, currentUserId) => {
  const pagination = parsePagination(query, ["createdAt", "name", "college"], "createdAt");
  const skillSearch = buildSearchFilter(query.search);
  const filters = [];

  if (query.search) {
    filters.push({
      OR: [
        { name: skillSearch },
        { username: skillSearch },
        { college: skillSearch },
        {
          offeredSkills: {
            some: {
              skill: {
                name: skillSearch,
              },
            },
          },
        },
        {
          learningSkills: {
            some: {
              skill: {
                name: skillSearch,
              },
            },
          },
        },
      ],
    });
  }

  if (query.category) {
    filters.push({
      OR: [
        {
          offeredSkills: {
            some: {
              skill: {
                category: buildSearchFilter(query.category),
              },
            },
          },
        },
        {
          learningSkills: {
            some: {
              skill: {
                category: buildSearchFilter(query.category),
              },
            },
          },
        },
      ],
    });
  }

  const where = {
    role: "USER",
    status: "ACTIVE",
    ...(query.excludeSelf === "true"
      ? {
          id: {
            not: currentUserId,
          },
        }
      : {}),
    ...(query.college
      ? {
          college: buildSearchFilter(query.college),
        }
      : {}),
    ...(query.level
      ? {
          offeredSkills: {
            some: {
              level: query.level,
            },
          },
        }
      : {}),
    ...(filters.length ? { AND: filters } : {}),
  };

  const [users, total] = await Promise.all([
    userRepository.listUsers({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    userRepository.countUsers(where),
  ]);

  return buildPaginatedResponse(users.map(sanitizeUser), total, pagination);
};

const getUserById = async (userId) => {
  const profile = await userRepository.findProfileById(userId);

  if (!profile) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(profile);
};

const updateProfile = async (userId, payload, file) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!file && !Object.keys(payload).length) {
    throw new ApiError(400, "At least one profile field must be provided");
  }

  const profileImage = file
    ? await uploadImageBuffer(file, "skillswap/profile-images")
    : undefined;

  const updatedUser = await userRepository.updateUser(userId, {
    ...payload,
    ...(profileImage ? { profileImage } : {}),
  });

  const profile = await userRepository.findProfileById(updatedUser.id);
  return sanitizeUser(profile);
};

const addBookmark = async (userId, bookmarkedUserId) => {
  if (userId === bookmarkedUserId) {
    throw new ApiError(400, "You cannot bookmark your own profile");
  }

  const bookmarkedUser = await userRepository.findById(bookmarkedUserId);

  if (!bookmarkedUser) {
    throw new ApiError(404, "User not found");
  }

  const existingBookmark = await userRepository.findBookmark(userId, bookmarkedUserId);

  if (existingBookmark) {
    throw new ApiError(409, "User is already bookmarked");
  }

  return userRepository.createBookmark({
    userId,
    bookmarkedUserId,
  });
};

const removeBookmark = async (userId, bookmarkedUserId) => {
  const bookmark = await userRepository.findBookmark(userId, bookmarkedUserId);

  if (!bookmark) {
    throw new ApiError(404, "Bookmark not found");
  }

  await userRepository.deleteBookmark(userId, bookmarkedUserId);

  return {
    success: true,
  };
};

const listBookmarks = async (userId, query) => {
  const pagination = parsePagination(query, ["createdAt"], "createdAt");
  const [items, total] = await Promise.all([
    userRepository.listBookmarks({
      userId,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    userRepository.countBookmarks(userId),
  ]);

  return buildPaginatedResponse(
    items.map((bookmark) => ({
      ...bookmark,
      bookmarkedUser: sanitizeUser(bookmark.bookmarkedUser),
    })),
    total,
    pagination,
  );
};

module.exports = {
  listUsers,
  getUserById,
  updateProfile,
  addBookmark,
  removeBookmark,
  listBookmarks,
};
