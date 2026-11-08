// Finds an empty desktop (Space) on the screen you are on: first the current one, then only to the
// right (+1, +2, …). If there is none, creates a new one with Mission Control and switches to it. Used by rym-abrir.
// Prints: "<status> x1 y1 x2 y2", with that screen's visible area (Chrome coordinates).
//   status = here (the current one was already empty) | ok | new (created it) | none (could not create; went back)
//            | lost (could not go back either) | no-info
// Needs the Accessibility permission for "RYM Abrir" (sends ⌃← / ⌃→).
//
// Works with one screen and with an external monitor, with "Displays have separate Spaces" on or
// off: each key press is confirmed by reading which screen changed desktop (live via rym-espacios, not
// the plist, which macOS writes late: neither the file nor `defaults` works for this).
ObjC.import('AppKit');
ObjC.import('CoreGraphics');
ObjC.import('Foundation');

const app = Application.currentApplication();
app.includeStandardAdditions = true;
const se = Application('System Events');

// ---------- screens ----------
function pantallas() {
  const scr = $.NSScreen.screens;
  const H0 = scr.objectAtIndex(0).frame.size.height; // height of the main screen (coordinate origin)
  const out = [];
  for (let i = 0; i < scr.count; i++) {
    const s = scr.objectAtIndex(i);
    const id = ObjC.unwrap(s.deviceDescription.objectForKey('NSScreenNumber'));
    const uuid = ObjC.unwrap(ObjC.castRefToObject($.CFUUIDCreateString(null, $.CGDisplayCreateUUIDFromDisplayID(id))));
    const b = $.CGDisplayBounds(id);
    const vf = s.visibleFrame;
    out.push({
      uuid,
      main: id === $.CGMainDisplayID(),
      x: b.origin.x, y: b.origin.y, w: b.size.width, h: b.size.height,
      // visible area (no menu bar or Dock) in top-left coordinates, as Chrome uses them
      vis: [vf.origin.x, H0 - (vf.origin.y + vf.size.height), vf.origin.x + vf.size.width, H0 - vf.origin.y],
    });
  }
  return out;
}

function pantallaDe(mon, ps) {
  return ps.find(p => p.uuid === mon) || (mon === 'Main' && ps.find(p => p.main)) || ps.find(p => p.main) || ps[0];
}

function contiene(p, x, y) { return x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h; }

// Screen you are probably on: the frontmost window's; if there is none, the mouse's.
function pantallaActual(ps) {
  try {
    const proc = se.processes.whose({ frontmost: true })[0];
    const w = proc.windows[0];
    const [x, y] = w.position(), [ww, hh] = w.size();
    const p = ps.find(p => contiene(p, x + ww / 2, y + hh / 2));
    if (p) return p;
  } catch (e) {}
  const m = $.NSEvent.mouseLocation; // bottom-left origin
  const H0 = ps.find(p => p.main).h;
  return ps.find(p => contiene(p, m.x, H0 - m.y)) || ps.find(p => p.main);
}

// ---------- desktops ----------
function estado() { // live, via rym-espacios (CGSCopyManagedDisplaySpaces)
  return JSON.parse(app.doShellScript('$HOME/.local/bin/rym-espacios'))
    .filter(m => m.spaces.length && m.cur >= 0);
}

function monitorDe(p, mons) {
  if (mons.length === 1) return mons[0]; // one screen, or "separate Spaces" off
  return mons.find(m => m.id === p.uuid) || (p.main && mons.find(m => m.id === 'Main')) || mons[0];
}

// Sends a key and waits for some monitor to change desktop. Returns {mons, id} or null.
function paso(dir, antes) {
  se.keyCode(dir > 0 ? 124 : 123, { using: 'control down' }); // → : ←
  for (let t = 0; t < 20; t++) {
    delay(0.1);
    const mons = estado();
    const ch = mons.find(m => { const b = antes.find(x => x.id === m.id); return b && b.cur !== m.cur; });
    if (ch) { delay(0.5); return { mons, id: ch.id }; } // 0.5 s: let the animation finish
  }
  return null;
}

// ---------- is it empty? ----------
function vacio(p) {
  const arr = ObjC.castRefToObject($.CGWindowListCopyWindowInfo(
    $.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0));
  for (let i = 0; i < arr.count; i++) {
    const w = arr.objectAtIndex(i);
    if (ObjC.unwrap(w.objectForKey('kCGWindowLayer')) !== 0) continue;
    if (ObjC.unwrap(w.objectForKey('kCGWindowAlpha')) === 0) continue;
    const r = ObjC.deepUnwrap(w.objectForKey('kCGWindowBounds'));
    if (r.Width < 100 || r.Height < 100) continue;
    // count the window if a sizable part falls on this screen (not just the corner)
    const ix = Math.min(r.X + r.Width, p.x + p.w) - Math.max(r.X, p.x);
    const iy = Math.min(r.Y + r.Height, p.y + p.h) - Math.max(r.Y, p.y);
    if (ix > 50 && iy > 50) return false;
  }
  return true;
}

