const joinBtn = document.getElementById("join-btn");
const loginBtn = document.getElementById("login-btn");

if (localStorage.getItem("token")) {
  location.href = "/lobby.html";
}

joinBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const data = {};
  data.name = event.target.parentElement.children[1].value;
  data.email = event.target.parentElement.children[3].value;
  data.password = event.target.parentElement.children[5].value;
  fetch("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error(res.status);
      }
    })
    .then((resObj) => {
      const token = resObj.token;
      localStorage.setItem("token", token);
      location.href = `/lobby.html`;
    })
    .catch((err) => {
      alert("Unable to join");
    });
});

loginBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const data = {};
  data.email = event.target.parentElement.children[1].value;
  data.password = event.target.parentElement.children[3].value;
  fetch("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error(res.status);
      }
    })
    .then((resObj) => {
      const token = resObj.token;
      localStorage.setItem("token", token);
      location.href = `/lobby.html`;
    })
    .catch((err) => {
      alert("Unable to sign in");
    });
});
