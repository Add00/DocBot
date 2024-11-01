class Loggy {
  #verbose = false;

  constructor(verbose = false) {
    this.#verbose = verbose;
  }

  show(message, mode = 'out') {
    if (!this.#verbose) {
      return;
    }

    if (mode === 'out') {
      console.log(message);
    } else if (mode == 'err') {
      console.error(message);
    } else {
      throw new Error("Undefined Loggy mode, must be 'out' or 'err'");
    }
  }
}

export { Loggy };
