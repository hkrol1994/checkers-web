const logoutBtn = document.getElementById("logout-btn");
const token = localStorage.getItem("token");

logoutBtn.addEventListener("click", () => {
  fetch("/users/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        throw new Error(res.status);
      }
    })
    .catch((err) => {});
});
