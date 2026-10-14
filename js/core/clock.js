/* One small owner for game timers; its handles are still disposable individually. */
globalThis.GameClock = Object.freeze({
  every:(callback,ms)=>setInterval(callback,ms), after:(callback,ms)=>setTimeout(callback,ms),
  cancel:(handle)=>{ clearInterval(handle); clearTimeout(handle); }
});
