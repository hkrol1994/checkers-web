const users = [];

const addUser = ({ id, username, rating }) => {
  username = username.trim().toLowerCase();

  const user = {
    id,
    username,
    rating,
  };
  users.push(user);

  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInLobbyByRating = (id) => {
  return users
    .filter((user) => user.id !== id)
    .sort((a, b) => b.rating - a.rating);
};

const updateCanBeInvited = (id) => {
  const user = users.find((user) => user.id === id);
  if (user.canBeInvited) {
    delete user.canBeInvited;
  } else {
    user.canBeInvited = "disabled";
  }
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInLobbyByRating,
  updateCanBeInvited,
};
