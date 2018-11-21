import Diel from "./diel";
const DEBUG = true;

export const diel = new Diel();
(<any>window).diel = diel;

if (!DEBUG) {
  console.log = () => {};
}
