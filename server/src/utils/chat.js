const normalizeChatPair = (userAId, userBId) => [userAId, userBId].sort();

const getOtherParticipant = (chat, userId) => {
  if (chat.user1Id === userId) {
    return chat.user2;
  }

  return chat.user1;
};

module.exports = {
  normalizeChatPair,
  getOtherParticipant,
};
