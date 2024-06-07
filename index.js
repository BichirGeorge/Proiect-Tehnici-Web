const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const sass = require("sass");
const ejs = require("ejs");

const AccesBD = require("./module_proprii/accesbd.js");

const formidable = require("formidable");
const { Utilizator } = require("./module_proprii/utilizator.js");
const session = require("express-session");
const Drepturi = require("./module_proprii/drepturi.js");

const QRCode = require("qrcode");
const puppeteer = require("puppeteer");
const xmljs = require("xml-js");
const { MongoClient } = require("mongodb");

const Client = require("pg").Client;

var client = new Client({
  database: "cti_2024",
  user: "george",
  password: "george",
  host: "localhost",
  port: 5432,
});
client.connect();

client.query(
  "select * from unnest(enum_range(null:firme_masini))",
  function (err, rez) {
    console.log(rez); //Modific categ_prajitura
  },
);
/**
 * Obiect global care contine diverse proprietati legate de aplicatie.
 * @type {Object}
 * @property {Object} obErori - Obiect pentru gestionarea erorilor.
 * @property {Object} obImagini - Obiect pentru gestionarea imaginilor.
 * @property {string} folderCss - Calea catre folderul CSS.
 * @property {string} folderScss - Calea catre folderul SCSS.
 * @property {string} folderBackup - Calea catre folderul de backup.
 * @property {Array} optiuniMeniu - Array de optiuni de meniu.
 * @property {string} protocol - Protocolul folosit pentru aplicatie.
 * @property {string} numeDomeniu - Numele de domeniu.
 * @property {Object} clientMongo - Obiect client MongoDB.
 * @property {Object} bdMongo - Obiect baza de date MongoDB.
 */
obGlobal = {
  obErori: null,
  obImagini: null,
  folderCss: path.join(__dirname, "resurse/css"),
  folderScss: path.join(__dirname, "resurse/scss"),
  folderBackup: path.join(__dirname, "backup"),
  optiuniMeniu: [], // aici nush sigur daca trebuie o proprietate
  protocol: "http://",
  numeDomeniu: "localhost:8080",
  clientMongo: null,
  bdMongo: null,
};
/**
 * Conecteaza la serverul MongoDB și initializeaza baza de date MongoDB pentru proiect.
 * @param {string} uri - URI-ul pentru conectarea la serverul MongoDB.
 * @returns {void}
 */

const uri = "mongodb://localhost:27017";
obGlobal.clientMongo = new MongoClient(uri);
obGlobal.bdMongo = obGlobal.clientMongo.db("Proiect");

// Realizeaza o interogare pentru a obtine tipurile de produse si le salveaza in obiectul global optiuniMeniu.
client.query(
  "select * from unnest(enum_range(null::tipuri_produse))",
  function (err, rezCategorie) {
    if (err) {
      console.log(err);
    } else {
      obGlobal.optiuniMeniu = rezCategorie.rows;
    }
  },
);

// Creeaza folderele necesare daca acestea nu exista.

vect_foldere = ["temp", "temp1", "backup", "poze_uploadate"];
for (let folder of vect_foldere) {
  let caleFolder = path.join(__dirname, folder);
  if (!fs.existsSync(caleFolder)) {
    fs.mkdirSync(caleFolder);
  }
}

// Seteaza configuratia initiala pentru aplicatie folosind Express.

app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.use(
  session({
    // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: "abcdefg", //folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false,
  }),
);

// Middleware care adauga proprietati la obiectul res folosit in toate request-urile.

app.use("/*", function (req, res, next) {
  res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
  res.locals.Drepturi = Drepturi;
  if (req.session.utilizator) {
    req.utilizator = res.locals.utilizator = new Utilizator(
      req.session.utilizator,
    );
  }
  next();
});

// Seteaza view engine-ul pentru a folosi fisierele EJS.

app.set("view engine", "ejs");

// Seteaza rutele pentru a servi fisiere statice din directoarele specifice.

app.use("/resurse", express.static(__dirname + "/resurse"));
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

// --------------------------utilizatori online ------------------------------------------ Imi apare null cand pornesc serverul

/**
 * Returneaza adresa IP a utilizatorului.
 * @param {Object} req - Obiectul request.
 * @returns {string} - Adresa IP a utilizatorului.
 */

