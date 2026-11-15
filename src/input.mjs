import { defaultKeys, defaultPad } from './content.mjs';

export class Input {
  constructor() {
    this.touch = {};
    this.keys = new Set();
    this.taps = new Set();
    this.buttons = new Set();
    this.direction = '';
    this.repeat = 0;
    addEventListener('keydown',e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code) &&
          !e.target.matches('button,input,select,textarea')) e.preventDefault();
      if (!e.repeat && (e.code === 'Escape' || !e.target.matches('select,input,textarea'))) this.taps.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup',e => this.keys.delete(e.code));
    addEventListener('blur',() => { this.keys.clear(); this.taps.clear(); this.releaseTouch(); });
  }
  releaseTouch() { this.touch = {}; }
  poll(deadzone, time, settings = {}) {
    const keys = settings.keys ?? defaultKeys;
    const padMap = settings.pad ?? defaultPad;
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(pad => pad?.connected);
    const current = new Set(Array.from(pad?.buttons ?? []).flatMap((button,i) => button.pressed ? [i] : []));
    const press = id => current.has(id) && !this.buttons.has(id);
    const take = (...codes) => codes.some(code => this.taps.has(code));
    let x = Number(this.keys.has(keys.right)||this.keys.has('ArrowRight'))-Number(this.keys.has(keys.left)||this.keys.has('ArrowLeft'));
    let y = Number(this.keys.has(keys.down)||this.keys.has('ArrowDown'))-Number(this.keys.has(keys.up)||this.keys.has('ArrowUp'));
    if (pad) {
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      const mag = Math.hypot(ax,ay);
      if (mag > deadzone && !x && !y) {
        const strength = Math.min(1,(mag-deadzone)/(1-deadzone));
        x = ax/mag * strength;
        y = ay/mag * strength;
      } else if (!x && !y) {
        x = Number(current.has(15))-Number(current.has(14));
        y = Number(current.has(13))-Number(current.has(12));
      }
    }
    const navX = take('ArrowLeft') ? -1 : take('ArrowRight') ? 1 : 0;
    const navY = take('ArrowUp') ? -1 : take('ArrowDown') ? 1 : 0;
    const stick = Math.abs(x) > .5 || Math.abs(y) > .5 ? (Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'down' : 'up') : (x > 0 ? 'right' : 'left')) : '';
    let nav = '';
    if (navY) nav = navY < 0 ? 'up' : 'down';
    else if (navX) nav = navX < 0 ? 'left' : 'right';
    else if (pad && stick && (this.direction !== stick || time >= this.repeat)) {
      nav = stick; this.repeat = time+(this.direction === stick ? 140 : 300);
    }
    this.direction = stick;
    const result = { x:x||this.touch.x||0,y:y||this.touch.y||0, nav, confirm: press(padMap.confirm), back: press(padMap.back) || take('Escape'),
      dash: press(padMap.dash) || take(keys.dash,'ShiftLeft','ShiftRight') || this.touch.dash,
      interact: press(padMap.interact) || take(keys.interact) || this.touch.interact, start: press(padMap.pause)||take(keys.pause), connected: !!pad,
      choice: [ 'Digit1','Digit2','Digit3' ].findIndex(code => this.taps.has(code)) };
    this.buttons = current;
    this.taps.clear();
    this.touch.dash = this.touch.interact = false;
    return result;
  }
}
