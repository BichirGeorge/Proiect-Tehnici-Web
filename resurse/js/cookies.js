

//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare) {//timpExpirare in milisecunde
    d = new Date();
    d.setTime(d.getTime() + timpExpirare)
    document.cookie = `${nume}=${val}; expires=${d.toUTCString()}`;
}

function getCookie(nume) {
    vectorParametri = document.cookie.split(";") // ["a=10","b=ceva"]
    for (let param of vectorParametri) {
        if (param.trim().startsWith(nume + "="))
            return param.split("=")[1]
    }
    return null;
}

function deleteCookie(nume) {
    console.log(`${nume}; expires=${(new Date()).toUTCString()}`)
    document.cookie = `${nume}=0; expires=${(new Date()).toUTCString()}`;
}

function deleteAllCookies() {
    const cookies = document.cookie.split("; ");
    for (let c of cookies) {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
}

window.addEventListener("load", function () {
    if (getCookie("acceptat_banner")) {
        document.getElementById("banner").style.display = "none";
    }

    this.document.getElementById("ok_cookies").onclick = function () {
        setCookie("acceptat_banner", true, 6000);
        document.getElementById("banner").style.display = "none"
    }
})

window.addEventListener("load", function () {
    if (!getCookie("ultima_vizita")) {
        setCookie("ultima_vizita", new Date().toLocaleString(), 7 * 24 * 60 * 60 * 1000);
    }
    const ultimaVizita = getCookie("ultima_vizita");
    if (ultimaVizita) {
        const divUltimaVizita = document.createElement("div");
        divUltimaVizita.innerText = `Ultima vizită: ${ultimaVizita}`;
        document.body.appendChild(divUltimaVizita);
    }
});
