/* ================== Saday Client App ================== */
const { createApp, ref, reactive, computed, onMounted, watch, h } = Vue;

/* ---------- Simulated content ---------- */
const CLUSTERS = [
  { id:'sad', label:'Feeling sad, empty, or losing interest', sub:'Low mood that lingers' },
  { id:'anx', label:'Worry, anxiety, or fear that\'s hard to control', sub:'On edge, restless thoughts' },
  { id:'mood', label:'Extreme mood swings — very high and very low', sub:'Energy that crashes hard' },
  { id:'focus', label:'Trouble focusing, restless, acting without thinking (ADHD-type)', sub:'Mind that won\'t settle' },
  { id:'sub', label:'Drinking, substance use, or feeling unable to stop', sub:'Confidential — no judgment' },
  { id:'tr', label:'Something traumatic that keeps coming back', sub:'Memories that intrude' },
  { id:'ocd', label:'Thoughts or urges that repeat (e.g. handwashing, checking, intrusive thoughts)', sub:'Hard to let go of' },
  { id:'psy', label:'Seeing, hearing, or believing things others say aren\'t real', sub:'We\'ll listen carefully', red:true },
  { id:'cog', label:'Memory problems, confusion, or unclear thinking', sub:'Difficulty holding details' },
  { id:'eat', label:'Difficult relationship with food or your body', sub:'Eating, body image' },
  { id:'rel', label:'Intense emotional pain in relationships, or not knowing who you are', sub:'Feels overwhelming' },
  { id:'burn', label:'Complete exhaustion, burnout, or feeling overwhelmed', sub:'Running on empty' },
  { id:'sleep', label:'Sleep problems that are affecting your life', sub:'Insomnia, oversleeping, nightmares' },
  { id:'sexual', label:'Concerns about sexual health, intimacy, or sexual functioning', sub:'Sensitive — private', privacy:true },
  { id:'else', label:'Something else I haven\'t seen here', sub:'Tell us in your own words' },
  { id:'unsure', label:'I\'m not sure — I just know something is wrong', sub:'That\'s okay to start here' },
];

const PROXY_CLUSTERS = [
  { id:'memloss', label:'Memory loss, forgetting recent events, confusion about time or place', sub:'e.g., dementia, MCI' },
  { id:'delirium', label:'Becoming very confused suddenly or over a short time', sub:'Possible medical emergency', red:true },
  { id:'proxy_focus', label:'Restlessness, inattention, impulsivity — unable to sit still or focus', sub:'e.g., ADHD in children or adults' },
  { id:'autism', label:'Limited speech, avoiding eye contact, repetitive behaviours, sensory sensitivities', sub:'e.g., autism spectrum' },
  { id:'devdelay', label:'Below-expected development, learning difficulties, trouble with daily tasks', sub:'e.g., intellectual disability' },
  { id:'behav', label:'Aggression, tantrums, defiance, behavioural problems at home or school', sub:'Challenging behaviour' },
  { id:'proxy_psy', label:'Muttering to self, laughing/talking without clear reason, seeing/hearing things', sub:'Poor insight, high-risk', red:true },
  { id:'mania', label:'Extremely elated, not needing sleep, talking very fast, reckless behaviour', sub:'Possible mania' },
  { id:'proxy_dep', label:'Very sad, withdrawn, not eating, not speaking — lasting more than 2 weeks', sub:'Severe depression' },
  { id:'proxy_bpd', label:'Intense anger in relationships, extreme fear of abandonment, self-harm', sub:'Personality disorder traits' },
  { id:'proxy_sub', label:'Drinking, substance use that the person denies or refuses to address', sub:'Substance concern' },
  { id:'proxy_ocd', label:'Repeatedly washing hands, checking, or arranging despite knowing it\'s excessive', sub:'Poor insight in the person' },
  { id:'dissoc', label:'Sudden episodes of acting out a different identity, amnesia, or unusual body symptoms', sub:'Dissociative or conversion' },
  { id:'proxy_else', label:'Something else I\'ve observed that concerns me', sub:'Describe in intake' },
  { id:'proxy_unsure', label:'I\'m not sure — something is clearly wrong but I can\'t name it', sub:'That\'s okay to start here' },
];

const PHQ_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
];
const PHQ_OPTS = [
  { v:0, l:'Not at all' },
  { v:1, l:'Several days' },
  { v:2, l:'More than half the days' },
  { v:3, l:'Nearly every day' },
];

const MHPS = [
  { id:'m1', name:'Dr. Anjali Sharma', title:'Psychiatrist · MD (NIMHANS)', tags:['Mood','Adult','Hindi','English'], bio:'12 years across mood disorders and bipolar care. Calm, structured, evidence-led.', avatar:'A', price:1800, langs:['Hindi','English'] },
  { id:'m2', name:'Rahul Iyer', title:'Clinical Psychologist · M.Phil', tags:['Anxiety','CBT','English'], bio:'CBT-trained, specialises in anxiety, panic, and work stress. Direct and warm.', avatar:'R', price:1400, langs:['English','Tamil'] },
  { id:'m3', name:'Dr. Meher Kaul', title:'Psychiatrist · DPM', tags:['Geriatric','Hindi'], bio:'Geriatric specialisation, comfortable with caregiver-supported sessions.', avatar:'M', price:1600, langs:['Hindi','English','Punjabi'] },
  { id:'m4', name:'Sana Qureshi', title:'Counsellor · MA Psych', tags:['Initial chat','Hindi','English'], bio:'30-min orientation chats — figure out the right next step before committing.', avatar:'S', price:600, langs:['Hindi','English','Urdu'] },
];

const PATIENT = {
  name:'Aarav', track:2, episode:'EOC-1042', mhp:MHPS[0],
  joined:'Mar 14',
  upcoming: { id:'apt-21', when:'Tuesday, 30 April · 6:30 PM IST', mhp:MHPS[0], type:'Video session · 50 min', meeting:'#video-room/aarav-anjali' },
  recent:[
    { date:'24 Apr', title:'Session #4 with Dr. Sharma', desc:'Reviewed sleep log — 6.4h average. Continuing CBT-I worksheet.' },
    { date:'22 Apr', title:'PHQ-9 reassessment completed', desc:'Score 9 (mild) — down from 14 at intake. Trend stable.' },
    { date:'18 Apr', title:'Material delivered: Sleep hygiene primer', desc:'Opened on WhatsApp, 4 min reading time.' },
    { date:'14 Apr', title:'Safety plan v2 created', desc:'Updated trusted-person list with new contact.' },
  ],
  assessments:[
    { name:'PHQ-9 · Depression', score:9, max:27, severity:'Mild', trend:-5, p:33 },
    { name:'GAD-7 · Anxiety', score:7, max:21, severity:'Mild', trend:-2, p:33 },
    { name:'ISI · Insomnia', score:11, max:28, severity:'Subthreshold', trend:-3, p:39 },
  ],
  mood:[5,6,4,7,6,7,8,6,7,5,6,7,8,7],
  materials:[
    { title:'CBT thought record — guided', meta:'Worksheet · 4 pages · Hindi/English', icon:'document' },
    { title:'Sleep hygiene primer', meta:'Read · 6 min', icon:'leaf' },
    { title:'Grounding practice (audio)', meta:'Audio · 8 min', icon:'play' },
    { title:'Safety plan template', meta:'Editable · v2 saved', icon:'shield' },
  ],
  sessions:[
    { date:'30 Apr', day:'30', mon:'Apr', title:'Video session with Dr. Sharma', meta:'6:30 PM · 50 min · Confirmed', status:'upcoming' },
    { date:'24 Apr', day:'24', mon:'Apr', title:'Video session with Dr. Sharma', meta:'6:30 PM · Completed · Note signed', status:'done' },
    { date:'17 Apr', day:'17', mon:'Apr', title:'Video session with Dr. Sharma', meta:'6:30 PM · Completed · Note signed', status:'done' },
    { date:'10 Apr', day:'10', mon:'Apr', title:'Video session with Dr. Sharma', meta:'6:30 PM · Completed · Note signed', status:'done' },
    { date:'02 Apr', day:'02', mon:'Apr', title:'Intake review with Sana Qureshi', meta:'Counsellor · 30 min · Triage to Track 2', status:'done' },
  ],
};