function getIp(req) {
  //pentru Heroku/Render
  var ip = req.headers["x-forwarded-for"]; //ip-ul userului pentru care este forwardat mesajul
  if (ip) {
    let vect = ip.split(",");
    return vect[vect.length - 1];
  } else if (req.ip) {
    return req.ip;
  } else {
    return req.connection.remoteAddress;
  }
}

/**
 * Middleware care inregistreaza accesul utilizatorilor si insereaza datele in baza de date.
 * @param {Object} req - Obiectul request.
 * @param {Object} res - Obiectul response.
 * @param {Function} next - Functia middleware urmatoare.
 */

app.all("/*", function (req, res, next) {
  let ipReq = getIp(req);
  if (ipReq) {
    var id_utiliz = req?.session?.utilizator?.id;
    //id_utiliz = id_utiliz ? id_utiliz : null;
    //console.log("id_utiliz", id_utiliz);
    // TO DO comanda insert (folosind AccesBD) cu  ip, user_id, pagina(url  din request)
    var obiectInsert = {
      ip: ipReq,
      pagina: req.url,
    };
    if (id_utiliz) {
      obiectInsert.user_id = id_utiliz;
    }
    AccesBD.getInstanta().insert({
      tabel: "accesari",
      campuri: obiectInsert,
    });
  }
  next();
});

/**
 * Sterge accesarile mai vechi de 10 minute din baza de date la fiecare 10 minute.
 */

function stergeAccesariVechi() {
  AccesBD.getInstanta().delete(
    {
      tabel: "accesari",
      conditiiAnd: ["now() - data_accesare >= interval '10 minutes' "],
    },
    function (err, rez) {
      console.log(err);
    },
  );
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 10 * 60 * 1000);

/**
 * Returneaza utilizatorii online in ultimele 5 minute.
 * @returns {Array} - Lista utilizatorilor online.
 */

