const password = document.getElementById("password");
const reEnterPassword = document.getElementById("re-pass");
const error = document.getElementById("errorPass");

reEnterPassword.addEventListener("change", (e) => {
  if (reEnterPassword.value !== password.value) {
    reEnterPassword.style.borderColor = "red";
    error.classList.remove("error-hidden");
    error.classList.add("error-visible");

    document.getElementById("register-button").disabled = true;
  } else {
    reEnterPassword.style.borderColor = "lightgrey";
    error.classList.remove("error-visible");
    error.classList.add("error-hidden");

    document.getElementById("register-button").disabled = false;
  }
});
