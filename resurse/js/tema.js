window.addEventListener("DOMContentLoaded", function(){
    let tema = localStorage.getItem("tema");
    let body = document.body;
    let temaIcon = document.getElementById("tema-icon");

    if (tema === "dark") {
        body.classList.add("dark");
        temaIcon.classList.add("fa-moon");
    } else {
        body.classList.remove("dark");
        temaIcon.classList.add("fa-sun");
    }

    document.getElementById("schimba_tema").onclick = function(){
        if(body.classList.contains("dark")){
            body.classList.remove("dark");
            temaIcon.classList.remove("fa-moon");
            temaIcon.classList.add("fa-sun");
            localStorage.removeItem("tema");
        } else {
            body.classList.add("dark");
            temaIcon.classList.remove("fa-sun");
            temaIcon.classList.add("fa-moon");
            localStorage.setItem("tema", "dark");
        }
    }
});