async function obtineUtilizatoriOnline() {
  try {
    var rez = await client.query(
      "select username, nume, prenume from utilizatori where id in (select distinct user_id from accesari where now()-data_accesare <= interval '5 minutes')",
    );
    console.log(rez.rows);
    return rez.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Middleware care verifica daca utilizatorul este logat.
 * @param {Object} req - Obiectul request.
 * @param {Object} res - Obiectul response.
 * @param {Function} next - Functia middleware urmatoare
 */
app.use(function (req, res, next) {
  client.query(
    "select * from unnest(enum_range(null::tipuri_masini))",
    function (err, rezOpituni) {
      res.locals.optiuniMeniu = rezOpituni.rows;
      next();
    },
  );
});

//--------------------------------------locatie---------------------------------------

/**
 * Returneaza locatia utilizatorului bazandu-se pe adresa IP.
 * @returns {Promise<string>} - Locatia utilizatorului.
 */
async function obtineLocatie() {
  try {
    const response = await fetch(
      "https://secure.geobytes.com/GetCityDetails?key=7c756203dbb38590a66e01a5a3e1ad96&fqcn=109.99.96.15",
    );
    const obiectLocatie = await response.json();
    console.log(obiectLocatie);
    locatie =
      obiectLocatie.geobytescountry + " " + obiectLocatie.geobytesregion;
    return locatie;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Genereaza o lista de evenimente.
 * @returns {Array} - Lista de evenimente generate.
 */

function genereazaEvenimente() {
  var evenimente = [];
  var texteEvenimente = [
    "Eveniment important",
    "Festivitate",
    "Prajituri gratis",
    "Zi cu soare",
    "Aniversare",
  ];
  var dataCurenta = new Date();
  for (i = 0; i < texteEvenimente.length; i++) {
    evenimente.push({
      data: new Date(
        dataCurenta.getFullYear(),
        dataCurenta.getMonth(),
        Math.ceil(Math.random() * 27),
      ),
      text: texteEvenimente[i],
    });
  }
  return evenimente;
}

/**
 * Ruta pentru afisarea paginii principale.
 * @param {Object} req - Obiectul request.
 * @param {Object} res - Obiectul response.
 */

//8
app.get(["/", "/index", "/home"], async function (req, res) {
  res.render("pagini/index.ejs", {
    ip: req.ip,
    imagini: obGlobal.obImagini.imagini,
    useriOnline: await obtineUtilizatoriOnline(),
    locatie: await obtineLocatie(),
    evenimente: genereazaEvenimente(),
  });
});

//------------------Produse-----------------------------

// Ruta pentru afisarea paginii principale.
// @param {Object} req - Obiectul request.
// @param {Object} res - Obiectul response.
app.get("/produse", function (req, res) {
  console.log(req.query);
  var conditieQuery = "";
  if (req.query.tip) {
    conditieQuery = ` where tip='${req.query.tip}'`;
  }
  client.query(
    "select * from unnest(enum_range(null::firme_masini))",
    function (err, rezOptiuni) {
      client.query(
        `select * from masini ${conditieQuery}`,
        function (err, rez) {
          if (err) {
            console.log(err);
            afisareEroare(res, 2);
          } else {
            res.render("pagini/produse", {
              produse: rez.rows,
              optiuni: rezOptiuni.rows,
            });
          }
        },
      );
    },
  );
});

// Ruta pentru afisarea detaliilor unui produs.
app.get("/produs/:id", function (req, res) {
  client.query(
    `select * from masini where id=${req.params.id}`,
    function (err, rez) {
      if (err) {
        console.log(err);
        afisareEroare(res, 2);
      } else {
        res.render("pagini/produs", { prod: rez.rows[0] });
      }
    },
  );
});

// ---------------------------------  cos virtual --------------------------------------

// Middleware pentru gestionarea cererilor de produse in cosul virtual.

app.use(["/produse_cos", "/cumpara"], express.json({ limit: "2mb" })); //obligatoriu de setat pt request body de tip json

// Ruta pentru gestionarea cererilor de produse in cosul virtual.

app.post("/produse_cos", function (req, res) {
  console.log(req.body);
  if (req.body.ids_prod.length != 0) {
    //TO DO : cerere catre AccesBD astfel incat query-ul sa fie `select nume, descriere, pret, gramaj, imagine from prajituri where id in (lista de id-uri)`
    AccesBD.getInstanta().select(
      {
        tabel: "masini",
        campuri: "nume,descriere,pret,putere_motor,imagine".split(","),
        conditiiAnd: [`id in (${req.body.ids_prod})`],
      },
      function (err, rez) {
        if (err) res.send([]);
        else res.send(rez.rows);
      },
    );
  } else {
    res.send([]);
  }
});

// Generarea codurilor QR pentru produse.

cale_qr = __dirname + "/resurse/imagini/qrcode";
if (fs.existsSync(cale_qr))
  fs.rmSync(cale_qr, { force: true, recursive: true });
fs.mkdirSync(cale_qr);
client.query("select id from masini", function (err, rez) {
  for (let prod of rez.rows) {
    let cale_prod =
      obGlobal.protocol + obGlobal.numeDomeniu + "/produs/" + prod.id;
    //console.log(cale_prod);
    QRCode.toFile(cale_qr + "/" + prod.id + ".png", cale_prod);
  }
});

/**
 * Genereaza un document PDF pe baza unui string HTML si il salveaza la calea specificata.
 * @param {string} stringHTML - Stringul HTML din care se genereaza documentul PDF.
 * @param {string} numeFis - Calea unde va fi salvat documentul PDF.
 * @param {Function} callback - Functia de callback care va fi apelata dupa generarea documentului PDF.
 */

async function genereazaPdf(stringHTML, numeFis, callback) {
  const chrome = await puppeteer.launch();
  const document = await chrome.newPage();
  console.log("inainte load");
  //await document.setContent(stringHTML, {waitUntil:"load"});
  await document.setContent(stringHTML, { waitUntil: "load" });

  console.log("dupa load");
  await document.pdf({ path: numeFis, format: "A4" });

  console.log("dupa pdf");
  await chrome.close();

  console.log("dupa inchidere");
  if (callback) callback(numeFis);
}

/**
 * Insereaza factura in baza de date si trimite un email utilizatorului cu factura in format PDF.
 * @param {Object} req - Obiectul request.
 * @param {Object} rezultatRanduri - Rezultatul interogarii pentru produsele achizitionate.
 */

function insereazaFactura(req, rezultatRanduri) {
  rezultatRanduri.rows.forEach(function (elem) {
    elem.cantitate = 1;
  });
  let jsonFactura = {
    data: new Date(),
    username: req.session.utilizator.username,
    produse: rezultatRanduri.rows,
  };
  console.log("JSON factura", jsonFactura);
  if (obGlobal.bdMongo) {
    obGlobal.bdMongo
      .collection("facturi")
      .insertOne(jsonFactura, function (err, rezmongo) {
        if (err) console.log(err);
        else console.log("Am inserat factura in mongodb");

        obGlobal.bdMongo
          .collection("facturi")
          .find({})
          .toArray(function (err, rezInserare) {
            if (err) console.log(err);
            else console.log(rezInserare);
          });
      });
  }
}

/**
 * Middleware pentru gestionarea cererilor de cumparare a produselor.
 * @param {Object} req - Obiectul request.
 * @param {Object} res - Obiectul response.
 */

app.post("/cumpara", function (req, res) {
  console.log(req.body);

  if (req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)) {
    AccesBD.getInstanta().select(
      {
        tabel: "masini",
        campuri: ["*"],
        conditiiAnd: [`id in (${req.body.ids_prod})`],
      },
      function (err, rez) {
        if (!err && rez.rowCount > 0) {
          console.log("produse:", rez.rows);
          let rezFactura = ejs.render(
            fs.readFileSync("./views/pagini/factura.ejs").toString("utf-8"),
            {
              protocol: obGlobal.protocol,
              domeniu: obGlobal.numeDomeniu,
              utilizator: req.session.utilizator,
              produse: rez.rows,
            },
          );
          console.log(rezFactura);
          let numeFis = `./temp/factura${new Date().getTime()}.pdf`;
          genereazaPdf(rezFactura, numeFis, function (numeFis) {
            mesajText = `Stimate ${req.session.utilizator.username} aveti mai jos factura.`;
            mesajHTML = `<h2>Stimate ${req.session.utilizator.username},</h2> aveti mai jos factura.`;
            req.utilizator.trimiteMail("Factura", mesajText, mesajHTML, [
              {
                filename: "factura.pdf",
                content: fs.readFileSync(numeFis),
              },
            ]);
            res.send("Totul e bine!");
          });
          insereazaFactura(req, rez);
        }
      },
    );
  } else {
    res.send("Nu puteti cumpara daca nu sunteti logat sau nu aveti dreptul!");
  }
});

/// ------------------------------------ utilizatori -------------------------------------------

// Functia care gestioneaza inregistrarea unui utilizator

app.post("/inregistrare", function (req, res) {
  var username;
  var poza;
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    //4
    console.log("Inregistrare:", campuriText);

    console.log(campuriFisier);
    console.log(poza, username);
    var eroare = "";

    // TO DO var utilizNou = creare utilizator
    var utilizNou = new Utilizator({});
    try {
      utilizNou.setareNume = campuriText.nume[0];
      utilizNou.setareUsername = campuriText.username[0];
      utilizNou.email = campuriText.email[0];
      utilizNou.prenume = campuriText.prenume[0];

      utilizNou.parola = campuriText.parola[0];
      utilizNou.culoare_chat = campuriText.culoare_chat[0];
      utilizNou.poza = poza;
      utilizNou.telefon = campuriText.telefon[0];
      utilizNou.marca_preferata = campuriText.marca_preferata[0];
      Utilizator.getUtilizDupaUsername(
        campuriText.username[0],
        {},
        function (u, parametru, eroareUser) {
          if (eroareUser == -1) {
            //nu exista username-ul in BD
            //TO DO salveaza utilizator
            utilizNou.salvareUtilizator();
          } else {
            eroare += "Mai exista username-ul";
          }

          if (!eroare) {
            res.render("pagini/inregistrare", {
              raspuns: "Inregistrare cu succes!",
            });
          } else
            res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
        },
      );
    } catch (e) {
      console.log(e);
      eroare += "Eroare site; reveniti mai tarziu";
      console.log(eroare);
      res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
    }
  });
  formular.on("field", function (nume, val) {
    // 1

    console.log(`--- ${nume} = ${val}`);

    if (nume == "username") username = val;
  });
  formular.on("fileBegin", function (nume, fisier) {
    //2
    console.log("fileBegin");

    console.log(nume, fisier);
    //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
    //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
    var folderUser = path.join(__dirname, "poze_uploadate", username);
    if (!fs.existsSync(folderUser)) {
      fs.mkdirSync(folderUser);
    }

    fisier.filepath = path.join(folderUser, fisier.originalFilename);
    poza = fisier.originalFilename;
    //fisier.filepath=folderUser+"/"+fisier.originalFilename
    console.log("fileBegin:", poza);
    console.log("fileBegin, fisier:", fisier);
  });
  formular.on("file", function (nume, fisier) {
    //3
    console.log("file");
    console.log(nume, fisier);
  });
});

// Functia care gestioneaza logarea utilizatorului

app.post("/login", function (req, res) {
  /*TO DO
        testam daca a confirmat mailul
    */
  var username;
  console.log("ceva");
  var formular = new formidable.IncomingForm();

  formular.parse(req, function (err, campuriText, campuriFisier) {
    var parametriCallback = {
      req: req,
      res: res,
      parola: campuriText.parola[0],
    };
    Utilizator.getUtilizDupaUsername(
      campuriText.username[0],
      parametriCallback,
      function (u, obparam, eroare) {
        //proceseazaUtiliz
        let parolaCriptata = Utilizator.criptareParola(obparam.parola);
        if (u.parola == parolaCriptata && u.confirmat_mail) {
          u.poza = u.poza
            ? path.join("poze_uploadate", u.username, u.poza)
            : "";
          obparam.req.session.utilizator = u;
          obparam.req.session.mesajLogin = "Bravo! Te-ai logat!";
          obparam.res.redirect("/index");
        } else {
          console.log("Eroare logare");
          obparam.req.session.mesajLogin =
            "Date logare incorecte sau nu a fost confirmat mailul!";
          obparam.res.redirect("/index");
        }
      },
    );
  });
});

// Functia care gestioneaza actualizarea profilului utilizatorului
app.post("/profil", function (req, res) {
  console.log("profil");
  if (!req.session.utilizator) {
    afisareEroare(res, 403);
    //res.render("pagini/eroare_generala", { text: "Nu sunteti logat." });
    return;
  }
  var formular = new formidable.IncomingForm();

  formular.parse(req, function (err, campuriText, campuriFile) {
    var parolaCriptata = Utilizator.criptareParola(campuriText.parola[0]);

    AccesBD.getInstanta().updateParametrizat(
      {
        tabel: "utilizatori",
        campuri: [
          "nume",
          "prenume",
          "email",
          "culoare_chat",
          "telefon",
          "marca_preferata",
        ],
        valori: [
          `${campuriText.nume[0]}`,
          `${campuriText.prenume[0]}`,
          `${campuriText.email[0]}`,
          `${campuriText.culoare_chat[0]}`,
          `${campuriText.telefon[0]}`,
          `${campuriText.marca_preferata[0]}`,
        ],
        conditiiAnd: [
          `parola = '${parolaCriptata}'`,
          `username = '${campuriText.username[0]}'`,
        ],
      },
      function (err, rez) {
        if (err) {
          console.log(err);
          afisareEroare(res, 2);
          return;
        }
        console.log(rez.rowCount);
        if (rez.rowCount == 0) {
          res.render("pagini/profil", {
            mesaj: "Update-ul nu s-a realizat. Verificati parola introdusa.",
          });
          return;
        } else {
          //actualizare sesiune
          console.log("ceva");
          req.session.utilizator.nume = campuriText.nume[0];
          req.session.utilizator.prenume = campuriText.prenume[0];
          req.session.utilizator.email = campuriText.email[0];
          req.session.utilizator.culoare_chat = campuriText.culoare_chat[0];
          req.session.utilizator.telefon = campuriText.telefon[0];
          req.session.utilizator.marca_preferata =
            campuriText.marca_preferata[0];
          res.locals.utilizator = req.session.utilizator;
        }

        res.render("pagini/profil", {
          mesaj: "Update-ul s-a realizat cu succes.",
        });
      },
    );
  });
});

// Functia care gestioneaza afisarea utilizatorilor

app.get("/useri", function (req, res) {
  /* TO DO
   * in if testam daca utilizatorul din sesiune are dreptul sa vizualizeze utilizatori
   * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
   */
  if (req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)) {
    var obiectComanda = {
      tabel: "utilizatori",
      campuri: ["*"],
      conditiiAnd: [],
    };
    AccesBD.getInstanta().select(obiectComanda, function (err, rezQuery) {
      console.log(err);
      res.render("pagini/useri", { useri: rezQuery.rows });
    });
  } else {
    afisareEroare(res, 403);
  }
});

