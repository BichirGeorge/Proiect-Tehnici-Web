/**
 @typedef Drepturi
 @type {Object}
 @property {Symbol} vizualizareUtilizatori Dreptul de a intra pe  pagina cu tabelul de utilizatori.
 @property {Symbol} stergereUtilizatori Dreptul de a sterge un utilizator
 @property {Symbol} cumparareProduse Dreptul de a cumpara

 @property {Symbol} vizualizareGrafice Dreptul de a vizualiza graficele de vanzari
 @property {Symbol} gestionareComenzi Dreptul de a edita comnenzi
 @property {Symbol} gestionareProduse Dreptul de a edita produse
 @property {Symbol} gestionareUtilizatori Dreptul de a edita utlizatori
 */

/**
 * @name module.exports.Drepturi
 * @type Drepturi
 */
const Drepturi = {
	vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
	stergereUtilizatori: Symbol("stergereUtilizatori"),
	cumparareProduse: Symbol("cumparareProduse"),
	vizualizareGrafice: Symbol("vizualizareGrafice"),
	gestionareComenzi: Symbol("gestionareComenzi"),
	gestionareProduse: Symbol("gestionareProduse"),
	gestionareUtilizatori: Symbol("gestionareUtilizatori"),
  };
  
  module.exports = Drepturi;
  