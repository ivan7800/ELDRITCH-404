export class Sound {
  async unlock() {
    if (!this.context) {
      if (!globalThis.AudioContext) return;
      const ac = this.context = new AudioContext();
      this.music = ac.createGain();
      this.effects = ac.createGain();
      this.music.connect(ac.destination);
      this.effects.connect(ac.destination);
      this.music.gain.value = 0;
      this.effects.gain.value = 0;
    }
    if (this.context.state !== 'running') await this.context.resume().catch(() => {});
  }
  volume(settings) {
    if (!this.context) return;
    this.music.gain.setTargetAtTime(settings.music*.55,this.context.currentTime,.035);
    this.effects.gain.setTargetAtTime(settings.fx*.66,this.context.currentTime,.028);
  }
  tone(freq,end,length,volume,kind,bus,delay = 0) {
    if (this.context?.state !== 'running') return;
    const ac = this.context;
    const t = ac.currentTime+delay;
    const voice = ac.createOscillator();
    const envelope = ac.createGain();
    voice.type = kind;
    voice.frequency.setValueAtTime(freq,t);
    voice.frequency.exponentialRampToValueAtTime(end,t+length);
    envelope.gain.setValueAtTime(.0001,t);
    envelope.gain.exponentialRampToValueAtTime(volume,t+Math.min(.045,length*.24));
    envelope.gain.exponentialRampToValueAtTime(.0001,t+length);
    voice.connect(envelope).connect(bus);
    voice.start(t);
    voice.stop(t+length+.01);
    voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
  }
  score(phase, stage = 0) {
    if (this.context?.state !== 'running') return;
    const t = this.context.currentTime;
    const cue = phase+':'+stage;
    if (t < (this.next ?? 0) && cue === this.last) return;
    this.last = cue;
    this.next = t + (phase === 'boss' ? 1.58+stage*.045 : 3.5+stage*.12);
    const roots = [55,49,58.27,43.65,61.74,46.25,51.91,41.2,65.41,73.42];
    const low = roots[stage]*(phase==='boss'?.75:phase==='deep'?.84:1);
    const beat = (this.beat = ((this.beat ?? 0)+1)%4);
    this.tone(low,low*.99,phase === 'boss' ? 1.45 : 4.4,.17,'sine',this.music);
    this.tone(low*2.005,low*2,phase === 'boss' ? 1.3 : 3.6,.043,'triangle',this.music,.07);
    this.tone(low*[3,2.8,2.52,2][beat],low*[2.96,2.8,2.52,2][beat],2.15,.032,'sine',this.music,.4);
    if (phase === 'boss') this.tone(65,36,.36,.13,'triangle',this.music,.77);
    if (stage%3===1) this.tone(low*6.04,low*3,.83,.025,'triangle',this.music,.44);
    if (stage%3===2) this.tone(low*2.97,low*2.85,2.6,.04,'sine',this.music,1.08);
    if (phase==='victory') this.tone(low*8,low*8,.75,.059,'sine',this.music);
  }
  event(type, variant) {
    if (this.context?.state !== 'running') return;
    const t = this.context.currentTime;
    this.lastFx ??= new Map();
    const stamp = type+(variant ?? '');
    if (t-(this.lastFx.get(stamp) ?? -1) < (type === 'kill' ? .18 : .09)) return;
    this.lastFx.set(stamp,t);
    const cues = { dash:[220,48,.16,.05,'triangle'], hurt:[165,48,.25,.14,'sawtooth'], pickup:[690,1100,.12,.035,'sine'],
      kill:[100,42,.11,.035,'triangle'], blast:[95,31,.38,.14,'sawtooth'], level:[370,690,.41,.12,'sine'],
      'ritual-accept':[173,97,.8,.08,'triangle'], boss:[73,38,1,.2,'triangle'], 'boss-phase':[94,35,.85,.2,'sawtooth'], 'boss-tell':[168,232,.28,.075,'triangle'],
      won:[280,555,1.3,.15,'sine'], lost:[155,46,1.3,.13,'triangle'], click:[240,285,.12,.04,'triangle'],
      evolution:[282,740,.85,.13,'sine'] };
    const arms = { salt:[125,60,.1,.09,'sawtooth'], tempest:[141,37,.14,.11,'sawtooth'], bell:[280,180,.41,.09,'sine'],
      choir:[385,240,.6,.09,'sine'], mine:[310,165,.12,.05,'triangle'], harpoon:[240,100,.15,.055,'triangle'],
      lantern:[189,110,.37,.065,'triangle'] };
    const family = /^arm(\d+)_(\d+)$/.exec(variant??'');
    const fallback = family ? [115+Number(family[1])*23,65+Number(family[1])*10,.1+Number(family[2])*.05,.065,
      ['triangle','sine','sawtooth'][Number(family[1])%3]] : undefined;
    const cue = type === 'fire' ? arms[variant]??fallback : cues[type];
    if (cue) this.tone(...cue,this.effects);
  }
}
