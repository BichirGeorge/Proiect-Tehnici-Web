
// window.addEventListener("load", function(){
//     document.getElementById("filtrare").onchange=function(){
//         var inpNume = document.getElementById("inp-nume").value.trim().toLowerCase();

//         var produse = document.getElementsByClassName("produs");
//         for(let produs of produse){
//             let varNume=produs.getElementsByClassName("val-nume");
//             console.log(valNume)
//         }
//     }
// })


window.addEventListener("load", function(){

    document.getElementById("inp-pret").onchange=function(){
        document.getElementById("infoRange").innerHTML=`(${this.value})`
    }

    function remDiacritice(text) {
        const diacritice = "ăîâșț".split("");
        const rezultat = "aiast".split("");
        text = text.toLocaleLowerCase("ro-RO").trim();
        diacritice.forEach((_, i) => {
            text = text.replaceAll(diacritice[i], rezultat[i]);
        });
        return text;
    }

    // document.getElementById("filtrare").addEventListener("click", function(){ })
    document.getElementById("filtrare").onclick= function(){
        var inpNume= remDiacritice(document.getElementById("inp-nume").value.trim().toLowerCase());
        if (inpNume === "") {
            alert("Va rugam sa introduceti un nume.");
            return;
        }
        var radioKilometraj=document.getElementsByName("gr_rad")
        let inpKilometraj;
        var radioSelectat = false;
        for (let rad of radioKilometraj){
            if (rad.checked){
                radioSelectat = true;
                inpKilometraj=rad.value;
                break;
            }
        }
        if (!radioSelectat){
            alert("Va rugam sa selectati un interval de kilometraj.");
            return;
        }
        let minKilometraj, maxKilometraj
        if (inpKilometraj!="toate"){
            vKilo=inpKilometraj.split(":")
            minKilometraj=parseInt(vKilo[0])
            maxKilometraj=parseInt(vKilo[1])
        }


        var inpPret= parseInt(document.getElementById("inp-pret").value);

        var inpFirma=document.getElementById("inp-firma").value.toLowerCase().trim()


        var produse=document.getElementsByClassName("produs");
        for (let produs of produse){

            let valNume = remDiacritice(produs.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase());

            let cond1= valNume.startsWith(inpNume)


            let valKilometraj = parseInt(produs.getElementsByClassName("val-kilometraj")[0].innerHTML)

            let cond2=(inpKilometraj=="toate" || (minKilometraj<= valKilometraj && valKilometraj < maxKilometraj));

            let valPret = parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML)
            let cond3=(valPret>inpPret)


            let valFirma = produs.getElementsByClassName("val-firma")[0].innerHTML.toLowerCase().trim()
            let cond4 =(inpFirma==valFirma || inpFirma=="toate")

            if (cond1 && cond2 && cond3 && cond4){
                produs.style.display="block";
            }
            else{
                
                produs.style.display="none";
            }


        }



    }

    document.getElementById("resetare").onclick= function(){
        var confirmReset = window.confirm("Vrei cu adevarat sa resetezi filtrele?");
        if (confirmReset){       
        document.getElementById("inp-nume").value="";
        
        document.getElementById("inp-pret").value=document.getElementById("inp-pret").min;
        document.getElementById("inp-firma").value="toate";
        document.getElementById("i_rad4").checked=true;
        var produse=document.getElementsByClassName("produs");
        document.getElementById("infoRange").innerHTML="(0)";
        for (let prod of produse){
            prod.style.display="block";
        }
    } 
    }



    function sorteaza (semn){
        var produse=document.getElementsByClassName("produs");
        let v_produse=Array.from(produse)
        v_produse.sort(function(a,b){
            let pret_a=parseInt(a.getElementsByClassName("val-pret")[0].innerHTML)
            let pret_b=parseInt(b.getElementsByClassName("val-pret")[0].innerHTML)
            if (pret_a==pret_b){
                let nume_a=a.getElementsByClassName("val-nume")[0].innerHTML
                let nume_b=b.getElementsByClassName("val-nume")[0].innerHTML
                return semn*nume_a.localeCompare(nume_b);
            }
            return semn*(pret_a-pret_b);
        })
        console.log(v_produse)
        for (let prod of v_produse){
            prod.parentNode.appendChild(prod)
        }

    }
    
    document.getElementById("sortCrescNume").onclick= function(){
        sorteaza(1)
    }
    document.getElementById("sortDescrescNume").onclick= function(){
        sorteaza(-1)
    }



    window.onkeydown = function (e) {
        if (e.key == "c" && e.altKey) {
            var suma = 0;
            var produse = document.getElementsByClassName("produs");
    
            for (let produs of produse) {
                var stil = getComputedStyle(produs)
                if (stil.display != "none") {
                    suma += parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML)
                }
            }
            if (suma === 0) {
                alert("Nu avem ce sa calculam.");
                return;
            }
            //console.log(suma);
            if (!document.getElementById("par_suma")) {
                let p = document.createElement("p");
                p.innerHTML = suma;
                p.id = "par_suma";
                container = document.getElementById("produse");
                container.insertBefore(p, container.children[0]);

                setTimeout(function () {
                    let par = document.getElementById("par_suma");
                    if (par) {
                        par.remove();
                    }

                }, 2000)

            }
        }
    }

})

//De implementat:
// Produsele se vor afișa fie cu ajutorul unui grid, fie folosind flexbox(este facut)

// Inputul de tip text va fi pentru caracteristica care poate sa aiba mai multe valori pentru o entitate. Inputul de tip text poate conține doar un subșir din valoare. Se vor selecta toate produsele care au macar o valoare (pentru acea caracteristică) care să conțină subșirul din input.
// Se va face un grup de checkbox pentru subcategorie (categoria de mai mică importanță). Se vor afișa produsele care au drept subcategorie valoarea selectată din minim unul dintre checkboxuri. Implicit vor fi bifate toate checkboxurile, ca să se afișeze toate produsele.
// selectul multiplu va avea eticheta "Selectați valorile pe care NU le doriți" și va fi dedicat caracteristicii care poate sa aiba mai multe valori. Se vor afișa dor produsele pentru care niciuna dintre valori nu corespunde vreuneia selectate în obiectul select.
// Pentru filtrele/inputurile pentru care nu s-a precizat cum anume să fie implementate în pagină, alegeți voi pentru ce caracteristici să se aplice și în ce manieră. Nu e voie să aveți două filtre pentru aceeași proprietate a produsului.