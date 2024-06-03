/*

ATENTIE!
inca nu am implementat protectia contra SQL injection
*/

const { Client, Pool } = require("pg");

/**
 * Clasa Singleton pentru accesarea bazei de date
 */
class AccesBD {
    static #instanta = null;
    static #initializat = false;

    /**
     * Constructor care va arunca o eroare daca clasa a fost deja instantiata
     */

    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        }
        else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    /**
     * 
     * Initializează conexiunea locală la baza de date.
     */

    initLocal() {
        this.client = new Client({
            database: "cti_2024",
            user: "george",
            password: "george",
            host: "localhost",
            port: 5432
        });
        // this.client2= new Pool({database:"laborator",
        //         user:"irina", 
        //         password:"irina", 
        //         host:"localhost", 
        //         port:5432});
        this.client.connect();
    }

    /**
     * Returneaza clientul pentru baza de date
     *
     * @returns {Client} - clientul pentru baza de date
     * @throws {Error} - daca clasa nu a fost instantiata
     */

    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
     * @property {string} init - tipul de conexiune ("init", "render" etc.)
     * 
     * /

    /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} init - un obiect cu datele pentru query
     * @returns {AccesBD}
     */
    static getInstanta({ init = "local" } = {}) {
        console.log(this);//this-ul e clasa nu instanta pt ca metoda statica
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            //initializarea poate arunca erori
            //vom adauga aici cazurile de initializare 
            //pentru baza de date cu care vrem sa lucram
            try {
                switch (init) {
                    case "local": this.#instanta.initLocal();
                }
                //daca ajunge aici inseamna ca nu s-a produs eroare la initializare

            }
            catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }

        }
        return this.#instanta;
    }




    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */



    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Selecteaza inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    select({ tabel = "", campuri = [], conditiiAnd = [] } = {}, callback, parametriQuery = []) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error(comanda);
        /*
        comanda=`select id, camp1, camp2 from tabel where camp1=$1 and camp2=$2;
        this.client.query(comanda,[val1, val2],callback)

        */
        this.client.query(comanda, parametriQuery, callback)
    }


   /**
     * Selecteaza asincron inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     */

    async selectAsync({ tabel = "", campuri = [], conditiiAnd = [] } = {}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:", comanda);
        try {
            let rez = await this.client.query(comanda);
            console.log("selectasync: ", rez);
            return rez;
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }
    insert({ tabel = "", campuri = {} } = {}, callback) {
        /*
campuri={
    nume:"savarina",
    pret: 10,
    calorii:500
}
*/
        console.log("-------------------------------------------")
        console.log(Object.keys(campuri).join(","));
        console.log(Object.values(campuri).join(","));
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(",")}) values ( ${Object.values(campuri).map((x) => `'${x}'`).join(",")})`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
    * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
    * @property {string} tabel - numele tabelului
    * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
    * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
    */
    // update({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
    //     if(campuri.length!=valori.length)
    //         throw new Error("Numarul de campuri difera de nr de valori")
    //     let campuriActualizate=[];
    //     for(let i=0;i<campuri.length;i++)
    //         campuriActualizate.push(`${campuri[i]}='${valori[i]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     console.log(comanda);
    //     this.client.query(comanda,callback)
    // }

/**
 * @typedef {object} obiectQueryUpdate - Obiectul primit de funcțiile care realizează un query.
 * @property {string} tabel - Numele tabelului.
 * @property {string[]} campuri - Lista de stringuri cu numele coloanelor afectate de query; poate cuprinde și elementul "*".
 * @property {string[]} conditiiAnd - Lista de stringuri cu condiții pentru clauza WHERE.
 */

/**
 * Callback pentru query-uri.
 * @callback QueryCallBack
 * @param {Error} err - Eventuala eroare în urma query-ului.
 * @param {Object} rez - Rezultatul query-ului.
 */

/**
 * Actualizează înregistrările din baza de date.
 *
 * @param {obiectQueryUpdate} obj - Un obiect cu datele pentru query.
 * @param {function} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
 */

    
    update({ tabel = "", campuri = {}, conditiiAnd = [] } = {}, callback, parametriQuery) {
        let campuriActualizate = [];
        for (let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

/**
 * @typedef {object} obiectQueryUpdateSeparat - Obiect primit de functiile care realizeaza un query cu valori separate.
 * @property {string} tabel - Numele tabelului.
 * @property {string[]} campuri - O lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*".
 * @property {string[]} valori - O lista de stringuri cu valorile campurilor.
 * @property {string[]} conditiiAnd - Lista de stringuri cu conditii pentru clauza WHERE.
 */

/**
 * Callback pentru query-uri.
 * @callback queryCallback
 * @param {Error} err - Eventuala eroare in urma query-ului.
 * @param {Object} rez - Rezultatul query-ului.
 */

/**
 * Actualizeaza inregistrari din baza de date cu valori date separat.
 *
 * @param {obiectQueryUpdateSeparat} obj - Un obiect cu datele pentru query.
 * @param {function} callback - O functie callback cu 2 parametri: eroare si rezultatul query-ului.
 */



    updateParametrizat({ tabel = "", campuri = [], valori = [], conditiiAnd = [] } = {}, callback, parametriQuery) {
        if (campuri.length != valori.length)
            throw new Error("Numarul de campuri difera de nr de valori")
        let campuriActualizate = [];
        for (let i = 0; i < campuri.length; i++)
            campuriActualizate.push(`${campuri[i]}=$${i + 1}`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111", comanda);
        this.client.query(comanda, valori, callback)
    }


    //TO DO
    // updateParametrizat({tabel="",campuri={}, conditiiAnd=[]} = {}, callback, parametriQuery){
    //     let campuriActualizate=[];
    //     for(let prop in campuri)
    //         campuriActualizate.push(`${prop}='${campuri[prop]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     this.client.query(comanda,valori, callback)
    // }

/**
 * @typedef {object} obiectQueryDelete - Obiect primit de functiile care realizeaza o operatiune de stergere.
 * @property {string} tabel - Numele tabelului.
 * @property {string[]} conditiiAnd - Lista de stringuri cu conditii pentru clauza WHERE.
 */

/**
 * Callback pentru operatiunile de stergere.
 * @callback queryCallbackDelete
 * @param {Error} err - Eventuala eroare in urma operatiunii de stergere.
 * @param {Object} rez - Rezultatul operatiunii de stergere.
 */

/**
 * Sterge inregistrari din baza de date.
 *
 * @param {obiectQueryDelete} obj - Un obiect cu datele pentru operatiunea de stergere.
 * @param {function} callback - O functie callback cu 2 parametri: eroare si rezultatul operatiunii de stergere.
 */


    delete({ tabel = "", conditiiAnd = [] } = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }
/**
 * Executa o comanda catre baza de date.
 *
 * @param {string} comanda - Comanda SQL de executat.
 * @param {QueryCallback} callback - Functia de apel invers pentru gestionarea rezultatului executiei comenzii.
 */

    query(comanda, callback) {
        this.client.query(comanda, callback);
    }

}

module.exports = AccesBD;