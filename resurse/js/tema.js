window.addEventListener("DOMContentLoaded", function(){
    let tema = localStorage.getItem("tema");
    let body = document.body;
    let temaSwitch = document.getElementById("temaSwitch");
    let temaIconMoon = document.querySelector(".bi-moon");
    let temaIconSun = document.querySelector(".bi-sun");
    let temaText = document.getElementById("temaText");

    if (tema === "dark") {
        body.classList.add("dark");
        temaIconMoon.classList.remove("d-none");
        temaIconSun.classList.add("d-none");
        temaSwitch.checked = true;
        temaText.textContent = "Dark Mode";
    } else {
        body.classList.remove("dark");
        temaIconMoon.classList.add("d-none");
        temaIconSun.classList.remove("d-none");
        temaSwitch.checked = false;
        temaText.textContent = "Light Mode";
    }

    temaSwitch.addEventListener("change", function(){
        if (temaSwitch.checked) {
            body.classList.add("dark");
            temaIconMoon.classList.remove("d-none");
            temaIconSun.classList.add("d-none");
            localStorage.setItem("tema", "dark");
            temaText.textContent = "Dark Mode";
        } else {
            body.classList.remove("dark");
            temaIconMoon.classList.add("d-none");
            temaIconSun.classList.remove("d-none");
            localStorage.removeItem("tema");
            temaText.textContent = "Light Mode";
        }
    });
});
