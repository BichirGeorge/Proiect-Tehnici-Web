const AccesBD=require('./accesbd.js');
const parole=require('./parole.js');

const {RolFactory}=require('./roluri.js');
const crypto=require("crypto");
const nodemailer=require("nodemailer");

/**
 * Clasa pentru utilizatori
 */

class Utilizator{
    static tipConexiune="local";
    static tabel="utilizatori"
    static parolaCriptare="tehniciweb";
    static emailServer="tehnicianulweb@gmail.com";
    static lungimeCod=64;
    static numeDomeniu="localhost:8080";
    #eroare;

    /**
     * @typedef {object} ObiectUtilizator - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     * @property {number} id - ID-ul utilizatorului
     * @property {string} username - Username-ul utilizatorului
     * @param {string} nume - Numele utilizatorului
     * @param {string} prenume - Prenumele utilizatorului
     * @param {string} email - email-ul utilizatorului
     * @param {string} parola - Parola utilizatorului
     * @param {string} rol - Rolul utilizatorului
     * @param {string} culoare_chat - Culoarea chatului utilizatorului
     * @param {string} poza - poza utilizatorului
     * Creeaza o instanta a clasei Utilizator
     * @param {ObiectUtilizator} obj - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     */

    constructor({id, username, nume, prenume, email, parola, rol, culoare_chat="black", telefon, marca_preferata, poza}={}) {
        this.id=id;

        //optional sa facem asta in constructor
        try{
            if(this.checkUsername(username))
                this.username = username;
            else throw new Error("Username incorect");

        }
        catch(e){ this.#eroare=e.message}

        for(let prop in arguments[0]){
            this[prop]=arguments[0][prop]
        }
        if(this.rol)
            this.rol=this.rol.cod? RolFactory.creeazaRol(this.rol.cod):  RolFactory.creeazaRol(this.rol);
        console.log(this.rol);

        this.#eroare="";
    }

    /**
     * Verifica daca numele este valid
     * @param {string} nume - Numele de verificat
     * @returns {boolean} True daca numele este valid, false in caz contrar
     */

    checkName(nume){
        return nume!="" && nume.match(new RegExp("^[A-Z][a-z]+$")) ;
    }

    /**
     * Seteaza numele utilizatorului
     * @param {string} nume - Numele de setat
     */

    set setareNume(nume){
        if (this.checkName(nume)) this.nume=nume
        else{
            throw new Error("Nume gresit")
        }
    }

    /*
    * folosit doar la inregistrare si modificare profil
    */
    /**
     * Seteaza username-ul utilizatorului
     * @param {string} username - username-ul de setat
     */

    set setareUsername(username){
        if (this.checkUsername(username)) this.username=username
        else{
            throw new Error("Username gresit")
        }
    }

    /**
     * Verifica daca username-ul este valid
     * @param {string} username - Username-ul de verificat
     * @returns {boolean} True daca username-ul este valid, false in caz contrar
     */

    checkUsername(username){
        return username!="" && username.match(new RegExp("^[A-Za-z0-9#_./]+$")) ;
    }

    /**
     * Cripteaza parola utilizatorului
     * @param {string} parola - Parola de criptat
     * @returns {string} Parola criptata
     */

    static criptareParola(parola){
        return crypto.scryptSync(parola,Utilizator.parolaCriptare,Utilizator.lungimeCod).toString("hex");
    }

    /**
     * salveaza utilizatorul in baza de date
     */

    salvareUtilizator(){
        let parolaCriptata=Utilizator.criptareParola(this.parola);
        let utiliz=this;
        let token=parole.genereazaToken(100);
        AccesBD.getInstanta(Utilizator.tipConexiune).insert({tabel:Utilizator.tabel,
            campuri:{
                username:this.username,
                nume: this.nume,
                prenume:this.prenume,
                parola:parolaCriptata,
                email:this.email,
                culoare_chat:this.culoare_chat,
                cod:token,
                poza:this.poza,
                telefon: this.telefon,
                marca_preferata: this.marca_preferata
            }
            }, function(err, rez){
            if(err)
                console.log(err);
            else
                utiliz.trimiteMail("Te-ai inregistrat cu succes","Username-ul tau este "+utiliz.username,
            `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p> <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`,
            )
        });
    }
//xjxwhotvuuturmqm

    /**
     * Trimite un email utilizatorului
     * @param {string} subiect - Subiectul emailului
     * @param {string} mesajText - Mesajul text al emailului
     * @param {string} mesajHtml - Mesajul HTML al emailului
     * @param {Array} [atasamente=[]] - Atasamentele emailului
     */

    async trimiteMail(subiect, mesajText, mesajHtml, atasamente=[]){
        var transp= nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth:{//date login 
                user:Utilizator.emailServer,
                pass:"wtdpapuismswaxew"
            },
            tls:{
                rejectUnauthorized:false
            }
        });
        //genereaza html
        await transp.sendMail({
            from:Utilizator.emailServer,
            to:this.email, //TO DO
            subject:subiect,//"Te-ai inregistrat cu succes",
            text:mesajText, //"Username-ul tau este "+username
            html: mesajHtml,// `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
            attachments: atasamente
        })
        console.log("trimis mail");
    }
   
    /**
     * Obtine un utilizator dupa username in mod asincron
     * @param {string} username - Username-ul utilizatorului
     * @returns {Promise<Utilizator|null>} Promisiune cu utilizatorul gasit sau null
     */

    static async getUtilizDupaUsernameAsync(username){
        if (!username) return null;
        try{
            let rezSelect= await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync(
                {tabel:"utilizatori",
                campuri:['*'],
                conditiiAnd:[`username='${username}'`]
            });
            if(rezSelect.rowCount!=0){
                return new Utilizator(rezSelect.rows[0])
            }
            else {
                console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
                return null;
            }
        }
        catch (e){
            console.log(e);
            return null;
        }
        
    }


    /**
     * Obtine un utilizator dupa username
     * @param {string} username - Username-ul utilizatorului
     * @param {Object} obparam - Parametri suplimentari
     * @param {function} proceseazaUtiliz - Callback pentru procesarea utilizatorului
     * @returns {Utilizator|null} Utilizatorul gasit sau null
     */

    static getUtilizDupaUsername (username,obparam, proceseazaUtiliz){
        if (!username) return null;
        let eroare=null;
        AccesBD.getInstanta(Utilizator.tipConexiune).select(
                {tabel:"utilizatori",
                campuri:['*'],
                conditiiAnd:[`username='${username}'`]}
        , function (err, rezSelect){
            if(err){
                console.error("Utilizator:", err);
                //throw new Error()
                eroare=-2;
            }
            else if(rezSelect.rowCount==0){
                eroare=-1;
            }
            //constructor({id, username, nume, prenume, email, rol, culoare_chat="black", poza}={})
            let u= new Utilizator(rezSelect.rows[0])
            proceseazaUtiliz(u, obparam, eroare);
        });
    }

    areDreptul(drept){
        return this.rol.areDreptul(drept);
    }
}
module.exports={Utilizator:Utilizator}