function vacioSeguro(p) { // two reads: during the animation the list can be incomplete
  if (!vacio(p)) return false;
  delay(0.3);
  return vacio(p);
}

// ---------- new desktop (Mission Control → "+") ----------
// Opens Mission Control, clicks the "+" in screen p's Spaces bar and exits with Esc.
// Returns the new desktop's id or null.
function nuevoEscritorio(p, monId) {
  const antes = (estado().find(m => m.id === monId) || { spaces: [] }).spaces;
  const txt = f => { try { return String(f() || ''); } catch (e) { return ''; } };
  let pedido = false, abierto = false;
  try {
    app.doShellScript('open -a "Mission Control"');
    pedido = true;
    const mc = se.processes.byName('Dock').groups.byName('Mission Control');
    for (let t = 0; t < 30 && !abierto; t++) { delay(0.1); try { abierto = mc.exists(); } catch (e) {} }
    if (!abierto) return null;
    delay(0.5); // opening animation
    // with several screens there is one group per screen: use the one on p
    const gs = mc.groups();
    const g = gs.find(x => {
      try { const [x0, y0] = x.position(), [w, h] = x.size(); return contiene(p, x0 + w / 2, y0 + h / 2); }
      catch (e) { return false; }
    }) || (gs.length === 1 ? gs[0] : null);
    if (!g) return null; // can't tell which bar belongs to this screen: better not to create one on another screen
    const bs = g.groups.byName('Spaces Bar').buttons();
    const btn = bs.find(b => /add|agreg|añad/i.test(txt(() => b.description()) + txt(() => b.name()))) || bs[0];
    btn.click();
    for (let t = 0; t < 30; t++) {
      delay(0.1);
      const m = estado().find(m => m.id === monId);
      const nuevo = m && m.spaces.find(s => !antes.includes(s));
      if (nuevo !== undefined) return nuevo;
    }
    return null;
  } catch (e) {
    return null;
  } finally {
    // Esc: exits Mission Control, also if it opened but its structure could not be read
    if (pedido) { se.keyCode(53); delay(0.7); }
  }
}

// ---------- main ----------
// Only searches to the right (+1, +2, …): the left side is almost always full.
function run() {
  const ps = pantallas();
  let p = pantallaActual(ps);
  const salida = (res, pant) => res + ' ' + pant.vis.map(Math.round).join(' ');
  // If the desktop you are on is already empty, open here without moving.
  if (vacioSeguro(p)) return salida('here', p);

  let mons = estado();
  if (!mons.length) return salida('no-info', p);
  const inicial = mons;
  let mon = monitorDe(p, mons);
  const posDe = () => { const m = mons.find(m => m.id === mon.id); return m.spaces.indexOf(m.cur); };
  const ultimo = () => mons.find(m => m.id === mon.id).spaces.length - 1;
  if (posDe() < 0) return salida('no-info', p);

  // First step to the right: also confirms which screen the keys move. With several screens it is
  // always tried (the guessed one may not be the one the keys move); with one, only if there is room.
  if (mons.length > 1 || posDe() < ultimo()) {
    const r = paso(+1, mons);
    if (r) {
      mons = r.mons;
      mon = mons.find(m => m.id === r.id);
      if (mons.length > 1) p = pantallaDe(r.id, ps); // with "separate Spaces" the screen is the one that changed
      if (vacioSeguro(p)) return salida('ok', p);
      while (posDe() >= 0 && posDe() < ultimo()) {
        const rr = paso(+1, mons);
        if (!rr) break; // the key did nothing
        mons = rr.mons;
        if (rr.id !== mon.id) break; // moved another screen
        if (vacioSeguro(p)) return salida('ok', p);
      }
    }
  }
  const ini = inicial.find(m => m.id === mon.id).cur;

  // Goes to the desktop with id `id` on mon's screen, with ⌃←/⌃→.
  const irA = id => {
    for (let k = 0; k < 40; k++) {
      const m = mons.find(m => m.id === mon.id);
      const a = m.spaces.indexOf(m.cur), b = m.spaces.indexOf(id);
      if (a < 0 || b < 0) return false;
      if (a === b) return true;
      const rr = paso(b > a ? +1 : -1, mons);
      if (!rr) return false;
      mons = rr.mons;
      if (rr.id !== mon.id) return false; // moved another screen
    }
    return false;
  };

  // No empty desktop to the right: create a new one and switch to it.
  const nuevo = nuevoEscritorio(p, mon.id);
  mons = estado();
  if (nuevo !== null && irA(nuevo)) return salida('new', p);
  // that failed: go back to the original (if that fails too, report "lost"; rym-abrir opens wherever it ended up)
  return salida(irA(ini) ? 'none' : 'lost', p);
}
