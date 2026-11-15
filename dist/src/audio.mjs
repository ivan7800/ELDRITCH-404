const roots = [55,49,58.27,43.65,61.74,46.25,51.91,41.2,65.41,73.42];
const bassline = [0,0,3,0,7,0,5,3,0,-2,3,0,5,3,0,-2];
const intervals = [0,2,-2,5,3,-3,7,-5,4,-4];

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
  // Tide and encounter changes restart the phrase. Sanity changes the harmony without resetting the beat.
  score(phase, stage = 0, sanity = 100, second = false) {
    if (this.context?.state !== 'running') return;
    const now=this.context.currentTime;
    const state=phase+':'+stage+':'+second;
    const tempo=phase==='boss' ? (second?.26:.32) : phase==='deep'?.42:phase==='tide'?.52:.66;
    if (state!==this.last) { this.last=state; this.next=now; this.beat=0; }
    if (now<(this.next??0)) return;
    this.next=now+tempo;
    const root=roots[stage]??55;
    const step=this.beat++%16;
    const note = bassline[(step+stage*3)%16]+(intervals[stage] ?? 0);
    const frequency=root*4*Math.pow(2,note/12);
    this.tone(root,root*.985,tempo*.92,phase==='boss'?.11:.075,'triangle',this.music);
    if (step%4===0) {
      this.tone(root/2,root/3,tempo*.8,.1,'sine',this.music);
      this.tone(root*2,root*1.996,tempo*3.6,.042,'sine',this.music);
      if (phase==='menu' || phase==='tide') this.tone(root*3.002,root*3,tempo*3.3,.024,'triangle',this.music);
    }
    if(step%2===0 || phase==='boss') this.tone(frequency,frequency*.998,tempo*.75,
      phase==='boss'?.044:.031,step%4===0?'triangle':'sine',this.music);
    if(phase==='boss' && step%4===2) this.tone(root*1.01,root*.5,tempo*.3,.062,'sawtooth',this.music);
    if (phase==='tide' && step%4===3) this.tone(frequency*1.498,frequency*1.5,tempo*.44,.028,'triangle',this.music);
    if (phase==='deep' && step%4===1) this.tone(root*2,root*.85,tempo*.64,.054,'triangle',this.music);
    if (sanity<=55 && step%4===3) this.tone(frequency*(sanity<=28?1.06:1.013),frequency*.98,tempo*.95,.029,'sine',this.music);
    if(phase==='victory' && step%4===0) this.tone(root*8,root*8,tempo*2,.05,'sine',this.music);
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
      'ritual-accept':[173,97,.8,.08,'triangle'], discovery:[523,784,.48,.07,'triangle'], boss:[73,38,1,.2,'triangle'], 'boss-phase':[94,35,.85,.2,'sawtooth'], 'boss-tell':[168,232,.28,.075,'triangle'],
      won:[280,555,1.3,.15,'sine'], lost:[155,46,1.3,.13,'triangle'], click:[240,285,.12,.04,'triangle'],
      'harbour-tide':[69,37,1.7,.16,'triangle'], 'sanity-low':[107,59,1.15,.13,'sawtooth'],
      evolution:[282,740,.85,.13,'sine'] };
    const arms = { salt:[125,60,.1,.09,'sawtooth'], tempest:[141,37,.14,.11,'sawtooth'], bell:[280,180,.41,.09,'sine'],
      choir:[385,240,.6,.09,'sine'], mine:[310,165,.12,.05,'triangle'], harpoon:[240,100,.15,.055,'triangle'],
      lantern:[189,110,.37,.065,'triangle'] };
    const family = /^arm(\d+)_(\d+)$/.exec(variant??'');
    const fallback = family ? [115+Number(family[1])*23,65+Number(family[1])*10,.1+Number(family[2])*.05,.065,
      ['triangle','sine','sawtooth'][Number(family[1])%3]] : undefined;
    const cue = type === 'fire' ? arms[variant]??fallback : cues[type];
    if (cue) this.tone(...cue,this.effects);
    if (type==='boss-tell' && variant==='surge') this.tone(88,44,.46,.17,'triangle',this.effects,.12);
    if (type==='boss' || type==='boss-phase') {
      const motif = /[0-9]+$/.exec(variant ?? '');
      const root = roots[Number(motif?.[0] ?? 0)];
      this.tone(root*4,root*(type==='boss'?2.98:2.12),.7,.06,'triangle',this.effects,.15);
    }
  }
}