// Functia care gestioneaza stergerea unui utilizator

app.post("/sterge_utiliz", function (req, res) {
  /* TO DO
   * in if testam daca utilizatorul din sesiune are dreptul sa stearga utilizatori
   * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
   */
  if (req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)) {
    var formular = new formidable.IncomingForm();

    formular.parse(req, function (err, campuriText, campuriFile) {
      var obiectComanda = {
        tabel: "utilizatori",
        conditiiAnd: [`id=${campuriText.id_utiliz[0]}`],
      };
      AccesBD.getInstanta().delete(obiectComanda, function (err, rezQuery) {
        console.log(err);
        res.redirect("/useri");
      });
    });
  } else {
    afisareEroare(res, 403);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////
//////////////// Contact

// Middleware pentru parsarea datelor trimise prin formularul de contact

app.use(["/contact"], express.urlencoded({ extended: true }));

// Calea catre fisierul XML in care sunt stocate mesajele de contact

caleXMLMesaje = "resurse/xml/contact.xml";
headerXML = `<?xml version="1.0" encoding="utf-8"?>`;

// Functie pentru crearea fisierului XML de contact, daca acesta nu exista

function creeazaXMlContactDacaNuExista() {
  if (!fs.existsSync(caleXMLMesaje)) {
    let initXML = {
      declaration: {
        attributes: {
          version: "1.0",
          encoding: "utf-8",
        },
      },
      elements: [
        {
          type: "element",
          name: "contact",
          elements: [
            {
              type: "element",
              name: "mesaje",
              elements: [],
            },
          ],
        },
      ],
    };
    let sirXml = xmljs.js2xml(initXML, { compact: false, spaces: 4 }); //obtin sirul xml (cu taguri)
    console.log(sirXml);
    fs.writeFileSync(caleXMLMesaje, sirXml);
    return false; //l-a creat
  }
  return true; //nu l-a creat acum
}

// Functie pentru parsarea mesajelor din fisierul XML de contact

function parseazaMesaje() {
  let existaInainte = creeazaXMlContactDacaNuExista();
  let mesajeXml = [];
  let obJson;
  if (existaInainte) {
    let sirXML = fs.readFileSync(caleXMLMesaje, "utf8");
    obJson = xmljs.xml2js(sirXML, { compact: false, spaces: 4 });

    let elementMesaje = obJson.elements[0].elements.find(function (el) {
      return el.name == "mesaje";
    });
    let vectElementeMesaj = elementMesaje.elements
      ? elementMesaje.elements
      : []; // conditie ? val_true: val_false
    console.log(
      "Mesaje: ",
      obJson.elements[0].elements.find(function (el) {
        return el.name == "mesaje";
      }),
    );
    let mesajeXml = vectElementeMesaj.filter(function (el) {
      return el.name == "mesaj";
    });
    return [obJson, elementMesaje, mesajeXml];
  }
  return [obJson, [], []];
}

// Functia care gestioneaza afisarea paginii de contact

app.get("/contact", function (req, res) {
  let obJson, elementMesaje, mesajeXml;
  [obJson, elementMesaje, mesajeXml] = parseazaMesaje();

  res.render("pagini/contact", {
    utilizator: req.session.utilizator,
    mesaje: mesajeXml,
  });
});

// Functia care gestioneaza trimiterea unui mesaj prin formularul de contact

app.post("/contact", function (req, res) {
  let obJson, elementMesaje, mesajeXml;
  [obJson, elementMesaje, mesajeXml] = parseazaMesaje();

  let u = req.session.utilizator ? req.session.utilizator.username : "anonim";
  let mesajNou = {
    type: "element",
    name: "mesaj",
    attributes: {
      username: u,
      data: new Date(),
    },
    elements: [{ type: "text", text: req.body.mesaj }],
  };
  if (elementMesaje.elements) elementMesaje.elements.push(mesajNou);
  else elementMesaje.elements = [mesajNou];
  console.log(elementMesaje.elements);
  let sirXml = xmljs.js2xml(obJson, { compact: false, spaces: 4 });
  console.log("XML: ", sirXml);
  fs.writeFileSync("resurse/xml/contact.xml", sirXml);

  res.render("pagini/contact", {
    utilizator: req.session.utilizator,
    mesaje: elementMesaje.elements,
  });
});
///////////////////////////////////////////////////////

// Functia care gestioneaza delogarea utilizatorului

app.get("/logout", function (req, res) {
  req.session.destroy();
  res.locals.utilizator = null;
  res.render("pagini/logout");
});

//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}

// Functia care gestioneaza confirmarea adresei de email a utilizatorului

app.get("/cod/:username/:token", function (req, res) {
  /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
        setat parametriCerere pentru a verifica daca tokenul corespunde userului
    */
  console.log(req.params);
  try {
    var parametriCallback = {
      req: req,
      token: req.params.token,
    };
    Utilizator.getUtilizDupaUsername(
      req.params.username,
      parametriCallback,
      function (u, obparam) {
        let parametriCerere = {
          tabel: "utilizatori",
          campuri: { confirmat_mail: true },
          conditiiAnd: [`cod='${obparam.token}'`],
        };
        AccesBD.getInstanta().update(
          parametriCerere,
          function (err, rezUpdate) {
            if (err || rezUpdate.rowCount == 0) {
              console.log("Cod:", err);
              afisareEroare(res, 3);
            } else {
              res.render("pagini/confirmare.ejs");
            }
          },
        );
      },
    );
  } catch (e) {
    console.log(e);
    afisareEroare(res, 2);
  }
});

//termeni si conditii
app.get("/termeni_si_conditii", function (req, res) {
  res.render("pagini/termeni_si_conditii");
});
//confidentialitate
app.get("/confidentialitate", function (req, res) {
  res.render("pagini/confidentialitate");
});

app.get("/login", function (req, res) {
  if (req.session.utilizator) {
    return res.redirect("/profil");
  }
  res.render("pagini/login");
});

//transmiterea unui mesaj fix
app.get("/cerere", function (req, res) {
  res.send("<b>Hello!</b><span color: style = 'color:red'>world!</span>");
});
//transmiterea unui mesaj dinamic
app.get("/data", function (req, res, next) {
  res.write("Data: ");
  next();
});

// Functia care returneaza data curenta

app.get("/data", function (req, res) {
  res.write("" + new Date());
  res.end();
});

// Functia care calculeaza suma a doua valori primite ca parametri si o returneaza

app.get("/suma/:a/:b", function (req, res) {
  var suma = parseInt(req.params.a) + parseInt(req.params.b);
  res.send("" + suma);
});

// Functia care returneaza favicon-ul

app.get("/favicon.ico", function (req, res) {
  res.sendFile(path.join(__dirname, "resurse/imagini/favicon.ico"));
});

//17
// Functia care afiseaza o eroare pentru URL-urile care respecta un anumit pattern

app.get(new RegExp("^/[a-z0-9A-Z/]*/$"), function (req, res) {
  afisareEroare(res, 403);
});
//19
// Functia care afiseaza o eroare pentru URL-urile care au extensia .ejs

app.get("/*.ejs", function (req, res) {
  afisareEroare(res, 400);
});

//9 , 10
// Functia care afiseaza continutul paginii sau o eroare pentru URL-urile care nu corespund altor pattern-uri

app.get("/*", function (req, res) {
  console.log(req.url);
  //res.send("whatever");
  try {
    res.render("pagini" + req.url, function (err, rezHtml) {
      console.log(rezHtml);
      console.log("Eroare:" + err);
      if (err) {
        if (err.message.startsWith("Failed to lookup view")) {
          afisareEroare(res, 404);
          console.log("Nu a gasit pagina: ", req.url);
        }
      } else {
        res.send(rezHtml + "");
      }
    });
  } catch (err1) {
    if (err1.message.startsWith("Failed to lookup view")) {
      afisareEroare(res, 404);
      console.log("Nu a gasit resursa: ", req.url);
    } else {
      afisareEroare(res);
    }
  }
});
//11
// Functia care initializeaza erorile dintr-un fisier JSON

function initErori() {
  var continut = fs
    .readFileSync(path.join(__dirname, "resurse/json/erori.json"))
    .toString("utf-8");
  console.log(continut);
  obGlobal.obErori = JSON.parse(continut);
  for (let eroare of obGlobal.obErori.info_erori) {
    eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
  }
  console.log(obGlobal.obErori);
  obGlobal.obErori.eroare_default.imagine = path.join(
    obGlobal.obErori.cale_baza,
    obGlobal.obErori.eroare_default.imagine,
  );
}

initErori();

// Functia care afiseaza o eroare pe baza unui identificator dat

function afisareEroare(res, _identificator, _titlu, _text, _imagine) {
  // Cautam eroarea in lista de erori pe baza identificatorului
  let eroare = obGlobal.obErori.info_erori.find(function (elem) {
    return elem.identificator == _identificator;
  });
  // Daca nu gasim eroarea, folosim eroarea default
  if (!eroare) {
    let eroare_default = obGlobal.obErori.eroare_default;
    res.render("pagini/eroare", {
      titlu: _titlu || eroare_default.titlu,
      text: _text || eroare_default.text,
      imagine: _imagine || eroare_default.imagine,
    });
  }
  // Daca gasim eroarea, folosim informatiile acesteia pentru afisarea
  else {
    if (eroare.status) {
      res.status(eroare.identificator);
    }
    res.render("pagini/eroare", {
      titlu: _titlu || eroare.titlu,
      text: _text || eroare.text,
      imagine: _imagine || eroare.imagine,
    });
  }
}

// Functia care initializeaza imaginile din fisierul JSON de galerie
function initImagini() {
  // Citim continutul fisierului JSON de galerie
  var continut = fs
    .readFileSync(__dirname + "/resurse/json/galerie.json")
    .toString("utf-8");
  // Parsam continutul JSON si il salvam in obiectul global obImagini
  obGlobal.obImagini = JSON.parse(continut);
  let vImagini = obGlobal.obImagini.imagini;
  // Calculam calea absoluta catre directorul de imagini si directorul de imagini medii
  let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
  let caleAbsMediu = path.join(
    __dirname,
    obGlobal.obImagini.cale_galerie,
    "mediu",
  );
  // Cream directorul de imagini medii daca nu exista
  if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu);

  // Iteram prin fiecare imagine din lista de imagini
  //for (let i=0; i< vErori.length; i++ )
  for (let imag of vImagini) {
    // Extragem numele fisierului si extensia imaginii
    [numeFis, ext] = imag.fisier.split(".");
    // Calculam calea absoluta catre fisierul original si calea absoluta catre fisierul de imagine medie
    let caleFisAbs = path.join(caleAbs, imag.fisier);
    let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
    // Redimensionam imaginea originala si o salvam ca imagine medie
    sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
    // Actualizam calea catre fisierul de imagine medie si calea catre fisierul original in obiectul imaginii
    imag.fisier_mediu = path.join(
      "/",
      obGlobal.obImagini.cale_galerie,
      "mediu",
      numeFis + ".webp",
    );
    imag.fisier = path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier);
  }
}
initImagini();