/* ---------- Components ---------- */
const Topbar = {
  components: { Icon: window.IconComponent },
  props: ['active'],
  emits: ['open-intake','go'],
  template: `
  <header class="topbar">
    <div class="container">
      <div class="brand"><div class="mark">स</div><b>Saday</b><span class="tag">Wellness</span></div>
      <nav class="nav-links">
        <a :class="{active:active==='home'}" @click="$emit('go','home')">Home</a>
        <a :class="{active:active==='care'}" @click="$emit('go','care')">Care tracks</a>
        <a :class="{active:active==='approach'}" @click="$emit('go','approach')">Approach</a>
        <a :class="{active:active==='for-family'}" @click="$emit('go','for-family')">For family</a>
        <a class="nav-myspace" :class="{active:active==='portal'}" @click="$emit('go','portal')">My space</a>
      </nav>
      <div class="row gap-8">
        <span class="lang-pill"><Icon name="globe" :size="14"/> <span class="lang-text">EN · हिंदी</span></span>
        <button class="btn btn-primary btn-sm" @click="$emit('open-intake')"><span class="btn-intake-long">Begin intake</span><span class="btn-intake-short">Intake</span></button>
      </div>
    </div>
  </header>`
};

/* ============ INTAKE FLOW ============ */
const IntakeFlow = {
  components: { Icon: window.IconComponent },
  emits: ['close','complete'],
  setup(_, { emit }){
    const step = ref(0);
    const state = reactive({
      language:null, who:null, age:null, gender:null, clusters:[],
      assessAnswers:{}, asq:{q1:null,q2:null,q3:null,q4:null}, urgent:null,
      name:'', phone:'', mhpPref:'recommend',
    });
    const totalSteps = 7;
    const progress = computed(() => Math.round((step.value)/(totalSteps-1)*100));

    const clustersList = computed(() => state.who==='proxy' ? PROXY_CLUSTERS : CLUSTERS);

    const redFlag = computed(() => {
      if(state.who==='proxy') return state.clusters.includes('delirium') || state.clusters.includes('proxy_psy');
      return state.clusters.includes('psy');
    });
    const tooMany = computed(() => state.clusters.length >= 4);
    const onlyUnsure = computed(() => state.clusters.length===1 && state.clusters[0]==='unsure');

    const phqShown = computed(() => state.clusters.includes('sad'));
    const gadShown = computed(() => state.clusters.includes('anx'));

    function next(){ if(step.value < totalSteps-1) step.value++; }
    function back(){ if(step.value>0) step.value--; }

    function toggleCluster(id){
      const i = state.clusters.indexOf(id);
      if(i>=0) state.clusters.splice(i,1); else state.clusters.push(id);
    }
    function pickCluster(id){
      // if unsure picked, clear others
      if(id==='unsure'){ state.clusters = ['unsure']; return; }
      const i = state.clusters.indexOf('unsure'); if(i>=0) state.clusters.splice(i,1);
      toggleCluster(id);
    }

    function complete(){
      // simulate triage — system produces a provisional suggestion only
      let track = 2;
      if(redFlag.value) track = 7;
      else if(state.asq.q1==='yes' || state.asq.q2==='yes' || state.asq.q3==='yes') track = 7;
      else if(state.clusters.includes('sub')) track = 4;
      else if(state.clusters.includes('sexual')) track = 5;
      else if(state.who==='proxy') track = 6;
      else if(state.clusters.includes('mood') || state.clusters.includes('rel')) track = 3;
      else if(state.age==='60+') track = 2;
      else if(state.clusters.includes('focus') || state.clusters.includes('ocd') || state.clusters.includes('tr') || state.clusters.includes('eat')) track = 2;
      else if(state.clusters.includes('burn') || state.clusters.includes('sleep') || state.clusters.includes('anx')) track = 1;
      else if(state.clusters.includes('sad')) track = 2;
      else track = 1;
      emit('complete', { ...state, track });
    }

    return { step, state, totalSteps, progress, next, back, pickCluster, toggleCluster,
             redFlag, tooMany, onlyUnsure, phqShown, gadShown, clustersList, CLUSTERS, PROXY_CLUSTERS, PHQ_QUESTIONS, PHQ_OPTS, complete };
  },
  template: `
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="intake">
      <div class="intake-head">
        <div class="row gap-8">
          <div class="brand"><div class="mark">स</div><b style="font-size:14px">Saday</b></div>
        </div>
        <div class="progress"><span :style="{width:progress+'%'}"></span></div>
        <button class="iclose" @click="$emit('close')"><Icon name="close" :size="16"/></button>
      </div>

      <div class="intake-body">
        <!-- Step 0 — language -->
        <template v-if="step===0">
          <div>
            <p class="muted small">Step 1 of 7 · Language</p>
            <h2 class="mt-8">Choose how we should speak with you.</h2>
          </div>
          <div class="lang-grid">
            <button class="lang-card" :class="{selected:state.language==='en'}" @click="state.language='en'">
              <div class="lname">English</div>
              <div class="lsub">Continue in English</div>
            </button>
            <button class="lang-card" :class="{selected:state.language==='hi'}" @click="state.language='hi'">
              <div class="lname">हिंदी</div>
              <div class="lsub">हिंदी में जारी रखें</div>
            </button>
          </div>
          <p class="muted tiny">Other languages — Gujarati, Tamil, Telugu, Bengali — coming soon. We'll fall back to your choice for now.</p>
        </template>

        <!-- Step 1 — who -->
        <template v-if="step===1">
          <div>
            <p class="muted small">Step 2 of 7 · Who is this for</p>
            <h2 class="mt-8">Who are you seeking help for today?</h2>
            <p class="qhelp mt-8">There's no wrong answer. We adjust the entire conversation depending on this.</p>
          </div>
          <div class="opt-list">
            <button class="opt" :class="{selected:state.who==='self'}" @click="state.who='self'">
              <span class="check"><Icon name="check" :size="12" v-if="state.who==='self'"/></span>
              <span>
                <div class="label">For myself</div>
                <div class="sub">I'm the person who needs support</div>
              </span>
            </button>
            <button class="opt" :class="{selected:state.who==='proxy'}" @click="state.who='proxy'">
              <span class="check"><Icon name="check" :size="12" v-if="state.who==='proxy'"/></span>
              <span>
                <div class="label">For someone else — family or friend</div>
                <div class="sub">A different set of questions, with consent guidance</div>
              </span>
            </button>
          </div>
        </template>

        <!-- Step 2 — basic context -->
        <template v-if="step===2">
          <div>
            <p class="muted small">Step 3 of 7 · A little context</p>
            <h2 class="mt-8">{{ state.who==='proxy' ? 'About the person you\\'re helping.' : 'A little about you.' }}</h2>
          </div>
          <div class="col gap-16">
            <div>
              <p class="small muted mb-8">Age band</p>
              <div class="opt-grid">
                <button v-for="a in ['Under 18','18–25','26–40','41–60','60+']" :key="a"
                  class="chip" :class="{selected:state.age===a}" @click="state.age=a">{{a}}</button>
              </div>
            </div>
            <div>
              <p class="small muted mb-8">Gender</p>
              <div class="opt-grid">
                <button v-for="g in ['Female','Male','Non-binary','Prefer not to say']" :key="g"
                  class="chip" :class="{selected:state.gender===g}" @click="state.gender=g">{{g}}</button>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 3 — clusters -->
        <template v-if="step===3">
          <div>
            <p class="muted small">Step 4 of 7 · What's bringing you here</p>
            <h2 class="mt-8">In your own sense, what's going on?</h2>
            <p class="qhelp mt-8">Pick whatever feels true. You can choose more than one — or none.</p>
          </div>
          <div class="opt-list" style="max-height:340px;overflow-y:auto;padding-right:4px">
            <button v-for="c in clustersList" :key="c.id"
              class="opt opt-square" :class="{selected:state.clusters.includes(c.id)}"
              @click="pickCluster(c.id)">
              <span class="check"><Icon name="check" :size="12" v-if="state.clusters.includes(c.id)"/></span>
              <span class="grow">
                <div class="label">{{c.label}} <span v-if="c.red" class="pill rose" style="margin-left:6px">Red flag</span></div>
                <div class="sub">{{c.sub}}</div>
              </span>
            </button>
          </div>
          <div v-if="redFlag" class="exit-banner crit-banner">
            <Icon name="alert" :size="18"/>
            <div>
              <b>Thank you for telling us.</b> What you're describing needs urgent attention. Please reach out to one of the crisis helplines below — our team will also be in touch during clinic hours.
            </div>
          </div>
          <div v-else-if="tooMany" class="exit-banner">
            <Icon name="info" :size="18"/>
            <div>You've mentioned several things. Rather than fill more forms, would you like to skip ahead and book a 30-min orientation with a counsellor?</div>
          </div>
        </template>

        <!-- Step 4 — assessments -->
        <template v-if="step===4">
          <div>
            <p class="muted small">Step 5 of 7 · A few questions</p>
            <h2 class="mt-8">Just to understand you a bit better.</h2>
            <p class="qhelp mt-8" v-if="phqShown">You mentioned feeling low or losing interest. These five questions help us tell stress apart from depression.</p>
            <p class="qhelp mt-8" v-else>Quick check-in — over the past two weeks…</p>
          </div>
          <div class="col gap-16" style="max-height:380px;overflow-y:auto;padding-right:4px">
            <div v-for="(q,i) in PHQ_QUESTIONS" :key="i" class="qassess">
              <div class="qno">Question {{i+1}} of {{PHQ_QUESTIONS.length}}</div>
              <div class="qtxt">{{q}}</div>
              <div class="scale">
                <button v-for="o in PHQ_OPTS" :key="o.v"
                  class="scale-opt" :class="{selected:state.assessAnswers[i]===o.v}"
                  @click="state.assessAnswers[i]=o.v">
                  <span class="dot"></span>
                  <span>{{o.l}}</span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 5 — safety (ASQ) -->
        <template v-if="step===5">
          <div>
            <p class="muted small">Step 6 of 7 · Safety check</p>
            <h2 class="mt-8">We ask everyone these questions — not just you.</h2>
            <p class="qhelp mt-8">Please answer honestly. Your answers help us keep you safe.</p>
          </div>
          <div class="col gap-16" style="max-height:380px;overflow-y:auto;padding-right:4px">
            <div class="qassess">
              <div class="qno">Question 1 of 4</div>
              <div class="qtxt">In the past few weeks, have you wished you were dead?</div>
              <div class="scale">
                <button v-for="o in [{v:'no',l:'No'},{v:'yes',l:'Yes'}]" :key="o.v"
                  class="scale-opt" :class="{selected:state.asq.q1===o.v}" @click="state.asq.q1=o.v">
                  <span class="dot"></span><span>{{o.l}}</span>
                </button>
              </div>
            </div>
            <div class="qassess">
              <div class="qno">Question 2 of 4</div>
              <div class="qtxt">In the past few weeks, have you felt that you or your family would be better off if you were dead?</div>
              <div class="scale">
                <button v-for="o in [{v:'no',l:'No'},{v:'yes',l:'Yes'}]" :key="o.v"
                  class="scale-opt" :class="{selected:state.asq.q2===o.v}" @click="state.asq.q2=o.v">
                  <span class="dot"></span><span>{{o.l}}</span>
                </button>
              </div>
            </div>
            <div class="qassess">
              <div class="qno">Question 3 of 4</div>
              <div class="qtxt">In the past week, have you been having thoughts of killing yourself?</div>
              <div class="scale">
                <button v-for="o in [{v:'no',l:'No'},{v:'yes',l:'Yes'}]" :key="o.v"
                  class="scale-opt" :class="{selected:state.asq.q3===o.v}" @click="state.asq.q3=o.v">
                  <span class="dot"></span><span>{{o.l}}</span>
                </button>
              </div>
            </div>
            <div class="qassess">
              <div class="qno">Question 4 of 4</div>
              <div class="qtxt">Have you ever tried to kill yourself?</div>
              <div class="scale">
                <button v-for="o in [{v:'no',l:'No'},{v:'yes',l:'Yes'},{v:'rather',l:'Rather not say'}]" :key="o.v"
                  class="scale-opt" :class="{selected:state.asq.q4===o.v}" @click="state.asq.q4=o.v">
                  <span class="dot"></span><span>{{o.l}}</span>
                </button>
              </div>
            </div>
          </div>
          <div v-if="state.asq.q1==='yes'||state.asq.q2==='yes'||state.asq.q3==='yes'" class="exit-banner crit-banner">
            <Icon name="heart" :size="18"/>
            <div>
              <b>Thank you for trusting us with this.</b> Crisis helplines are available 24x7 below. Our team will also reach out during clinic hours.
              <div class="row gap-8 mt-12">
                <a class="btn btn-danger btn-sm" href="tel:09152987821"><Icon name="phone" :size="14"/> iCall · 9152987821</a>
                <a class="btn btn-ghost btn-sm" href="tel:18602662345">Vandrevala · 1860-2662-345</a>
                <a class="btn btn-ghost btn-sm" href="tel:112">Dial 112</a>
              </div>
            </div>
          </div>
        </template>

        <!-- Step 6 — contact -->
        <template v-if="step===6">
          <div>
            <p class="muted small">Step 7 of 7 · How to reach you</p>
            <h2 class="mt-8">Almost done.</h2>
          </div>
          <div class="col gap-16">
            <div class="field"><label>First name</label><input class="input" v-model="state.name" placeholder="Your name (first name is enough)"/></div>
            <div class="field"><label>Phone (WhatsApp preferred)</label><input class="input" v-model="state.phone" placeholder="+91 ..."/></div>
            <div>
              <p class="small muted mb-8">Preferred professional</p>
              <div class="opt-list">
                <button v-for="o in [{v:'recommend',l:'Recommend for me',sub:'Based on your answers'},{v:'psychiatrist',l:'Psychiatrist',sub:'Medication review possible'},{v:'psychologist',l:'Psychologist / therapist',sub:'Talk therapy'},{v:'counsellor',l:'Initial chat with a counsellor',sub:'30-min orientation'}]" :key="o.v"
                  class="opt" :class="{selected:state.mhpPref===o.v}" @click="state.mhpPref=o.v">
                  <span class="check"><Icon name="check" :size="12" v-if="state.mhpPref===o.v"/></span>
                  <span><div class="label">{{o.l}}</div><div class="sub">{{o.sub}}</div></span>
                </button>
              </div>
            </div>
            <div class="consent-box">By submitting, you consent to Saday processing your responses for triage. Stored on Indian servers. You can withdraw at any time. <a href="#" class="btn-link" style="display:inline">Read the full notice</a></div>
          </div>
        </template>
      </div>

      <div class="intake-foot">
        <button v-if="step>0" class="btn btn-ghost btn-sm" @click="back"><Icon name="arrow_left" :size="14"/> Back</button>
        <span v-else></span>
        <div class="row gap-12">
          <a v-if="step>=2 && step<6" class="skip-link" @click="$emit('close')">Skip — book directly</a>
          <button v-if="step<6" class="btn btn-primary"
            :disabled="(step===0&&!state.language) || (step===1&&!state.who) || (step===2&&(!state.age||!state.gender)) || (step===3&&!state.clusters.length) || (step===5&&(state.asq.q1===null||state.asq.q2===null||state.asq.q3===null||state.asq.q4===null))"
            @click="next">Continue <Icon name="arrow_right" :size="14"/></button>
          <button v-else class="btn btn-primary" :disabled="!state.name||!state.phone" @click="complete">Submit & see appointments <Icon name="arrow_right" :size="14"/></button>
        </div>
      </div>
    </div>
  </div>`
};

