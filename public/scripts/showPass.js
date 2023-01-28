document.getElementById("showpass").addEventListener("change", () => {
  const type = document.getElementById("password").type;
  if (type == "password") {
    document.getElementById("password").type = "text";
  } else {
    document.getElementById("password").type = "password";
  }
});