/**
 * Functia compileazaScss compileaza un fisier .scss in fisier .css folosind biblioteca sass
 * @param {string} caleScss - Calea fisierului .scss de intrare
 * @param {string} caleCss - Calea fisierului .css de iesire (optional, daca nu este furnizat, se va genera un nume de fisier .css pe baza numelui fisierului .scss de intrare)
 * @returns {void} - Nu returneaza nimic, dar genereaza un fisier .css la calea specificata
 */
function compileazaScss(caleScss, caleCss) {
  console.log("cale:", caleCss);
  if (!caleCss) {
    let numeFisExt = path.basename(caleScss);
    let numeFis = numeFisExt.split(".")[0]; /// "a.scss"  -> ["a","scss"]
    caleCss = numeFis + ".css";
  }

  if (!path.isAbsolute(caleScss))
    caleScss = path.join(obGlobal.folderScss, caleScss);
  if (!path.isAbsolute(caleCss))
    caleCss = path.join(obGlobal.folderCss, caleCss);

  let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
  if (!fs.existsSync(caleBackup)) {
    fs.mkdirSync(caleBackup, { recursive: true });
  }

  // la acest punct avem cai absolute in caleScss si  caleCss
  //TO DO
  let numeFisCss = path.basename(caleCss);
  if (fs.existsSync(caleCss)) {
    fs.copyFileSync(
      caleCss,
      path.join(obGlobal.folderBackup, "resurse/css", numeFisCss),
    ); // +(new Date()).getTime()
  }
  rez = sass.compile(caleScss, { sourceMap: true });
  fs.writeFileSync(caleCss, rez.css);
  //console.log("Compilare SCSS",rez);
}
// Itereaza prin fisierele din folderul de scss si compileaza fiecare fisier .scss gasit
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
  if (path.extname(numeFis) == ".scss") {
    compileazaScss(numeFis);
  }
}

/**
 * Aici se foloseste metoda fs.watch pentru a urmari schimbarile in folderul obGlobal.folderScss.
 * Cand se detecteaza un eveniment de "change" sau "rename", se compileaza fisierul .scss corespunzator.
 */

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
  console.log(eveniment, numeFis);
  if (eveniment == "change" || eveniment == "rename") {
    let caleCompleta = path.join(obGlobal.folderScss, numeFis);
    if (fs.existsSync(caleCompleta)) {
      compileazaScss(caleCompleta);
    }
  }
});
//Se porneste serverul pe portul 8080 si se afiseaza un mesaj de confirmare in consola.
app.listen(8080);
console.log("Serverul a pornit");