/* ============ TRIAGE RESULT ============ */
const TriageResult = {
  components: { Icon: window.IconComponent },
  props: ['intake'],
  emits: ['close','book'],
  computed: {
    trackInfo(){
      const map = {
        1: { name:'Wellness', desc:'Light, supportive sessions for life transitions and prevention. Counsellor-led.', cls:'track-1' },
        2: { name:'Standard outpatient', desc:'Structured therapy for depression, anxiety, sleep — 4–8 session arc with reassessment at week 4 and 8.', cls:'track-2' },
        3: { name:'Complex clinical', desc:'Bipolar, BPD, PTSD — psychiatrist-led, longer engagement, mood logs.', cls:'track-3' },
        4: { name:'Substance use', desc:'Dedicated SUD pathway — addiction psychiatrist or de-addiction counsellor.', cls:'track-4' },
        5: { name:'Sexual health', desc:'Psychosexual care — sensitive, private, with a trained professional.', cls:'track-5' },
        6: { name:'Proxy / Caregiver', desc:'For family members or caregivers supporting someone else\'s care.', cls:'track-6' },
        7: { name:'Not suitable for online', desc:'What you described needs in-person care today. We will guide you to the right door.', cls:'track-7' },
      };
      return map[this.intake.track] || map[2];
    }
  },
  template: `
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="intake" style="max-width:640px">
      <div class="intake-head">
        <div class="brand"><div class="mark">स</div><b style="font-size:14px">Triage outcome</b></div>
        <button class="iclose" @click="$emit('close')"><Icon name="close" :size="16"/></button>
      </div>
      <div class="intake-body triage">
        <p class="muted small">Hello {{intake.name||'friend'}} — here's what we heard.</p>
        <h2>You're a fit for <em class="italic" style="color:var(--accent)">{{trackInfo.name}}</em>.</h2>

        <div :class="['summary',trackInfo.cls]">
          <span class="track-pill" style="margin-bottom:10px">Track {{intake.track}}</span>
          <p style="margin-top:8px">{{trackInfo.desc}}</p>
        </div>

        <div class="card-soft">
          <h4 class="serif" style="font-size:16px;font-weight:500;margin-bottom:8px">What happens next</h4>
          <div class="col gap-8 small">
            <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> Your responses are saved against episode <code style="background:var(--paper-3);padding:1px 6px;border-radius:4px;font-size:11px">EOC-{{Math.floor(Math.random()*9000)+1000}}</code></div>
            <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> This is a <em>provisional suggestion</em> — your clinician confirms the track at or after the first session</div>
            <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> Our team reviews intakes during clinic hours</div>
            <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> You'll see only professionals matched to your track and language</div>
            <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> Reassessment scheduled at weeks 0 / 2 / 4 / 8 / 12</div>
          </div>
        </div>
      </div>
      <div class="intake-foot">
        <a class="skip-link" @click="$emit('close')">I'll come back later</a>
        <button class="btn btn-primary" @click="$emit('book')">See available appointments <Icon name="arrow_right" :size="14"/></button>
      </div>
    </div>
  </div>`
};

