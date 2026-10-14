/* Injectable random source: production uses Math.random; tests can set a seed/source. */
globalThis.GameRng = (() => {
  let source = Math.random;
  return Object.freeze({
    random: () => source(),
    int: (min,max) => Math.floor(source()*(max-min+1))+min,
    setSource: (next) => { source = next; },
    reset: () => { source = Math.random; }
  });
})();
