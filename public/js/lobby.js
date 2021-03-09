const socket = io();
const $usersContainer = document.querySelector(".users-container");
const userTemplate = document.querySelector("#users-template").innerHTML;

const inviteBtnEvent = () => {
  const btns = document.querySelectorAll(".invite-btn");
  for (let btn of btns) {
    btn.addEventListener("click", (e) => {
      socket.emit("sendInvite", e.target.id);
      document.getElementById("waiting-modal").classList.remove("none");
      document.querySelector(".btn-container").id = e.target.id;
    });
  }
};

const cancelInvite = document.getElementById("cancel-invite");
cancelInvite.addEventListener("click", (e) => {
  socket.emit("cancel-invite", e.target.parentElement.id);
  document.getElementById("waiting-modal").classList.add("none");
});

const declineInvite = document.getElementById("decline-invite");
declineInvite.addEventListener("click", (e) => {
  socket.emit("cancel-invite", e.target.parentElement.id);
  document.getElementById("get-invite-modal").classList.add("none");
});

const approveInvite = document.getElementById("approve-invite");
approveInvite.addEventListener("click", (e) => {
  socket.emit("approve-invite", e.target.parentElement.id);
});

fetch("/users/me", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error(res.status);
    }
  })
  .then((resObj) => {
    document.getElementById("username").innerHTML = resObj.name;
    document.getElementById("user-rating").innerHTML = resObj.rating;
    socket.emit("joinToLobby", {
      username: resObj.name,
      rating: resObj.rating,
    });
  })
  .catch((err) => {
    console.log(err);
  });

socket.on("changeInLobby", () => {
  socket.emit("getUsersInLobby");
});

socket.on("getUsers", (users) => {
  const html = Mustache.render(userTemplate, {
    users,
  });
  $usersContainer.innerHTML = html;
  inviteBtnEvent();
});

socket.on("getInvaite", ({ opponentId, opponentName, opponentRating }) => {
  document.getElementById("get-invite-modal").classList.remove("none");
  document.getElementById("opponent-name").innerHTML = opponentName;
  document.getElementById("opponent-rating").innerHTML = opponentRating;
  document.querySelector(".btns-container").id = opponentId;
});

socket.on("cancel-invite", () => {
  document.getElementById("waiting-modal").className = "modal none";
  document.getElementById("get-invite-modal").className = "modal none";
});

socket.on("goToRoom", (room) => {
  location.href = `/game.html?room=${room.roomNumber}`;
});