/* ============ BOOKING ============ */
const Booking = {
  components: { Icon: window.IconComponent },
  emits: ['close','done'],
  setup(){
    const mhp = ref(MHPS[0]);
    const today = new Date();
    const days = Array.from({length:10}, (_,i)=>{
      const d = new Date(today); d.setDate(d.getDate()+i);
      return { date:d, wd:d.toLocaleDateString('en',{weekday:'short'}), num:d.getDate(), m:d.toLocaleDateString('en',{month:'short'}) };
    });
    const day = ref(days[1]);
    const slots = ['10:00','11:00','12:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    const slot = ref(null);
    const consent = ref(false);
    return { MHPS, mhp, days, day, slots, slot, consent };
  },
  template: `
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="intake" style="max-width:880px">
      <div class="intake-head">
        <div class="brand"><div class="mark">स</div><b style="font-size:14px">Book a session</b></div>
        <button class="iclose" @click="$emit('close')"><Icon name="close" :size="16"/></button>
      </div>
      <div class="intake-body">
        <div class="booking-grid">
          <div>
            <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:14px">Choose a professional</h3>
            <div class="col gap-12">
              <button v-for="m in MHPS" :key="m.id" class="mhp-card" :class="{selected:mhp.id===m.id}" @click="mhp=m">
                <div class="mhead">
                  <div class="avatar lg">{{m.avatar}}</div>
                  <div class="grow">
                    <div class="mname">{{m.name}}</div>
                    <div class="mtitle">{{m.title}}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:500">₹{{m.price}}</div>
                    <div class="tiny muted">/ 50-min session</div>
                  </div>
                </div>
                <div class="mtags"><span v-for="t in m.tags" :key="t" class="pill">{{t}}</span></div>
                <p class="mbio">{{m.bio}}</p>
              </button>
            </div>
          </div>

          <div>
            <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:14px">Pick a time</h3>
            <p class="small muted mb-12">All times in IST</p>
            <div class="day-pick">
              <button v-for="d in days" :key="d.num" class="day-btn" :class="{selected:day===d}" @click="day=d">
                <span class="dwd">{{d.wd}}</span>
                <span class="dnum">{{d.num}}</span>
              </button>
            </div>
            <div class="slot-grid mb-16">
              <button v-for="(s,i) in slots" :key="s" class="slot" :class="{selected:slot===s,disabled:i===2||i===5}"
                @click="!(i===2||i===5) && (slot=s)">{{s}}</button>
            </div>

            <div class="card-soft mt-16">
              <div class="spread mb-8"><span class="small muted">Session fee</span><b>₹{{mhp.price}}</b></div>
              <div class="spread mb-8"><span class="small muted">Convenience fee</span><span>₹0</span></div>
              <div class="divider"></div>
              <div class="spread"><span>Total</span><b style="font-family:'Fraunces',serif;font-size:18px">₹{{mhp.price}}</b></div>
            </div>

            <label class="checkbox mt-16">
              <input type="checkbox" v-model="consent"/>
              <span>I understand sessions are over secure video. I've read the <a class="btn-link" style="display:inline">consent & cancellation policy</a>.</span>
            </label>
          </div>
        </div>
      </div>
      <div class="intake-foot">
        <span class="muted small" v-if="day && slot">{{mhp.name}} · {{day.wd}} {{day.num}} {{day.m}} · {{slot}} IST</span>
        <span v-else></span>
        <button class="btn btn-primary" :disabled="!day||!slot||!consent" @click="$emit('done',{mhp,day,slot})">
          Confirm with Razorpay <Icon name="arrow_right" :size="14"/>
        </button>
      </div>
    </div>
  </div>`
};

/* ============ PORTAL ============ */
const Portal = {
  components: { Icon: window.IconComponent },
  emits: ['exit','book'],
  setup(){
    const tab = ref('overview');
    const sessTab = ref('upcoming');
    return { tab, sessTab, P: PATIENT, MHPS };
  },
  template: `
  <div class="portal">
    <aside class="psidebar">
      <div class="brand"><div class="mark">स</div><b>Saday</b></div>

      <nav class="pnav">
        <h6>My care</h6>
        <a :class="{active:tab==='overview'}" @click="tab='overview'"><Icon name="home"/> Overview</a>
        <a :class="{active:tab==='sessions'}" @click="tab='sessions'"><Icon name="video"/> Sessions</a>
        <a :class="{active:tab==='assess'}" @click="tab='assess'"><Icon name="clipboard"/> Assessments</a>
        <a :class="{active:tab==='mood'}" @click="tab='mood'"><Icon name="pulse"/> Mood log</a>
        <a :class="{active:tab==='materials'}" @click="tab='materials'"><Icon name="bookmark"/> Materials</a>
        <a :class="{active:tab==='safety'}" @click="tab='safety'"><Icon name="shield"/> Safety plan</a>
        <a :class="{active:tab==='family'}" @click="tab='family'"><Icon name="users"/> Family access</a>

        <h6>Account</h6>
        <a :class="{active:tab==='messages'}" @click="tab='messages'"><Icon name="message"/> Messages</a>
        <a :class="{active:tab==='billing'}" @click="tab='billing'"><Icon name="rupee"/> Billing</a>
        <a :class="{active:tab==='settings'}" @click="tab='settings'"><Icon name="settings"/> Settings</a>
      </nav>

      <div class="user-card">
        <div class="avatar">{{ P.name[0] }}</div>
        <div class="uinfo">
          <div class="uname">{{ P.name }}</div>
          <div class="urole">Track 2 · Episode {{P.episode}}</div>
        </div>
        <button class="iclose" @click="$emit('exit')"><Icon name="arrow_left" :size="14"/></button>
      </div>
    </aside>

    <main class="pmain">
      <!-- ============ OVERVIEW ============ -->
      <template v-if="tab==='overview'">
        <div class="pheader">
          <h1>Good evening, {{P.name}}.</h1>
          <p>You're four sessions in — your sleep is trending up and PHQ-9 has dropped from 14 to 9. Quietly, this is working.</p>
        </div>

        <div class="kpi-row">
          <div class="kpi accent">
            <div class="label">Days in care</div>
            <div class="val">42</div>
            <div class="delta">since 14 March</div>
          </div>
          <div class="kpi">
            <div class="label">Sessions completed</div>
            <div class="val">4 / 8</div>
            <div class="delta">+1 next week</div>
          </div>
          <div class="kpi warm">
            <div class="label">PHQ-9</div>
            <div class="val">9 <span class="muted small">↓5</span></div>
            <div class="delta" style="color:var(--accent)">Mild · improving</div>
          </div>
          <div class="kpi">
            <div class="label">Avg. sleep / week</div>
            <div class="val">6.4h</div>
            <div class="delta">+0.3 vs last week</div>
          </div>
        </div>

        <div class="pgrid">
          <div>
            <div class="next-session">
              <span class="pill" style="background:rgba(255,255,255,.15);color:#fff;border-color:transparent">Next session</span>
              <h3 class="mt-12">{{ P.upcoming.when }}</h3>
              <div class="when">{{ P.upcoming.type }}</div>
              <div class="who">
                <div class="avatar">{{ P.upcoming.mhp.avatar }}</div>
                <div>
                  <div style="font-weight:500">{{ P.upcoming.mhp.name }}</div>
                  <div style="font-size:12px;color:#bccdc6">{{ P.upcoming.mhp.title }}</div>
                </div>
              </div>
              <div class="actions">
                <button class="btn btn-primary"><Icon name="video" :size="14"/> Join video room</button>
                <button class="btn btn-ghost">Reschedule</button>
                <button class="btn btn-ghost">Add to calendar</button>
              </div>
            </div>

            <div class="section-card">
              <div class="sc-head">
                <h3>Recent activity</h3>
                <button class="btn-link tiny">View all</button>
              </div>
              <div class="timeline-item" v-for="r in P.recent" :key="r.title">
                <div class="tdate">{{r.date}}</div>
                <div class="tbody">
                  <div class="ttitle">{{r.title}}</div>
                  <div class="tdesc">{{r.desc}}</div>
                </div>
              </div>
            </div>

            <div class="section-card">
              <div class="sc-head">
                <h3>Mood — last 14 days</h3>
                <span class="pill accent">Avg 6.4 / 10</span>
              </div>
              <div class="mood-grid">
                <div v-for="(m,i) in P.mood" :key="i" class="bar" :style="{height:(m*9)+'px',opacity:.4+m/15}"></div>
              </div>
              <div class="mood-labels"><span>2 wks ago</span><span>today</span></div>
              <button class="btn btn-soft btn-sm mt-16"><Icon name="plus" :size="14"/> Log today's mood</button>
            </div>
          </div>

          <div>
            <div class="section-card">
              <div class="sc-head"><h3>Assessments</h3><button class="btn-link tiny">All</button></div>
              <div v-for="a in P.assessments" :key="a.name" class="assess-row" :style="{'--p':a.p}">
                <div class="gauge"><div class="inner">{{a.score}}</div></div>
                <div class="ainfo">
                  <div class="aname">{{a.name}}</div>
                  <div class="ameta">{{a.severity}} · trend {{a.trend>0?'+':''}}{{a.trend}} vs intake</div>
                </div>
                <Icon name="chevron_right" :size="16" style="color:var(--muted)"/>
              </div>
            </div>

            <div class="section-card">
              <div class="sc-head"><h3>For you</h3></div>
              <div class="materials-list">
                <div v-for="m in P.materials" :key="m.title" class="material">
                  <div class="mthumb"><Icon :name="m.icon" :size="18"/></div>
                  <div class="grow">
                    <div class="mtitle">{{m.title}}</div>
                    <div class="mmeta">{{m.meta}}</div>
                  </div>
                  <Icon name="chevron_right" :size="16" style="color:var(--muted)"/>
                </div>
              </div>
            </div>

            <div class="safety-card">
              <h4>Need support right now?</h4>
              <p>Your safety plan is one tap away. India crisis lines below — open 24×7.</p>
              <div class="crisis-list">
                <div class="cline"><span>Vandrevala Foundation</span><a href="tel:18602662345">1860-2662-345</a></div>
                <div class="cline"><span>iCall · TISS</span><a href="tel:09152987821">9152987821</a></div>
                <div class="cline"><span>Emergency</span><a href="tel:112">112</a></div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ SESSIONS ============ -->
      <template v-if="tab==='sessions'">
        <div class="pheader spread">
          <div>
            <h1>Sessions</h1>
            <p>Your scheduled and past sessions, signed notes and recordings.</p>
          </div>
          <button class="btn btn-primary" @click="$emit('book')"><Icon name="plus" :size="14"/> Book a session</button>
        </div>

        <div class="tabs">
          <button :class="{active:sessTab==='upcoming'}" @click="sessTab='upcoming'">Upcoming</button>
          <button :class="{active:sessTab==='done'}" @click="sessTab='done'">Past</button>
          <button :class="{active:sessTab==='packs'}" @click="sessTab='packs'">Session packs</button>
        </div>

        <div v-if="sessTab==='upcoming'" class="col gap-8">
          <div v-for="s in P.sessions.filter(x=>x.status==='upcoming')" :key="s.title" class="session-row">
            <div class="sleft">
              <div class="swhen"><span class="day">{{s.day}}</span><span class="mon">{{s.mon}}</span></div>
              <div class="sinfo">
                <div class="stitle">{{s.title}}</div>
                <div class="smeta">{{s.meta}}</div>
              </div>
            </div>
            <div class="row gap-8">
              <button class="btn btn-soft btn-sm"><Icon name="video" :size="14"/> Join</button>
              <button class="btn btn-ghost btn-sm">Reschedule</button>
            </div>
          </div>
        </div>

        <div v-if="sessTab==='done'" class="col gap-8">
          <div v-for="s in P.sessions.filter(x=>x.status==='done')" :key="s.title" class="session-row">
            <div class="sleft">
              <div class="swhen"><span class="day">{{s.day}}</span><span class="mon">{{s.mon}}</span></div>
              <div class="sinfo">
                <div class="stitle">{{s.title}}</div>
                <div class="smeta">{{s.meta}}</div>
              </div>
            </div>
            <div class="row gap-8">
              <button class="btn btn-ghost btn-sm"><Icon name="document" :size="14"/> Note summary</button>
              <button class="btn btn-ghost btn-sm">Receipt</button>
            </div>
          </div>
        </div>

        <div v-if="sessTab==='packs'" class="card">
          <div class="spread mb-12">
            <div>
              <div class="serif" style="font-size:20px;font-weight:500">8-session therapy pack</div>
              <div class="muted small">4 of 8 used · expires 12 Aug</div>
            </div>
            <span class="pill accent">Active</span>
          </div>
          <div style="height:8px;background:var(--paper-2);border-radius:4px;overflow:hidden"><div style="width:50%;height:100%;background:var(--accent)"></div></div>
          <div class="row gap-12 mt-16">
            <button class="btn btn-soft btn-sm">Buy add-on session</button>
            <button class="btn btn-ghost btn-sm">View invoice</button>
          </div>
        </div>
      </template>

      <!-- ============ ASSESSMENTS ============ -->
      <template v-if="tab==='assess'">
        <div class="pheader">
          <h1>Assessments</h1>
          <p>Validated tools — completed at intake, then re-administered at fixed milestones to measure change.</p>
        </div>
        <div class="kpi-row">
          <div v-for="a in P.assessments" :key="a.name" class="kpi">
            <div class="label">{{a.name.split('·')[0].trim()}}</div>
            <div class="val">{{a.score}} <span class="muted small">/ {{a.max}}</span></div>
            <div class="delta">{{a.severity}} · {{a.trend>0?'+':''}}{{a.trend}} vs intake</div>
          </div>
          <div class="kpi warm">
            <div class="label">Next due</div>
            <div class="val">Wk 8</div>
            <div class="delta">in 14 days</div>
          </div>
        </div>

        <div class="section-card">
          <div class="sc-head"><h3>History</h3><span class="pill">Immutable · server-stamped</span></div>
          <table style="width:100%;border-collapse:collapse;font-size:13.5px">
            <thead style="text-align:left;color:var(--muted);font-weight:500">
              <tr><th style="padding:10px 8px">Tool</th><th>Score</th><th>Severity</th><th>Date</th><th>Source</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in [{t:'PHQ-9',s:14,sev:'Moderate',d:'14 Mar',src:'Intake'},{t:'GAD-7',s:9,sev:'Mild',d:'14 Mar',src:'Intake'},{t:'PHQ-9',s:11,sev:'Moderate',d:'28 Mar',src:'Wk-2'},{t:'GAD-7',s:8,sev:'Mild',d:'28 Mar',src:'Wk-2'},{t:'PHQ-9',s:9,sev:'Mild',d:'22 Apr',src:'Wk-4'},{t:'GAD-7',s:7,sev:'Mild',d:'22 Apr',src:'Wk-4'},{t:'ISI',s:11,sev:'Subthreshold',d:'22 Apr',src:'Wk-4 add'}]" :key="r.t+r.d" style="border-top:1px solid var(--line)">
                <td style="padding:10px 8px;font-weight:500">{{r.t}}</td>
                <td>{{r.s}}</td>
                <td><span class="pill">{{r.sev}}</span></td>
                <td class="muted">{{r.d}}</td>
                <td class="muted">{{r.src}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ MOOD ============ -->
      <template v-if="tab==='mood'">
        <div class="pheader spread">
          <div>
            <h1>Mood log</h1>
            <p>One tap a day. Your therapist sees the trend, never the day-by-day.</p>
          </div>
          <button class="btn btn-primary"><Icon name="plus" :size="14"/> Log today</button>
        </div>
        <div class="section-card">
          <div class="sc-head"><h3>Last 30 days</h3><span class="pill accent">Avg 6.7</span></div>
          <div class="mood-grid" style="height:160px">
            <div v-for="(m,i) in [...P.mood,...P.mood,3,5,7,8,7,6,7,7]" :key="i" class="bar" :style="{height:(m*16)+'px',opacity:.5+m/15}"></div>
          </div>
          <div class="mood-labels"><span>30 days ago</span><span>today</span></div>
        </div>
        <div class="section-card">
          <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:12px">Recent notes</h3>
          <div class="col gap-8 small">
            <div class="tile spread"><span><b>Yesterday</b> · Slept badly, work stress</span><span class="pill amber">5 / 10</span></div>
            <div class="tile spread"><span><b>2 days ago</b> · Walked in the morning, felt clearer</span><span class="pill accent">8 / 10</span></div>
            <div class="tile spread"><span><b>3 days ago</b> · Nothing in particular</span><span class="pill">7 / 10</span></div>
          </div>
        </div>
      </template>

      <!-- ============ MATERIALS ============ -->
      <template v-if="tab==='materials'">
        <div class="pheader">
          <h1>Materials & toolkit</h1>
          <p>Worksheets, audio, primers — assigned by your therapist or available to all.</p>
        </div>
        <div class="section-card">
          <h3 class="serif mb-12" style="font-size:18px;font-weight:500">Assigned to you</h3>
          <div class="materials-list">
            <div v-for="m in P.materials" :key="m.title" class="material">
              <div class="mthumb"><Icon :name="m.icon" :size="18"/></div>
              <div class="grow">
                <div class="mtitle">{{m.title}}</div>
                <div class="mmeta">{{m.meta}}</div>
              </div>
              <button class="btn btn-soft btn-sm">Open</button>
            </div>
          </div>
        </div>
        <div class="section-card">
          <h3 class="serif mb-12" style="font-size:18px;font-weight:500">Library</h3>
          <div class="materials-list">
            <div class="material" v-for="m in [{t:'Understanding bipolar disorder',meta:'Read · 12 min · Hindi+English',i:'document'},{t:'Family guide: how to support someone',meta:'Read · 8 min',i:'users'},{t:'Box breathing — 4 minute audio',meta:'Audio',i:'play'},{t:'Why we ask the safety question',meta:'Read · 3 min',i:'shield'}]" :key="m.t">
              <div class="mthumb"><Icon :name="m.i" :size="18"/></div>
              <div class="grow"><div class="mtitle">{{m.t}}</div><div class="mmeta">{{m.meta}}</div></div>
              <Icon name="chevron_right" :size="16" style="color:var(--muted)"/>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ SAFETY ============ -->
      <template v-if="tab==='safety'">
        <div class="pheader">
          <h1>Your safety plan</h1>
          <p>Co-created with Dr. Sharma on 14 April. Version 2 · last edited 18 April.</p>
        </div>
        <div class="safety-card" style="background:var(--paper-2);border-color:var(--line);color:var(--ink)">
          <h4 style="color:var(--ink)">If things get hard, call first.</h4>
          <div class="crisis-list">
            <div class="cline"><span>Vandrevala Foundation · 24×7</span><a href="tel:18602662345">1860-2662-345</a></div>
            <div class="cline"><span>iCall · TISS</span><a href="tel:09152987821">9152987821</a></div>
            <div class="cline"><span>India emergency</span><a href="tel:112">112</a></div>
          </div>
        </div>

        <div class="pgrid">
          <div>
            <div class="section-card">
              <div class="sc-head"><h3>Warning signs I can spot</h3><button class="btn-link tiny"><Icon name="edit" :size="13"/> Edit</button></div>
              <ul style="padding-left:18px;color:var(--ink-2)" class="col gap-4">
                <li>Sleeping less than 5 hours, two nights in a row</li>
                <li>Cancelling plans without a reason that feels true</li>
                <li>Skipping breakfast and lunch</li>
                <li>Replaying old conversations on a loop</li>
              </ul>
            </div>
            <div class="section-card">
              <div class="sc-head"><h3>Things that ground me</h3><button class="btn-link tiny"><Icon name="edit" :size="13"/></button></div>
              <ul style="padding-left:18px;color:var(--ink-2)" class="col gap-4">
                <li>Box breathing for 4 minutes (audio in materials)</li>
                <li>10-minute walk near the park, no phone</li>
                <li>Cooking dal — the rhythm of it</li>
              </ul>
            </div>
          </div>
          <div>
            <div class="section-card">
              <div class="sc-head"><h3>People to call</h3></div>
              <div class="col gap-8">
                <div class="tile spread"><div><b>Riya</b><div class="muted tiny">Sister</div></div><a class="btn-link"><Icon name="phone" :size="14"/></a></div>
                <div class="tile spread"><div><b>Vikram</b><div class="muted tiny">Best friend</div></div><a class="btn-link"><Icon name="phone" :size="14"/></a></div>
                <div class="tile spread"><div><b>Dr. Anjali Sharma</b><div class="muted tiny">Therapist</div></div><a class="btn-link"><Icon name="message" :size="14"/></a></div>
              </div>
            </div>
            <div class="section-card">
              <div class="sc-head"><h3>Make my space safer</h3></div>
              <p class="small muted">Means restriction reminders agreed with your therapist. Visible only to you.</p>
              <ul style="padding-left:18px;color:var(--ink-2)" class="col gap-4 mt-8">
                <li>Keep medication blister with Riya</li>
                <li>No alcohol in the apartment for now</li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ FAMILY / INFORMANT ============ -->
      <template v-if="tab==='family'">
        <div class="pheader">
          <h1>Family & informant access</h1>
          <p>Three tiers of access. You decide who sees what — and you can revoke anytime.</p>
        </div>
        <div class="kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="kpi">
            <div class="label">Tier 1 · Observation only</div>
            <div class="val" style="font-size:18px;font-family:'Inter';font-weight:500">Riya</div>
            <div class="delta muted">Sees only your appointment confirmations</div>
          </div>
          <div class="kpi">
            <div class="label">Tier 2 · Collateral interview</div>
            <div class="val" style="font-size:18px;font-family:'Inter';font-weight:500">— not invited —</div>
            <div class="delta muted">Therapist may interview, no portal access</div>
          </div>
          <div class="kpi">
            <div class="label">Tier 3 · Caregiver support</div>
            <div class="val" style="font-size:18px;font-family:'Inter';font-weight:500">— not invited —</div>
            <div class="delta muted">For geriatric / paediatric flows only</div>
          </div>
        </div>
        <div class="section-card">
          <div class="sc-head"><h3>Linked accounts</h3><button class="btn btn-soft btn-sm"><Icon name="plus" :size="14"/> Invite someone</button></div>
          <table style="width:100%;font-size:13.5px;border-collapse:collapse">
            <thead style="text-align:left;color:var(--muted);font-weight:500"><tr><th style="padding:10px 8px">Name</th><th>Relationship</th><th>Tier</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr style="border-top:1px solid var(--line)"><td style="padding:14px 8px"><div class="row gap-8"><div class="avatar sm">R</div><b>Riya</b></div></td><td>Sister</td><td><span class="pill">Tier 1</span></td><td><span class="pill accent">Active</span></td><td><button class="btn-link tiny">Revoke</button></td></tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ MESSAGES ============ -->
      <template v-if="tab==='messages'">
        <div class="pheader">
          <h1>Messages</h1>
          <p>WhatsApp conversation with the Saday team. Clinical content only — for crisis, please call.</p>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:16px 20px;background:var(--paper-2);border-bottom:1px solid var(--line)" class="row gap-12">
            <div class="avatar">स</div>
            <div><b>Saday Care Team</b><div class="muted tiny">Replies within working hours · 9–9 IST</div></div>
          </div>
          <div style="padding:24px;max-height:400px;overflow-y:auto" class="col gap-12">
            <div style="align-self:flex-start;max-width:60%;padding:10px 14px;background:var(--paper-2);border-radius:14px 14px 14px 4px"><div>Hi Aarav 👋 your session for Tuesday 6:30 PM is confirmed.</div><div class="tiny muted mt-4">10:14 · Care Team</div></div>
            <div style="align-self:flex-end;max-width:60%;padding:10px 14px;background:var(--accent);color:#fff;border-radius:14px 14px 4px 14px"><div>Thanks. Can I get the sleep worksheet again?</div><div class="tiny" style="color:#bccdc6">10:18 · You</div></div>
            <div style="align-self:flex-start;max-width:60%;padding:10px 14px;background:var(--paper-2);border-radius:14px 14px 14px 4px"><div>Of course — sending it now to your portal as well.</div><div class="tiny muted mt-4">10:19 · Care Team</div></div>
          </div>
          <div style="padding:14px 20px;border-top:1px solid var(--line)" class="row gap-8">
            <input class="input" placeholder="Write a message..." style="flex:1"/>
            <button class="btn btn-primary"><Icon name="send" :size="14"/></button>
          </div>
        </div>
      </template>

      <!-- ============ BILLING ============ -->
      <template v-if="tab==='billing'">
        <div class="pheader">
          <h1>Billing</h1>
          <p>Receipts and your active session pack — GST-compliant invoices.</p>
        </div>
        <div class="card mb-16">
          <div class="spread mb-8">
            <div><div class="serif" style="font-size:18px;font-weight:500">Active pack · 8 sessions</div><div class="muted small">4 used · 4 remaining · expires 12 Aug</div></div>
            <b style="font-family:'Fraunces',serif;font-size:22px">₹ 13,200</b>
          </div>
          <div style="height:6px;background:var(--paper-2);border-radius:3px;overflow:hidden"><div style="width:50%;height:100%;background:var(--accent)"></div></div>
        </div>
        <div class="section-card">
          <div class="sc-head"><h3>Recent invoices</h3><button class="btn-link tiny">Export</button></div>
          <table style="width:100%;font-size:13.5px;border-collapse:collapse">
            <thead style="text-align:left;color:var(--muted);font-weight:500"><tr><th style="padding:10px 8px">Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr v-for="i in [{d:'24 Apr',n:'Session #4 · Dr. Sharma',a:1800,s:'Paid'},{d:'17 Apr',n:'Session #3 · Dr. Sharma',a:1800,s:'Paid'},{d:'10 Apr',n:'Session #2 · Dr. Sharma',a:1800,s:'Paid'},{d:'02 Apr',n:'Intake review · Sana Qureshi',a:600,s:'Paid'}]" :key="i.d" style="border-top:1px solid var(--line)">
                <td style="padding:12px 8px" class="muted">{{i.d}}</td><td>{{i.n}}</td><td>₹ {{i.a}}</td><td><span class="pill accent">{{i.s}}</span></td><td><button class="btn-link tiny"><Icon name="download" :size="14"/></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ SETTINGS ============ -->
      <template v-if="tab==='settings'">
        <div class="pheader"><h1>Settings</h1><p>Profile, language, notifications and privacy.</p></div>
        <div class="pgrid">
          <div>
            <div class="section-card">
              <h3 class="serif mb-16" style="font-size:18px;font-weight:500">Profile</h3>
              <div class="col gap-12">
                <div class="field"><label>Name</label><input class="input" :value="P.name"/></div>
                <div class="field"><label>Phone (WhatsApp)</label><input class="input" value="+91 98765 43210"/></div>
                <div class="field"><label>Preferred language</label><select class="select"><option>English</option><option>हिंदी</option></select></div>
              </div>
            </div>
            <div class="section-card">
              <h3 class="serif mb-16" style="font-size:18px;font-weight:500">Notifications</h3>
              <div class="col gap-12">
                <label class="checkbox"><input type="checkbox" checked/><span>Session reminders 24h before, on WhatsApp</span></label>
                <label class="checkbox"><input type="checkbox" checked/><span>Daily mood log nudge — 9 PM IST</span></label>
                <label class="checkbox"><input type="checkbox"/><span>Weekly newsletter</span></label>
              </div>
            </div>
          </div>
          <div>
            <div class="section-card">
              <h3 class="serif mb-12" style="font-size:18px;font-weight:500">Your data</h3>
              <p class="small muted mb-16">Stored on Indian servers (Mumbai). Under DPDP Act 2023 you can export or delete at any time.</p>
              <div class="col gap-8">
                <button class="btn btn-ghost btn-sm" style="justify-content:flex-start"><Icon name="download" :size="14"/> Export my data</button>
                <button class="btn btn-ghost btn-sm" style="justify-content:flex-start"><Icon name="lock" :size="14"/> Enable 2-step sign-in</button>
                <button class="btn btn-ghost btn-sm" style="justify-content:flex-start;color:var(--rose)"><Icon name="trash" :size="14"/> Request account deletion</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>`
};

/* ============ ROOT APP ============ */
const App = {
  components: { Topbar, IntakeFlow, TriageResult, Booking, Portal, Icon: window.IconComponent },
  setup(){
    const view = ref('home'); // home | portal
    const intakeOpen = ref(false);
    const triageResult = ref(null);
    const bookingOpen = ref(false);

    function go(v){
      if(v==='portal'){ view.value='portal'; return; }
      view.value='home';
      // smooth scroll to anchors
      setTimeout(()=>{
        const el = document.getElementById(v);
        if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
      },50);
    }
    function openIntake(){ intakeOpen.value=true; }
    function closeIntake(){ intakeOpen.value=false; }
    function onIntakeComplete(data){ intakeOpen.value=false; triageResult.value=data; }
    function startBooking(){ triageResult.value=null; bookingOpen.value=true; }
    function closeBooking(){ bookingOpen.value=false; }
    function onBookingDone(){ bookingOpen.value=false; view.value='portal'; }

    return { view, intakeOpen, triageResult, bookingOpen, go, openIntake, closeIntake, onIntakeComplete, startBooking, closeBooking, onBookingDone };
  },
  template: `
  <div>
    <transition name="fade">
      <div v-if="view==='home'">
        <Topbar :active="'home'" @open-intake="openIntake" @go="go"/>

        <section class="hero">
          <div class="container hero-grid">
            <div>
              <span class="eyebrow"><Icon name="leaf" :size="13"/> Honest-scope mental health, made for India</span>
              <h1 class="display">Care that asks<br/><em>before it answers.</em></h1>
              <p class="lead">An adaptive intake. Seven care tracks. Validated assessments. Quiet design. Clinicians who say no when online isn't right — and walk you to the right door.</p>
              <div class="hero-cta">
                <button class="btn btn-primary btn-lg" @click="openIntake">Begin a 7-step intake <Icon name="arrow_right" :size="14"/></button>
                <button class="btn btn-ghost btn-lg" @click="go('approach')">How we work</button>
              </div>
              <div class="assurances">
                <div class="assurance"><Icon name="check" :size="14"/> Hindi & English at launch</div>
                <div class="assurance"><Icon name="check" :size="14"/> Indian servers · DPDP Act</div>
                <div class="assurance"><Icon name="check" :size="14"/> 30+ validated tools, free</div>
              </div>
            </div>
            <div class="hero-art">
              <div class="orb bg1"></div><div class="orb bg2"></div>
              <div class="cards-stack">
                <div class="fcard f1">
                  <div class="ftitle">PHQ-9 · week 4</div>
                  <div class="fsub">Mild · trending down</div>
                  <div class="meter"><span class="on"></span><span class="on"></span><span class="on"></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
                </div>
                <div class="fcard f2">
                  <div class="ftitle">Tuesday, 6:30 PM</div>
                  <div class="fsub">Dr. Anjali Sharma · Video session</div>
                  <div class="row gap-6 mt-12"><span class="track-pill track-2">Track 2 · Standard</span></div>
                </div>
                <div class="fcard f3">
                  <div class="ftitle">Mood — last 14 days</div>
                  <div class="mood-grid" style="height:42px">
                    <div v-for="m in [5,6,4,7,6,7,8,6,7,5,6,7,8,7]" class="bar" :style="{height:(m*4)+'px'}"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Seven care tracks -->
        <section class="section" id="care">
          <div class="container">
            <h2 class="section-title">Seven tracks. <em class="italic" style="color:var(--accent)">One honest answer.</em></h2>
            <p class="section-sub">No platform can hold every kind of distress. We've drawn the lines clearly — and built a different shape of care for each. <b>Suggested by the system, confirmed by your clinician.</b></p>
            <div class="tracks-grid">
              <div class="track-card track-1">
                <span class="track-pill track-1">Track 1</span>
                <div class="num">01</div>
                <h4>Wellness</h4>
                <p>Life transitions, burnout, grief, work stress, existential concerns. No diagnosable disorder — but still matters.</p>
              </div>
              <div class="track-card track-2">
                <span class="track-pill track-2">Track 2</span>
                <div class="num">02</div>
                <h4>Standard outpatient</h4>
                <p>Depression, anxiety, OCD, PTSD, adult ADHD. 4–8 session arc with integrated psychiatry-psychology model.</p>
              </div>
              <div class="track-card track-3">
                <span class="track-pill track-3">Track 3</span>
                <div class="num">03</div>
                <h4>Complex clinical</h4>
                <p>BPD, bipolar maintenance, moderate eating disorders, complex PTSD. DBT-trained + psychiatrist split model.</p>
              </div>
              <div class="track-card" style="--tc:#ea580c;--tcs:#fff7ed;border-color:var(--tc)">
                <span class="track-pill" style="background:var(--tcs);color:var(--tc)">Track 4</span>
                <div class="num">04</div>
                <h4>Substance use</h4>
                <p>Alcohol, drug, gaming addiction — dedicated SUD pathway. Addiction psychiatrist or de-addiction counsellor.</p>
              </div>
              <div class="track-card" style="--tc:#7c3aed;--tcs:#f5f3ff;border-color:var(--tc)">
                <span class="track-pill" style="background:var(--tcs);color:var(--tc)">Track 5</span>
                <div class="num">05</div>
                <h4>Sexual health</h4>
                <p>Sexual dysfunction, intimacy concerns, gender identity. Psychosexual-trained MHPs only. Fully private.</p>
              </div>
              <div class="track-card" style="--tc:#0891b2;--tcs:#ecfeff;border-color:var(--tc)">
                <span class="track-pill" style="background:var(--tcs);color:var(--tc)">Track 6</span>
                <div class="num">06</div>
                <h4>Proxy / Caregiver</h4>
                <p>Paediatric, dementia, autism, or any care where a family member is the primary point of contact.</p>
              </div>
              <div class="track-card track-5">
                <span class="track-pill track-5">Track 7</span>
                <div class="num">07</div>
                <h4>Not for online</h4>
                <p>Active psychosis, severe withdrawal, acute suicidality. We refer you carefully to in-person care.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- How -->
        <section class="section" id="approach">
          <div class="container">
            <h2 class="section-title">A quiet, four-part flow.</h2>
            <p class="section-sub">No long forms. No dropdowns disguised as therapy. Just the right questions, at the right moment.</p>
            <div class="steps">
              <div class="step"><span class="n">i.</span><h5>Adaptive intake</h5><p>Seven screens — language, who it's for, age, what's going on, a few questions, a safety check, your contact.</p></div>
              <div class="step"><span class="n">ii.</span><h5>Triage to a track</h5><p>You see a real human-readable result — which track, why, what's next, who reviews it and within how long.</p></div>
              <div class="step"><span class="n">iii.</span><h5>Booking</h5><p>Only the professionals who match your track and language. Razorpay, GST invoice, simple cancellation.</p></div>
              <div class="step"><span class="n">iv.</span><h5>Care, measured</h5><p>Sessions, materials, mood log, reassessment at weeks 0/2/4/8/12. Outcome data — yours and shared (de-identified).</p></div>
            </div>
          </div>
        </section>

        <!-- For family -->
        <section class="section" id="for-family">
          <div class="container">
            <div class="family-grid">
              <div>
                <h2 class="section-title">For the family<br/><em class="italic" style="color:var(--accent)">helping someone they love.</em></h2>
                <p class="lead" style="margin-bottom:24px">If you're searching on behalf of a parent, a partner, or a child — Saday is built for that, too. We don't pretend a single buyer means a single patient.</p>
                <div class="col gap-12">
                  <div class="row gap-12"><Icon name="users" :size="20" style="color:var(--accent);margin-top:2px"/><div><b>Three tiers of family access</b><div class="muted small">Observation · collateral interview · caregiver support — patient consents to each.</div></div></div>
                  <div class="row gap-12"><Icon name="shield" :size="20" style="color:var(--accent);margin-top:2px"/><div><b>Guardian consent for under-18</b><div class="muted small">A clear consent architecture for paediatric care, with confidentiality exceptions stated upfront.</div></div></div>
                  <div class="row gap-12"><Icon name="clock" :size="20" style="color:var(--accent);margin-top:2px"/><div><b>Family-supported onboarding for 60+</b><div class="muted small">Set up the account, book sessions, and stay in the loop — when the patient agrees.</div></div></div>
                </div>
                <button class="btn btn-primary mt-24" @click="openIntake">Start an intake on their behalf <Icon name="arrow_right" :size="14"/></button>
              </div>
              <div class="card" style="padding:32px">
                <div class="row gap-12 mb-16">
                  <div class="avatar lg">M</div>
                  <div><div class="serif" style="font-size:18px;font-weight:500">Meera, 34</div><div class="muted small">Daughter · proxy account · Tier 2 access</div></div>
                </div>
                <div class="card-soft">
                  <div class="small muted mb-4">Her mother's portal · this week</div>
                  <div class="col gap-8 small">
                    <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> Geriatric session booked · Wed 11 AM</div>
                    <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> GDS-15 reassessment scheduled</div>
                    <div class="row gap-8"><Icon name="check" :size="14" style="color:var(--accent)"/> Caregiver-burden check-in nudge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Trust strip -->
        <section class="section" style="padding:60px 0">
          <div class="container">
            <div class="card trust-grid">
              <div><div class="serif" style="font-size:34px;font-weight:500">30</div><div class="muted small">Validated assessment tools</div></div>
              <div><div class="serif" style="font-size:34px;font-weight:500">5</div><div class="muted small">Care tracks, honestly defined</div></div>
              <div><div class="serif" style="font-size:34px;font-weight:500">&lt; 2h</div><div class="muted small">Senior clinician review on red flags</div></div>
              <div><div class="serif" style="font-size:34px;font-weight:500">100%</div><div class="muted small">Indian data residency · Mumbai</div></div>
            </div>
          </div>
        </section>

        <footer class="foot">
          <div class="container">
            <div class="lcol" style="max-width:280px">
              <div class="brand"><div class="mark">स</div><b>Saday Wellness</b></div>
              <p class="small" style="color:#8b9590;margin-top:8px">Honest-scope mental health for India. Built by a psychiatrist-CTO and clinical psychologist co-founder.</p>
            </div>
            <div class="lcol"><h6>Care</h6><a class="small">Seven tracks</a><a class="small">For family</a><a class="small">For students</a><a class="small">For workplaces</a></div>
            <div class="lcol"><h6>About</h6><a class="small">Our approach</a><a class="small">Outcome data</a><a class="small">Clinicians</a><a class="small">Press</a></div>
            <div class="lcol"><h6>Trust</h6><a class="small">DPDP & privacy</a><a class="small">Telemedicine guidelines</a><a class="small">Crisis resources</a><a class="small">Refunds & policy</a></div>
            <div class="crisis">
              <b>If you or someone you know is in immediate danger:</b> iCall · 9152987821 (8 AM–10 PM) · Vandrevala Foundation · 1860-2662-345 (24×7) · India emergency · 112
            </div>
          </div>
        </footer>
      </div>
    </transition>

    <Portal v-if="view==='portal'" @exit="view='home'" @book="bookingOpen=true"/>

    <transition name="fade">
      <IntakeFlow v-if="intakeOpen" @close="closeIntake" @complete="onIntakeComplete"/>
    </transition>
    <transition name="fade">
      <TriageResult v-if="triageResult" :intake="triageResult" @close="triageResult=null" @book="startBooking"/>
    </transition>
    <transition name="fade">
      <Booking v-if="bookingOpen" @close="closeBooking" @done="onBookingDone"/>
    </transition>
  </div>`
};

createApp(App).mount('#app');
