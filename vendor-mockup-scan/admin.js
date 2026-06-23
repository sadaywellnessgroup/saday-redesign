/* ================== Saday Admin Console ================== */
const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

/* -------- Simulated data -------- */
const QUEUE = [
  { id:'INT-1042', name:'Aarav M.', age:'26–40', clusters:['Sad','Sleep'], track:2, urgency:'normal', sla:'14h', mhp:null, language:'EN', notes:'PHQ-9 = 14 (mod). Safety: passing thoughts only.' },
  { id:'INT-1041', name:'Riya S.', age:'18–25', clusters:['Anxiety'], track:2, urgency:'normal', sla:'18h', mhp:null, language:'HI', notes:'GAD-7 = 13. First episode of acute panic.' },
  { id:'INT-1040', name:'Proxy: M. Verma', age:'60+', clusters:['Memory','Sleep'], track:6, urgency:'normal', sla:'22h', mhp:null, language:'HI', notes:'Daughter on behalf of mother. AD8 informant = 4.' },
  { id:'INT-1039', name:'Anonymous', age:'26–40', clusters:['Psychosis'], track:7, urgency:'critical', sla:'00:42', mhp:'Dr. Sharma', language:'EN', notes:'Red flag — hearing voices, 3-week history. SLA: 2h. NIMHANS partner referral pending.' },
  { id:'INT-1038', name:'Karthik R.', age:'26–40', clusters:['Substance'], track:4, urgency:'urgent', sla:'01:54', mhp:null, language:'EN', notes:'AUDIT-C = 7. No active withdrawal. Daily drinking 18 months.' },
  { id:'INT-1037', name:'Proxy: A. Singh', age:'12–17', clusters:['Sad','Focus'], track:2, urgency:'urgent', sla:'03:10', mhp:null, language:'EN', notes:'Parent on behalf of 14yo. Proxy consent flow needed.' },
];

const PATIENTS = [
  { id:'P-2034', name:'Aarav Mehta', age:32, gender:'M', track:2, episode:'EOC-1042', mhp:'Dr. Sharma', last:'24 Apr', next:'30 Apr · 6:30 PM', sessions:4, status:'active', flags:[] },
  { id:'P-2033', name:'Riya Sen', age:24, gender:'F', track:2, episode:'EOC-1041', mhp:'R. Iyer', last:'21 Apr', next:'29 Apr · 5:00 PM', sessions:2, status:'active', flags:[] },
  { id:'P-2031', name:'Meher Verma', age:68, gender:'F', track:6, episode:'EOC-1039', mhp:'Dr. Kaul', last:'18 Apr', next:'02 May · 11:00 AM', sessions:7, status:'active', flags:['proxy'] },
  { id:'P-2029', name:'Karthik Rao', age:38, gender:'M', track:4, episode:'EOC-1037', mhp:'Dr. Sharma', last:'19 Apr', next:'28 Apr · 7:00 PM', sessions:5, status:'active', flags:['mood-log'] },
  { id:'P-2024', name:'Anonymous (J.)', age:34, gender:'—', track:7, episode:'EOC-1029', mhp:'—', last:'—', next:'Referred out', sessions:0, status:'referred', flags:['referred'] },
  { id:'P-2018', name:'Sara Khan', age:29, gender:'F', track:1, episode:'EOC-1024', mhp:'S. Qureshi', last:'15 Apr', next:'—', sessions:3, status:'closed', flags:[] },
  { id:'P-2014', name:'Vikram Joshi', age:42, gender:'M', track:2, episode:'EOC-1019', mhp:'R. Iyer', last:'24 Apr', next:'01 May · 8:00 PM', sessions:6, status:'active', flags:[] },
];

const PATIENT_DETAIL = {
  id:'P-2034', name:'Aarav Mehta', age:32, gender:'Male', phone:'+91 98765 43210', joined:'14 Mar', track:2, episode:'EOC-1042',
  mhp:'Dr. Anjali Sharma', sessions:4, dx:'F32.0 · Mild depressive episode',
  assessments:[
    { tool:'PHQ-9', wk0:14, wk2:11, wk4:9 },
    { tool:'GAD-7', wk0:9, wk2:8, wk4:7 },
    { tool:'ISI', wk0:'—', wk2:'—', wk4:11 },
  ],
  notes:[
    { date:'24 Apr', sub:'Sleep slightly improved (6.4h avg from 5.1h). Worksheet completed. Reports better mornings.', obj:'Affect brighter, eye contact stable, no SI.', ass:'Mild depressive episode, responding to CBT + sleep hygiene.', plan:'Continue CBT-I worksheet. Reassess PHQ-9 wk-8. No medication change.', signed:true },
    { date:'17 Apr', sub:'Still struggling with onset insomnia. Anxious about a work review.', obj:'Mood low-stable. PHQ-9 self-report = 11.', ass:'Mild depression w/ residual sleep symptoms.', plan:'Introduce CBT-I worksheet. Pre-emptive cognitive reframe for work review.', signed:true },
  ],
  safety:{
    warning:['Sleeping <5h two nights running','Cancelling plans without reason','Skipping meals'],
    coping:['Box breathing 4 min','Walk in park, no phone','Cooking dal'],
    contacts:[{name:'Riya',rel:'Sister'},{name:'Vikram',rel:'Best friend'}],
  },
  informants:[{name:'Riya Mehta',rel:'Sister',tier:'Tier 1',status:'Active'}],
  mood:[5,6,4,7,6,7,8,6,7,5,6,7,8,7,6,7,8,7,6,7,8,7,6,5,7,8,7,6,7,8],
};

const TODAY_APPTS = [
  { time:'10:00', dur:50, patient:'Riya Sen', mhp:'R. Iyer', track:2, mode:'video' },
  { time:'11:30', dur:30, patient:'Walk-in: New intake', mhp:'S. Qureshi', track:1, mode:'video' },
  { time:'15:00', dur:50, patient:'Vikram Joshi', mhp:'R. Iyer', track:2, mode:'video' },
  { time:'16:00', dur:50, patient:'Karthik Rao', mhp:'Dr. Sharma', track:4, mode:'video' },
  { time:'17:00', dur:50, patient:'Meher Verma (proxy)', mhp:'Dr. Kaul', track:6, mode:'video' },
  { time:'18:30', dur:50, patient:'Aarav Mehta', mhp:'Dr. Sharma', track:2, mode:'video' },
  { time:'20:00', dur:50, patient:'Anonymous J.', mhp:'Dr. Sharma', track:7, mode:'video' },
];

const THREADS = [
  { id:1, name:'Aarav Mehta', last:'Thanks. Can I get the sleep worksheet again?', time:'10:18', unread:1, msgs:[
    { who:'in', t:'10:14', body:'Hi Aarav, your session for Tuesday 6:30 PM is confirmed.' },
    { who:'out', t:'10:18', body:'Thanks. Can I get the sleep worksheet again?' },
  ]},
  { id:2, name:'Riya Sen', last:'Have a good day :)', time:'09:42', unread:0, msgs:[] },
  { id:3, name:'Karthik Rao', last:'Need to reschedule to Friday', time:'Yesterday', unread:2, msgs:[] },
  { id:4, name:'Meher Verma (via daughter)', last:'Mom is doing slightly better this week.', time:'Yesterday', unread:0, msgs:[] },
  { id:5, name:'Anonymous J.', last:'…', time:'Mon', unread:0, msgs:[] },
];

const LEDGER = [
  { date:'24 Apr', patient:'Aarav Mehta', mhp:'Dr. Sharma', svc:'Session #4', gross:1800, pg:54, ded:90, net:1656, status:'Settled' },
  { date:'24 Apr', patient:'Vikram Joshi', mhp:'R. Iyer', svc:'Session #6', gross:1400, pg:42, ded:70, net:1288, status:'Settled' },
  { date:'21 Apr', patient:'Riya Sen', mhp:'R. Iyer', svc:'Session #2', gross:1400, pg:42, ded:70, net:1288, status:'Settled' },
  { date:'19 Apr', patient:'Karthik Rao', mhp:'Dr. Sharma', svc:'Session #5', gross:1800, pg:54, ded:90, net:1656, status:'Settled' },
  { date:'18 Apr', patient:'Meher Verma', mhp:'Dr. Kaul', svc:'Session #7', gross:1600, pg:48, ded:80, net:1472, status:'Settled' },
  { date:'17 Apr', patient:'Aarav Mehta', mhp:'Dr. Sharma', svc:'Session #3', gross:1800, pg:54, ded:90, net:1656, status:'Settled' },
  { date:'14 Apr', patient:'Sara Khan', mhp:'S. Qureshi', svc:'Session #3', gross:600, pg:18, ded:30, net:552, status:'Settled' },
  { date:'10 Apr', patient:'Aarav Mehta', mhp:'Dr. Sharma', svc:'Session #2', gross:1800, pg:54, ded:90, net:1656, status:'Settled' },
  { date:'02 Apr', patient:'Aarav Mehta', mhp:'S. Qureshi', svc:'Intake review', gross:600, pg:18, ded:30, net:552, status:'Settled' },
];

/* -------- App -------- */
const App = {
  components: { Icon: window.IconComponent },
  setup(){
    const tab = ref('dashboard');
    const sidebarOpen = ref(false);
    watch(tab, () => { sidebarOpen.value = false; });
    const queueFilter = ref('all');
    const patientFilter = ref('all');
    const selectedPatient = ref(null);
    const patientTab = ref('overview');
    const activeThread = ref(THREADS[0]);
    const calendarView = ref('week');

    const trackName = (t)=>['','Wellness','Standard','Complex','Substance use','Sexual health','Proxy / Caregiver','Not for online'][t]||'—';

    const filteredQueue = computed(()=>{
      if(queueFilter.value==='all') return QUEUE;
      if(queueFilter.value==='critical') return QUEUE.filter(q=>q.urgency==='critical');
      if(queueFilter.value==='urgent') return QUEUE.filter(q=>q.urgency==='urgent');
      return QUEUE.filter(q=>q.urgency==='normal');
    });

    const filteredPatients = computed(()=>{
      if(patientFilter.value==='all') return PATIENTS;
      if(patientFilter.value==='active') return PATIENTS.filter(p=>p.status==='active');
      if(patientFilter.value==='referred') return PATIENTS.filter(p=>p.status==='referred');
      if(patientFilter.value==='closed') return PATIENTS.filter(p=>p.status==='closed');
      return PATIENTS;
    });

    function openPatient(p){ selectedPatient.value = p.id===PATIENT_DETAIL.id ? PATIENT_DETAIL : { ...PATIENT_DETAIL, name:p.name, id:p.id, episode:p.episode, track:p.track, mhp:p.mhp, sessions:p.sessions }; tab.value='patient'; patientTab.value='overview'; }

    // calendar mock
    const days = ['Mon 28','Tue 29','Wed 30','Thu 01','Fri 02','Sat 03','Sun 04'];
    const hours = ['09','10','11','12','13','14','15','16','17','18','19','20'];
    const calEvents = [
      { day:1, start:9, dur:1, title:'Riya Sen', sub:'Iyer · Std', track:2 },
      { day:2, start:10.5, dur:.5, title:'New intake', sub:'Qureshi · Wel', track:1 },
      { day:2, start:14, dur:1, title:'Vikram J.', sub:'Iyer · Std', track:2 },
      { day:2, start:16, dur:1, title:'Karthik R.', sub:'Sharma · SUD', track:4 },
      { day:2, start:17.5, dur:1, title:'Aarav M.', sub:'Sharma · Std', track:2 },
      { day:2, start:19, dur:1, title:'Anon J.', sub:'Sharma · Refer', track:7 },
      { day:0, start:11, dur:1, title:'Meher V. (proxy)', sub:'Kaul · Proxy', track:6 },
      { day:0, start:18, dur:1, title:'Sara K.', sub:'Qureshi · Wel', track:1 },
      { day:3, start:10, dur:1, title:'Riya S.', sub:'Iyer · Std', track:2 },
      { day:4, start:11, dur:1, title:'Aarav M.', sub:'Sharma · Std', track:2 },
      { day:4, start:17, dur:1, title:'Karthik R.', sub:'Sharma · SUD', track:4 },
      { day:5, start:10, dur:1, title:'Vikram J.', sub:'Iyer · Std', track:2 },
    ];

    return { tab, queueFilter, patientFilter, selectedPatient, patientTab, activeThread, calendarView,
             filteredQueue, filteredPatients, trackName, openPatient, sidebarOpen,
             QUEUE, PATIENTS, PATIENT_DETAIL, TODAY_APPTS, THREADS, LEDGER, days, hours, calEvents };
  },

  template: `
  <div class="adminapp">
    <!-- Mobile backdrop -->
    <div class="s-backdrop" :class="{open:sidebarOpen}" @click="sidebarOpen=false"></div>

    <!-- ============ SIDEBAR ============ -->
    <aside class="asidebar" :class="{open:sidebarOpen}">
      <div class="brand"><div class="mark">स</div><b>Saday</b><span class="tag">Console</span></div>
      <nav class="anav">
        <h6>Operate</h6>
        <a :class="{active:tab==='dashboard'}" @click="tab='dashboard'">
          <span class="ic"><Icon name="home" :size="16"/> Dashboard</span>
        </a>
        <a :class="{active:tab==='triage'}" @click="tab='triage'">
          <span class="ic"><Icon name="inbox" :size="16"/> Triage queue</span>
          <span class="badge">6</span>
        </a>
        <a :class="{active:tab==='calendar'}" @click="tab='calendar'">
          <span class="ic"><Icon name="calendar" :size="16"/> Calendar</span>
        </a>
        <a :class="{active:tab==='messages'}" @click="tab='messages'">
          <span class="ic"><Icon name="message" :size="16"/> Messages</span>
          <span class="badge accent">3</span>
        </a>

        <h6>Clinical</h6>
        <a :class="{active:tab==='patients'||tab==='patient'}" @click="tab='patients'">
          <span class="ic"><Icon name="users" :size="16"/> Patients</span>
          <span class="badge warm">142</span>
        </a>
        <a :class="{active:tab==='assessments'}" @click="tab='assessments'">
          <span class="ic"><Icon name="clipboard" :size="16"/> Assessments</span>
        </a>
        <a :class="{active:tab==='outcomes'}" @click="tab='outcomes'">
          <span class="ic"><Icon name="trending" :size="16"/> Outcomes</span>
        </a>
        <a :class="{active:tab==='safety'}" @click="tab='safety'">
          <span class="ic"><Icon name="shield" :size="16"/> Safety log</span>
        </a>

        <h6>Operations</h6>
        <a :class="{active:tab==='mhps'}" @click="tab='mhps'">
          <span class="ic"><Icon name="badge" :size="16"/> Clinicians</span>
        </a>
        <a :class="{active:tab==='ledger'}" @click="tab='ledger'">
          <span class="ic"><Icon name="rupee" :size="16"/> Earnings ledger</span>
        </a>
        <a :class="{active:tab==='materials'}" @click="tab='materials'">
          <span class="ic"><Icon name="bookmark" :size="16"/> Materials</span>
        </a>
        <a :class="{active:tab==='audit'}" @click="tab='audit'">
          <span class="ic"><Icon name="document" :size="16"/> Audit log</span>
        </a>
        <a :class="{active:tab==='settings'}" @click="tab='settings'">
          <span class="ic"><Icon name="settings" :size="16"/> Settings</span>
        </a>
      </nav>

      <div class="user-pill">
        <div class="av" style="background:var(--warm);color:#3a2c0e">D</div>
        <div class="uinfo grow">
          <div class="uname">Dr. Devanshi K.</div>
          <div class="urole">Admin · Psychiatrist</div>
        </div>
      </div>
    </aside>

    <!-- ============ MAIN ============ -->
    <main class="amain">
      <!-- Top bar -->
      <div class="atop">
        <button class="hmbg" @click="sidebarOpen=!sidebarOpen" title="Menu"><Icon name="menu" :size="20"/></button>
        <div class="search">
          <span class="sicon"><Icon name="search" :size="16"/></span>
          <input class="input" placeholder="Search patients, episodes, intakes (⌘K)"/>
        </div>
        <div class="actions">
          <button class="iconbtn" title="Notifications"><Icon name="bell" :size="18"/><span class="ndot"></span></button>
          <button class="iconbtn" title="Help"><Icon name="info" :size="18"/></button>
          <button class="btn btn-primary btn-sm"><Icon name="plus" :size="14"/> New appointment</button>
        </div>
      </div>

      <div class="acontent">

      <!-- ============ DASHBOARD ============ -->
      <template v-if="tab==='dashboard'">
        <div class="aheader">
          <div>
            <h1>Today, Saturday 27 April</h1>
            <p>Six sessions on the schedule. One critical intake awaiting psychiatrist review.</p>
          </div>
          <div class="row gap-8"><span class="pill"><span class="status-dot green"></span> All systems normal</span></div>
        </div>

        <div class="kpi-row">
          <div class="kpi accent">
            <div class="label">Active episodes</div>
            <div class="val">142</div>
            <div class="delta">+8 this week</div>
          </div>
          <div class="kpi">
            <div class="label">Sessions today</div>
            <div class="val">6 / 8</div>
            <div class="delta">2 slots open</div>
          </div>
          <div class="kpi">
            <div class="label">Triage queue</div>
            <div class="val">6</div>
            <div class="delta rose">1 critical · 2 urgent</div>
          </div>
          <div class="kpi">
            <div class="label">Revenue · this month</div>
            <div class="val">₹2.14L</div>
            <div class="delta">+12% vs last</div>
          </div>
        </div>

        <div class="split">
          <div>
            <div class="acard">
              <div class="ahead">
                <h3>Triage queue · top 4</h3>
                <button class="btn btn-soft btn-sm" @click="tab='triage'">Open queue <Icon name="arrow_right" :size="13"/></button>
              </div>
              <div v-for="q in QUEUE.slice(0,4)" :key="q.id" :class="['queue-card',q.urgency==='critical'?'urgent':'']" @click="tab='triage'">
                <div class="av lg">{{q.name[0]}}</div>
                <div class="qmeta">
                  <div class="qhead">
                    <b>{{q.name}}</b>
                    <span class="code">{{q.id}}</span>
                    <span :class="['track-pill','track-'+q.track]">{{trackName(q.track)}}</span>
                    <span class="pill">{{q.language}}</span>
                  </div>
                  <div class="qsub">{{q.notes}}</div>
                </div>
                <div class="qright">
                  <span :class="['sla', q.urgency==='critical'?'crit':(q.urgency==='urgent'?'warn':'ok')]">
                    <Icon name="clock" :size="12"/> {{q.sla}}
                  </span>
                  <button class="btn btn-soft btn-sm">Review</button>
                </div>
              </div>
            </div>

            <div class="acard">
              <div class="ahead">
                <h3>This week's sessions</h3>
                <span class="muted small">42 booked · 3 cancelled · 1 no-show</span>
              </div>
              <div class="line-chart">
                <div v-for="(d,i) in [{l:'Mon',v:6},{l:'Tue',v:8},{l:'Wed',v:7},{l:'Thu',v:9},{l:'Fri',v:6},{l:'Sat',v:6},{l:'Sun',v:0}]" :key="d.l" class="lbar" :style="{height:(d.v*15)+'px'}">
                  <span class="val">{{d.v}}</span>
                  <span class="label">{{d.l}}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="acard">
              <div class="ahead"><h3>Today's schedule</h3><span class="pill accent">6</span></div>
              <div class="col gap-8">
                <div v-for="a in TODAY_APPTS" :key="a.time" class="list-row" style="padding:10px 0">
                  <div class="lr-left">
                    <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);min-width:42px">{{a.time}}</div>
                    <div>
                      <div style="font-size:13.5px;font-weight:500">{{a.patient}}</div>
                      <div class="muted tiny">{{a.mhp}} · {{a.dur}} min</div>
                    </div>
                  </div>
                  <span :class="['track-pill','track-'+a.track]">T{{a.track}}</span>
                </div>
              </div>
            </div>

            <div class="acard">
              <div class="ahead"><h3>Care-track mix</h3></div>
              <div class="col gap-12 small">
                <div v-for="t in [{n:'Wellness',v:18,p:13,c:1},{n:'Standard',v:68,p:48,c:2},{n:'Complex',v:24,p:17,c:3},{n:'Substance use',v:12,p:8,c:4},{n:'Sexual health',v:6,p:4,c:5},{n:'Proxy / Caregiver',v:9,p:6,c:6},{n:'Not for online',v:5,p:4,c:7}]" :key="t.n">
                  <div class="spread mb-4">
                    <span><span :class="['track-pill','track-'+t.c]">{{t.n}}</span></span>
                    <span class="muted">{{t.v}} · {{t.p}}%</span>
                  </div>
                  <div style="height:4px;background:var(--paper-2);border-radius:2px;overflow:hidden">
                    <div :style="{width:t.p+'%',height:'100%',background:'var(--tc)'}" :class="'track-'+t.c"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="acard">
              <div class="ahead"><h3>Platform health</h3></div>
              <div class="col gap-8 small">
                <div class="list-row" style="padding:10px 0"><div class="lr-left"><span class="status-dot green"></span> Razorpay webhooks</div><span class="muted">99.8%</span></div>
                <div class="list-row" style="padding:10px 0"><div class="lr-left"><span class="status-dot green"></span> MSG91 WhatsApp</div><span class="muted">100%</span></div>
                <div class="list-row" style="padding:10px 0"><div class="lr-left"><span class="status-dot amber"></span> Daily.co video</div><span class="muted">98.1%</span></div>
                <div class="list-row" style="padding:10px 0"><div class="lr-left"><span class="status-dot green"></span> Supabase (Mumbai)</div><span class="muted">99.99%</span></div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ TRIAGE ============ -->
      <template v-if="tab==='triage'">
        <div class="aheader">
          <div>
            <h1>Triage queue</h1>
            <p>Adaptive intakes awaiting clinician review. SLA timers per safety policy.</p>
          </div>
          <div class="row gap-8">
            <button class="btn btn-ghost btn-sm"><Icon name="filter" :size="13"/> Filter</button>
            <button class="btn btn-ghost btn-sm"><Icon name="refresh" :size="13"/> Auto-refresh</button>
          </div>
        </div>

        <div class="tabs">
          <button :class="{active:queueFilter==='all'}" @click="queueFilter='all'">All <span class="muted">· 6</span></button>
          <button :class="{active:queueFilter==='critical'}" @click="queueFilter='critical'">Critical <span class="muted">· 1</span></button>
          <button :class="{active:queueFilter==='urgent'}" @click="queueFilter='urgent'">Urgent <span class="muted">· 2</span></button>
          <button :class="{active:queueFilter==='normal'}" @click="queueFilter='normal'">Normal <span class="muted">· 3</span></button>
        </div>

        <div v-for="q in filteredQueue" :key="q.id" :class="['queue-card',q.urgency==='critical'?'urgent':'']">
          <div class="av lg">{{q.name[0]}}</div>
          <div class="qmeta">
            <div class="qhead">
              <b>{{q.name}}</b>
              <span class="code">{{q.id}}</span>
              <span class="muted small">· {{q.age}}</span>
              <span :class="['track-pill','track-'+q.track]">{{trackName(q.track)}}</span>
              <span class="pill">{{q.language}}</span>
              <span v-for="c in q.clusters" :key="c" class="pill">{{c}}</span>
            </div>
            <div class="qsub">{{q.notes}}</div>
            <div class="muted tiny mt-8" v-if="q.mhp">Assigned to: {{q.mhp}}</div>
          </div>
          <div class="qright">
            <span :class="['sla', q.urgency==='critical'?'crit':(q.urgency==='urgent'?'warn':'ok')]">
              <Icon name="clock" :size="12"/> {{q.sla}}
            </span>
            <div class="row gap-6">
              <button class="btn btn-ghost btn-sm">Assign</button>
              <button class="btn btn-soft btn-sm">Review</button>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ PATIENTS LIST ============ -->
      <template v-if="tab==='patients'">
        <div class="aheader">
          <div>
            <h1>Patients</h1>
            <p>142 active episodes across seven care tracks. Filter by status, track or clinician.</p>
          </div>
          <button class="btn btn-primary btn-sm"><Icon name="plus" :size="14"/> Add patient</button>
        </div>

        <div class="tabs">
          <button :class="{active:patientFilter==='all'}" @click="patientFilter='all'">All</button>
          <button :class="{active:patientFilter==='active'}" @click="patientFilter='active'">Active <span class="muted">· 142</span></button>
          <button :class="{active:patientFilter==='referred'}" @click="patientFilter='referred'">Referred out <span class="muted">· 3</span></button>
          <button :class="{active:patientFilter==='closed'}" @click="patientFilter='closed'">Closed <span class="muted">· 28</span></button>
        </div>

        <div class="acard" style="padding:0;overflow:hidden">
          <table class="atable">
            <thead><tr>
              <th>Patient</th><th>Track</th><th>Episode</th><th>MHP</th><th>Sessions</th><th>Last</th><th>Next</th><th></th>
            </tr></thead>
            <tbody>
              <tr v-for="p in filteredPatients" :key="p.id" @click="openPatient(p)" style="cursor:pointer">
                <td>
                  <div class="pname">
                    <div class="av">{{p.name[0]}}</div>
                    <div>
                      <b>{{p.name}}</b>
                      <div class="muted tiny">{{p.age}} · {{p.gender}} · {{p.id}}
                        <span v-for="f in p.flags" :key="f" class="pill" style="margin-left:4px;font-size:10px">{{f}}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td><span :class="['track-pill','track-'+p.track]">{{trackName(p.track)}}</span></td>
                <td><span class="code">{{p.episode}}</span></td>
                <td>{{p.mhp}}</td>
                <td>{{p.sessions}}</td>
                <td class="muted">{{p.last}}</td>
                <td>{{p.next}}</td>
                <td><Icon name="chevron_right" :size="14" style="color:var(--muted)"/></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ PATIENT DETAIL ============ -->
      <template v-if="tab==='patient' && selectedPatient">
        <div class="aheader">
          <div>
            <button class="btn-link tiny mb-4" @click="tab='patients'">← Patients</button>
            <h1>{{ selectedPatient.name }}</h1>
            <p><span class="code">{{selectedPatient.id}}</span> · {{selectedPatient.age}} · {{selectedPatient.gender}} · joined {{selectedPatient.joined}} · <span :class="['track-pill','track-'+selectedPatient.track]">{{trackName(selectedPatient.track)}}</span> · Episode <span class="code">{{selectedPatient.episode}}</span></p>
          </div>
          <div class="row gap-8">
            <button class="btn btn-ghost btn-sm"><Icon name="message" :size="13"/> Message</button>
            <button class="btn btn-ghost btn-sm"><Icon name="calendar" :size="13"/> Book</button>
            <button class="btn btn-soft btn-sm"><Icon name="more" :size="13"/></button>
          </div>
        </div>

        <div class="tabs">
          <button :class="{active:patientTab==='overview'}" @click="patientTab='overview'">Overview</button>
          <button :class="{active:patientTab==='notes'}" @click="patientTab='notes'">Session notes</button>
          <button :class="{active:patientTab==='assessments'}" @click="patientTab='assessments'">Assessments</button>
          <button :class="{active:patientTab==='safety'}" @click="patientTab='safety'">Safety plan</button>
          <button :class="{active:patientTab==='informants'}" @click="patientTab='informants'">Informants</button>
          <button :class="{active:patientTab==='audit'}" @click="patientTab='audit'">Audit</button>
        </div>

        <div v-if="patientTab==='overview'" class="split">
          <div>
            <div class="acard">
              <div class="ahead"><h3>Mood log · last 30 days</h3><span class="pill accent">avg 6.7</span></div>
              <div class="line-chart">
                <div v-for="(m,i) in selectedPatient.mood" :key="i" class="lbar" :style="{height:(m*15)+'px'}">
                  <span class="val">{{m}}</span>
                </div>
              </div>
            </div>
            <div class="acard">
              <div class="ahead"><h3>Recent activity</h3></div>
              <div class="col gap-8 small">
                <div class="list-row"><div><b>Session #4</b> <span class="muted">· 24 Apr · Note signed</span></div><Icon name="check" :size="14" style="color:var(--accent)"/></div>
                <div class="list-row"><div><b>PHQ-9 wk-4</b> <span class="muted">· 22 Apr · 9 (mild)</span></div><Icon name="trending" :size="14" style="color:var(--accent)"/></div>
                <div class="list-row"><div><b>Material delivered</b> <span class="muted">· 18 Apr · CBT-I worksheet</span></div><Icon name="document" :size="14" style="color:var(--muted)"/></div>
                <div class="list-row"><div><b>Safety plan v2</b> <span class="muted">· 14 Apr · created</span></div><Icon name="shield" :size="14" style="color:var(--accent)"/></div>
              </div>
            </div>
          </div>

          <div>
            <div class="acard">
              <h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:14px">Diagnosis</h3>
              <div class="code" style="background:var(--accent-soft);color:var(--accent);padding:6px 10px">{{selectedPatient.dx}}</div>
              <div class="divider"></div>
              <h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:8px">Care team</h3>
              <div class="row gap-12 mb-8"><div class="av">A</div><div><b>{{selectedPatient.mhp}}</b><div class="muted tiny">Primary therapist</div></div></div>
            </div>
            <div class="acard">
              <h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:12px">Quick stats</h3>
              <div class="col gap-8 small">
                <div class="spread"><span class="muted">Sessions</span><b>{{selectedPatient.sessions}} / 8</b></div>
                <div class="spread"><span class="muted">Days in care</span><b>42</b></div>
                <div class="spread"><span class="muted">No-shows</span><b>0</b></div>
                <div class="spread"><span class="muted">Reschedules</span><b>1</b></div>
                <div class="spread"><span class="muted">Outstanding balance</span><b>₹0</b></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="patientTab==='notes'">
          <div class="acard">
            <div class="ahead">
              <h3>New SOAP note</h3>
              <div class="row gap-6">
                <button class="btn btn-ghost btn-sm">Save draft</button>
                <button class="btn btn-primary btn-sm"><Icon name="lock" :size="13"/> Sign & lock</button>
              </div>
            </div>
            <div class="muted small mb-12">Session #5 · Today · Dr. Anjali Sharma · 50 min</div>
            <div class="soap" style="border:1px solid var(--line);border-radius:10px;overflow:hidden">
              <div class="lab">S</div><div class="body" contenteditable>Subjective — patient's account...</div>
              <div class="lab">O</div><div class="body" contenteditable>Objective — observations...</div>
              <div class="lab">A</div><div class="body" contenteditable>Assessment — clinical impression...</div>
              <div class="lab" style="border-bottom:none">P</div><div class="body" contenteditable style="border-bottom:none">Plan — next steps...</div>
            </div>
          </div>

          <div class="acard" v-for="(n,i) in selectedPatient.notes" :key="i">
            <div class="ahead">
              <h3>Session note · {{n.date}}</h3>
              <span class="pill accent dot" v-if="n.signed">Signed</span>
            </div>
            <div class="soap" style="border:1px solid var(--line);border-radius:10px;overflow:hidden">
              <div class="lab">S</div><div class="body">{{n.sub}}</div>
              <div class="lab">O</div><div class="body">{{n.obj}}</div>
              <div class="lab">A</div><div class="body">{{n.ass}}</div>
              <div class="lab" style="border-bottom:none">P</div><div class="body" style="border-bottom:none">{{n.plan}}</div>
            </div>
          </div>
        </div>

        <div v-if="patientTab==='assessments'">
          <div class="acard">
            <div class="ahead"><h3>Trajectory</h3><button class="btn btn-soft btn-sm"><Icon name="plus" :size="13"/> Administer tool</button></div>
            <table class="atable" style="margin-top:8px">
              <thead><tr><th>Tool</th><th>Wk 0 (Intake)</th><th>Wk 2</th><th>Wk 4</th><th>Wk 8 (next)</th><th>Trend</th></tr></thead>
              <tbody>
                <tr v-for="a in selectedPatient.assessments" :key="a.tool">
                  <td><b>{{a.tool}}</b></td>
                  <td>{{a.wk0}}</td>
                  <td>{{a.wk2}}</td>
                  <td><b>{{a.wk4}}</b></td>
                  <td class="muted">due 6 May</td>
                  <td><span class="pill accent" v-if="typeof a.wk0==='number' && typeof a.wk4==='number'">↓ {{a.wk0-a.wk4}}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="acard">
            <div class="ahead"><h3>PHQ-9 — items</h3><span class="muted small">Wk 4 · administered 22 Apr</span></div>
            <div class="col gap-8 small">
              <div v-for="(it,i) in ['Little interest','Feeling down','Sleep problems','Tired / low energy','Appetite changes','Feeling bad about self','Trouble concentrating','Slow / restless','Self-harm thoughts']" :key="i" class="list-row">
                <div>{{i+1}}. {{it}}</div>
                <span class="pill" :class="i===8?'accent':''">{{i===8?'0':[1,2,1,2,1,1,1,0,0][i]}} / 3</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="patientTab==='safety'">
          <div class="acard" style="background:var(--rose-soft);border:1px solid #ebc8c0">
            <h3 class="serif" style="color:var(--rose);font-size:18px;font-weight:500">Safety plan · v2</h3>
            <p class="small" style="color:#7a3328;margin-top:4px">Co-created 14 Apr with Dr. Sharma. Patient-facing copy in their portal.</p>
          </div>
          <div class="split">
            <div>
              <div class="acard"><h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:10px">Warning signs</h3>
                <ul style="padding-left:18px" class="col gap-4 small">
                  <li v-for="w in selectedPatient.safety.warning" :key="w">{{w}}</li>
                </ul>
              </div>
              <div class="acard"><h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:10px">Coping strategies</h3>
                <ul style="padding-left:18px" class="col gap-4 small">
                  <li v-for="c in selectedPatient.safety.coping" :key="c">{{c}}</li>
                </ul>
              </div>
            </div>
            <div>
              <div class="acard"><h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:10px">Trusted contacts</h3>
                <div v-for="c in selectedPatient.safety.contacts" :key="c.name" class="list-row" style="padding:10px 0">
                  <div class="lr-left"><div class="av sm">{{c.name[0]}}</div><div><b>{{c.name}}</b><div class="muted tiny">{{c.rel}}</div></div></div>
                  <button class="btn-link tiny"><Icon name="phone" :size="13"/></button>
                </div>
              </div>
              <div class="acard">
                <h3 class="serif" style="font-size:16px;font-weight:500;margin-bottom:10px">Version history</h3>
                <div class="col gap-6 small">
                  <div class="list-row" style="padding:8px 0"><div><b>v2</b> <span class="muted">· 14 Apr · Dr. Sharma</span></div><span class="pill accent">Current</span></div>
                  <div class="list-row" style="padding:8px 0"><div><b>v1</b> <span class="muted">· 02 Apr · S. Qureshi</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="patientTab==='informants'">
          <div class="acard">
            <div class="ahead">
              <h3>Linked accounts</h3>
              <button class="btn btn-soft btn-sm"><Icon name="plus" :size="13"/> Invite</button>
            </div>
            <table class="atable">
              <thead><tr><th>Name</th><th>Relationship</th><th>Tier</th><th>Status</th><th>Invited</th><th></th></tr></thead>
              <tbody>
                <tr v-for="i in selectedPatient.informants" :key="i.name">
                  <td><div class="pname"><div class="av sm">{{i.name[0]}}</div><b>{{i.name}}</b></div></td>
                  <td>{{i.rel}}</td>
                  <td><span class="pill">{{i.tier}}</span></td>
                  <td><span class="pill accent dot">{{i.status}}</span></td>
                  <td class="muted">02 Apr</td>
                  <td><button class="btn-link tiny">Manage</button></td>
                </tr>
              </tbody>
            </table>
            <div class="muted small mt-12">Tier definitions: <b>1</b> Observation only · <b>2</b> Collateral interview (no portal) · <b>3</b> Caregiver support (paediatric / geriatric).</div>
          </div>
        </div>

        <div v-if="patientTab==='audit'">
          <div class="acard">
            <div class="ahead"><h3>Audit log</h3><span class="pill">Append-only · DPDP §8(5)</span></div>
            <div class="col gap-0">
              <div v-for="e in [{t:'24 Apr 19:21',a:'Dr. Sharma',ev:'Signed session note',res:'session_notes/4821'},{t:'24 Apr 19:18',a:'Dr. Sharma',ev:'Created session note',res:'session_notes/4821'},{t:'22 Apr 21:10',a:'Aarav Mehta',ev:'Submitted PHQ-9 wk-4',res:'assessment_submissions/9120'},{t:'18 Apr 11:02',a:'Dr. Sharma',ev:'Assigned material',res:'materials/sleep-hygiene'},{t:'14 Apr 18:50',a:'Dr. Sharma',ev:'Created safety plan v2',res:'safety_plans/204'},{t:'02 Apr 16:30',a:'S. Qureshi',ev:'Triaged to Track 2',res:'episodes/EOC-1042'}]" :key="e.t" class="list-row" style="padding:12px 0;border-bottom:1px solid var(--line)">
                <div class="lr-left">
                  <div class="av sm">{{e.a[0]}}</div>
                  <div><b>{{e.ev}}</b><div class="muted tiny">{{e.a}} · <span class="code">{{e.res}}</span></div></div>
                </div>
                <span class="muted small" style="font-family:'JetBrains Mono',monospace">{{e.t}}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ CALENDAR ============ -->
      <template v-if="tab==='calendar'">
        <div class="aheader">
          <div>
            <h1>Calendar · this week</h1>
            <p>April 28 – May 04 · IST · 4 clinicians · 42 sessions booked</p>
          </div>
          <div class="row gap-8">
            <button class="btn btn-ghost btn-sm">← Prev</button>
            <button class="btn btn-ghost btn-sm">Today</button>
            <button class="btn btn-ghost btn-sm">Next →</button>
            <button class="btn btn-primary btn-sm"><Icon name="plus" :size="13"/> Block off</button>
          </div>
        </div>

        <div class="acard" style="padding:0;overflow:hidden">
          <div class="cal-grid-wrap">
          <div class="cal-grid" :style="{gridTemplateRows:'auto repeat('+hours.length+',60px)'}">
            <div class="cal-cell head">Time</div>
            <div class="cal-cell head" v-for="d in days" :key="d">{{d}}</div>

            <template v-for="(h,hi) in hours">
              <div class="cal-cell time" :key="'t'+h">{{h}}:00</div>
              <div class="cal-cell" v-for="(d,di) in days" :key="d+h" style="position:relative">
                <template v-for="ev in calEvents.filter(e=>e.day===di && Math.floor(e.start)===parseInt(h))" :key="ev.title+ev.day">
                  <div :class="['cal-event','t'+ev.track]" :style="{top:((ev.start-parseInt(h))*60)+'px',height:(ev.dur*60-4)+'px'}">
                    <b>{{ev.title}}</b>
                    <div class="ct">{{ev.sub}}</div>
                  </div>
                </template>
              </div>
            </template>
          </div>
          </div>
        </div>
      </template>

      <!-- ============ MESSAGES ============ -->
      <template v-if="tab==='messages'">
        <div class="aheader">
          <div><h1>Messages</h1><p>WhatsApp & in-portal · MSG91 Business API</p></div>
          <button class="btn btn-soft btn-sm"><Icon name="plus" :size="13"/> Compose template</button>
        </div>
        <div class="inbox">
          <div class="threads">
            <div v-for="t in THREADS" :key="t.id" :class="['thread',activeThread.id===t.id?'active':'']" @click="activeThread=t">
              <div class="tname"><span>{{t.name}}</span><span class="ttime">{{t.time}}</span></div>
              <div class="tprev">{{t.last}}</div>
            </div>
          </div>
          <div class="chat">
            <div class="chat-head">
              <div class="row gap-12"><div class="av">{{activeThread.name[0]}}</div><div><b>{{activeThread.name}}</b><div class="muted tiny">+91 98xxx xxxxx · WhatsApp · last seen 12m ago</div></div></div>
              <div class="row gap-6">
                <button class="btn btn-ghost btn-sm"><Icon name="user" :size="13"/> Open patient</button>
                <button class="btn btn-soft btn-sm"><Icon name="more" :size="13"/></button>
              </div>
            </div>
            <div class="chat-body">
              <div class="bubble in">Hi Aarav, your session for Tuesday 6:30 PM is confirmed.<div class="bm">10:14 · template: session_confirm</div></div>
              <div class="bubble out">Thanks. Can I get the sleep worksheet again?<div class="bm">10:18</div></div>
              <div class="bubble in">Of course — sending it now to your portal as well.<div class="bm">10:19 · agent: Devanshi</div></div>
              <div class="bubble in">Here is the file 📎 sleep-hygiene-primer.pdf<div class="bm">10:19</div></div>
            </div>
            <div class="chat-foot">
              <button class="btn btn-ghost btn-sm"><Icon name="document" :size="14"/></button>
              <input class="input" placeholder="Reply or pick a template..." style="flex:1"/>
              <button class="btn btn-primary"><Icon name="send" :size="14"/></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ ASSESSMENTS LIBRARY ============ -->
      <template v-if="tab==='assessments'">
        <div class="aheader">
          <div><h1>Assessment library</h1><p>30 freely-available validated tools · versioned · scoring as pure functions.</p></div>
          <button class="btn btn-primary btn-sm"><Icon name="plus" :size="13"/> Add new version</button>
        </div>
        <div class="acard" style="padding:0;overflow:hidden">
          <table class="atable">
            <thead><tr><th>Tool</th><th>Items</th><th>Languages</th><th>Population</th><th>Version</th><th>Submissions</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="t in [{n:'PHQ-9',i:9,l:'EN, HI',p:'Adult',v:'2.1',s:842,st:'Live'},{n:'PHQ-2',i:2,l:'EN, HI',p:'Adult',v:'1.0',s:1240,st:'Live'},{n:'GAD-7',i:7,l:'EN, HI',p:'Adult',v:'1.3',s:781,st:'Live'},{n:'GAD-2',i:2,l:'EN, HI',p:'Adult',v:'1.0',s:1180,st:'Live'},{n:'GDS-15',i:15,l:'EN, HI',p:'60+',v:'1.0',s:48,st:'Live'},{n:'MDQ',i:15,l:'EN',p:'Adult',v:'1.0',s:62,st:'Live'},{n:'ASRS-v1.1',i:18,l:'EN',p:'Adult',v:'1.0',s:91,st:'Live'},{n:'AUDIT',i:10,l:'EN, HI',p:'Adult',v:'1.0',s:54,st:'Live'},{n:'PCL-5',i:20,l:'EN',p:'Adult',v:'1.0',s:41,st:'Live'},{n:'ASQ',i:4,l:'EN, HI',p:'All',v:'1.0',s:198,st:'Live'},{n:'PSS-10',i:10,l:'EN, HI',p:'Adult',v:'1.0',s:312,st:'Live'},{n:'ISI',i:7,l:'EN',p:'Adult',v:'1.0',s:108,st:'Live'},{n:'SCOFF',i:5,l:'EN',p:'Adult',v:'1.0',s:23,st:'Live'},{n:'AD8 (informant)',i:8,l:'EN, HI',p:'Geriatric',v:'1.0',s:11,st:'Beta'},{n:'IIEF-5',i:5,l:'EN',p:'Adult (M)',v:'1.0',s:0,st:'Pending'},{n:'FSFI',i:19,l:'EN',p:'Adult (F)',v:'1.0',s:0,st:'Pending'}]" :key="t.n">
                <td><b>{{t.n}}</b></td>
                <td>{{t.i}}</td>
                <td><span class="pill">{{t.l}}</span></td>
                <td>{{t.p}}</td>
                <td><span class="code">v{{t.v}}</span></td>
                <td>{{t.s}}</td>
                <td><span class="pill" :class="t.st==='Live'?'accent dot':'amber dot'">{{t.st}}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ OUTCOMES ============ -->
      <template v-if="tab==='outcomes'">
        <div class="aheader">
          <div><h1>Outcomes</h1><p>Longitudinal change across the active cohort. Server-stamped, episode-of-care linked. The moat.</p></div>
          <div class="row gap-8">
            <button class="btn btn-ghost btn-sm"><Icon name="filter" :size="13"/> Last 90 days</button>
            <button class="btn btn-ghost btn-sm"><Icon name="download" :size="13"/> Export</button>
          </div>
        </div>
        <div class="kpi-row">
          <div class="kpi"><div class="label">Avg PHQ-9 improvement</div><div class="val">−4.8</div><div class="delta">over 8 sessions</div></div>
          <div class="kpi"><div class="label">Reliable improvement</div><div class="val">61%</div><div class="delta">n=84 (closed episodes)</div></div>
          <div class="kpi"><div class="label">Drop-out before wk-4</div><div class="val">14%</div><div class="delta warm">benchmark 30%</div></div>
          <div class="kpi"><div class="label">Safety escalations</div><div class="val">7</div><div class="delta">100% within SLA</div></div>
        </div>
        <div class="acard">
          <div class="ahead"><h3>PHQ-9 cohort change · last 90 days</h3></div>
          <div class="line-chart" style="height:240px">
            <div v-for="(v,i) in [14,13,12,11,11,10,10,9,9,9,8,8]" :key="i" class="lbar" :style="{height:(v*15)+'px'}">
              <span class="val">{{v}}</span>
              <span class="label">Wk {{i}}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ SAFETY LOG ============ -->
      <template v-if="tab==='safety'">
        <div class="aheader"><div><h1>Safety log</h1><p>Every flag, every escalation, every SLA. Reviewed weekly by Dr. Devanshi.</p></div></div>
        <div class="kpi-row">
          <div class="kpi"><div class="label">Active safety flags</div><div class="val">3</div></div>
          <div class="kpi"><div class="label">SLA met (last 90d)</div><div class="val">100%</div></div>
          <div class="kpi"><div class="label">Avg response time</div><div class="val">28m</div></div>
          <div class="kpi"><div class="label">Track-7 referrals</div><div class="val">3</div></div>
        </div>
        <div class="acard" style="padding:0;overflow:hidden">
          <table class="atable">
            <thead><tr><th>Date</th><th>Patient</th><th>Trigger</th><th>SLA</th><th>Responder</th><th>Outcome</th></tr></thead>
            <tbody>
              <tr v-for="r in [{d:'27 Apr',p:'Anonymous J.',t:'Cluster: psychosis (red flag)',sla:'2h',r:'Dr. Sharma',o:'Referred to NIMHANS partner'},{d:'24 Apr',p:'Karthik R.',t:'AUDIT-C 7 + safety check',sla:'4h',r:'Dr. Sharma',o:'Track 4 onboarding'},{d:'18 Apr',p:'Aarav M.',t:'PHQ-9 Q9 = 1 → ASQ triggered',sla:'4h',r:'Dr. Sharma',o:'Safety plan v2 created'},{d:'10 Apr',p:'Riya S.',t:'ASQ item 3 positive',sla:'4h',r:'R. Iyer',o:'Reviewed, no escalation'}]" :key="r.d+r.p">
                <td class="muted">{{r.d}}</td><td><b>{{r.p}}</b></td><td>{{r.t}}</td>
                <td><span class="pill accent dot">{{r.sla}} · met</span></td>
                <td>{{r.r}}</td><td class="muted">{{r.o}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ MHPS ============ -->
      <template v-if="tab==='mhps'">
        <div class="aheader"><div><h1>Clinicians</h1><p>Active providers · single source of truth · KYC tracked.</p></div><button class="btn btn-primary btn-sm"><Icon name="plus" :size="13"/> Onboard</button></div>
        <div class="kpi-row" style="grid-template-columns:repeat(4,1fr)">
          <div v-for="m in [{n:'Dr. Anjali Sharma',r:'Psychiatrist',u:'88%',rev:'₹86,400',sess:48,c:'A'},{n:'Rahul Iyer',r:'Psychologist',u:'74%',rev:'₹47,600',sess:34,c:'R'},{n:'Dr. Meher Kaul',r:'Psychiatrist · Geriatric',u:'62%',rev:'₹35,200',sess:22,c:'M'},{n:'Sana Qureshi',r:'Counsellor',u:'90%',rev:'₹14,400',sess:24,c:'S'}]" :key="m.n" class="kpi" style="text-align:left">
            <div class="row gap-12 mb-12"><div class="av lg">{{m.c}}</div><div><div style="font-weight:500">{{m.n}}</div><div class="muted tiny">{{m.r}}</div></div></div>
            <div class="spread small mt-8"><span class="muted">Utilisation</span><b>{{m.u}}</b></div>
            <div class="spread small"><span class="muted">This month</span><b>{{m.rev}}</b></div>
            <div class="spread small"><span class="muted">Sessions</span><b>{{m.sess}}</b></div>
          </div>
        </div>
      </template>

      <!-- ============ LEDGER ============ -->
      <template v-if="tab==='ledger'">
        <div class="aheader"><div><h1>Earnings ledger</h1><p>Per-transaction · Razorpay-reconciled · GST-ready.</p></div><div class="row gap-8"><button class="btn btn-ghost btn-sm"><Icon name="download" :size="13"/> Export CSV</button><button class="btn btn-soft btn-sm"><Icon name="rotate" :size="13"/> Reconcile</button></div></div>

        <div class="ledger-tot mb-16">
          <div class="lt-item"><div class="l">Gross · this month</div><div class="v">₹2,14,800</div></div>
          <div class="lt-item"><div class="l">Deductions (GST + TDS)</div><div class="v">₹10,740</div></div>
          <div class="lt-item"><div class="l">PG charges</div><div class="v">₹6,444</div></div>
          <div class="lt-item"><div class="l">Net to MHPs</div><div class="v">₹1,97,616</div></div>
        </div>

        <div class="acard" style="padding:0;overflow:hidden">
          <table class="atable">
            <thead><tr><th>Date</th><th>Patient</th><th>Service</th><th>MHP</th><th>Gross</th><th>PG</th><th>Deductions</th><th>Net</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="r in LEDGER" :key="r.date+r.patient">
                <td class="muted">{{r.date}}</td>
                <td><b>{{r.patient}}</b></td>
                <td>{{r.svc}}</td>
                <td>{{r.mhp}}</td>
                <td>₹{{r.gross}}</td>
                <td class="muted">₹{{r.pg}}</td>
                <td class="muted">₹{{r.ded}}</td>
                <td><b>₹{{r.net}}</b></td>
                <td><span class="pill accent dot">{{r.status}}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ MATERIALS ============ -->
      <template v-if="tab==='materials'">
        <div class="aheader"><div><h1>Materials</h1><p>Worksheets, audio, primers · attach to episodes or assign as homework.</p></div><button class="btn btn-primary btn-sm"><Icon name="upload" :size="13"/> Upload</button></div>
        <div class="kpi-row" style="grid-template-columns:repeat(3,1fr)">
          <div v-for="m in [{t:'CBT thought record',meta:'Worksheet · 4 pp · EN+HI · 86 dispatches',i:'document'},{t:'Sleep hygiene primer',meta:'Read · 6 min · EN+HI · 62 dispatches',i:'leaf'},{t:'Grounding practice',meta:'Audio · 8 min · EN+HI · 41 dispatches',i:'play'},{t:'Safety plan template',meta:'Editable · v3 · 28 created',i:'shield'},{t:'Bipolar — for families',meta:'Read · 12 min · EN+HI · 9 dispatches',i:'users'},{t:'Medication adherence card',meta:'1 page · printable',i:'pill'}]" :key="m.t" class="kpi">
            <div class="row gap-12 mb-12">
              <div style="width:42px;height:42px;border-radius:10px;background:var(--warm-soft);color:var(--amber);display:flex;align-items:center;justify-content:center"><Icon :name="m.i" :size="20"/></div>
              <div><div style="font-weight:500;font-size:14px">{{m.t}}</div></div>
            </div>
            <div class="muted tiny">{{m.meta}}</div>
          </div>
        </div>
      </template>

      <!-- ============ AUDIT ============ -->
      <template v-if="tab==='audit'">
        <div class="aheader"><div><h1>Audit log</h1><p>Append-only · every PHI mutation written · DPDP §8(5).</p></div></div>
        <div class="acard" style="padding:0;overflow:hidden">
          <table class="atable">
            <thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Resource</th><th>IP</th></tr></thead>
            <tbody>
              <tr v-for="e in [{t:'27 Apr 18:42:11',a:'Dr. Sharma',ev:'Signed session_note',r:'session_notes/4821',ip:'49.36.x.x'},{t:'27 Apr 18:21:03',a:'system',ev:'Razorpay webhook reconciled',r:'payments/p_T48s2',ip:'—'},{t:'27 Apr 17:55:48',a:'Devanshi K.',ev:'Reviewed triage',r:'intake_submissions/INT-1042',ip:'103.27.x.x'},{t:'27 Apr 14:10:21',a:'Aarav M.',ev:'Submitted mood log',r:'mood_logs/mlg-9942',ip:'182.69.x.x'},{t:'27 Apr 09:00:02',a:'system',ev:'SLA timer fired',r:'clinician_review_queue/INT-1039',ip:'—'},{t:'26 Apr 22:14:50',a:'Dr. Kaul',ev:'Created session_note',r:'session_notes/4820',ip:'49.36.x.x'}]" :key="e.t">
                <td class="muted" style="font-family:'JetBrains Mono',monospace;font-size:11.5px">{{e.t}}</td>
                <td><b>{{e.a}}</b></td>
                <td>{{e.ev}}</td>
                <td><span class="code">{{e.r}}</span></td>
                <td class="muted small">{{e.ip}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ============ SETTINGS ============ -->
      <template v-if="tab==='settings'">
        <div class="aheader"><div><h1>Organisation settings</h1><p>Tenant config · policies · integrations · access.</p></div></div>
        <div class="split">
          <div>
            <div class="acard">
              <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:14px">Organisation</h3>
              <div class="col gap-12">
                <div class="field"><label>Display name</label><input class="input" value="Saday Wellness"/></div>
                <div class="field"><label>Slug</label><input class="input" value="saday"/></div>
                <div class="field"><label>WhatsApp Business number</label><input class="input" value="+91 98765 00000"/></div>
                <div class="field"><label>Razorpay account</label><input class="input" value="acc_T48bSadayWell"/></div>
              </div>
            </div>
            <div class="acard">
              <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:14px">Cancellation & reschedule</h3>
              <div class="col gap-12">
                <div class="field"><label>Cancellation window</label><select class="select"><option>24 hours · full refund</option></select></div>
                <div class="field"><label>Late cancellation fee</label><input class="input" value="50%"/></div>
                <div class="field"><label>Reschedule limit</label><input class="input" value="2 per session"/></div>
              </div>
            </div>
          </div>
          <div>
            <div class="acard">
              <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:14px">Integrations</h3>
              <div class="col gap-8 small">
                <div class="list-row"><div class="lr-left"><span class="status-dot green"></span> Supabase · ap-south-1</div><span class="muted">Healthy</span></div>
                <div class="list-row"><div class="lr-left"><span class="status-dot green"></span> Razorpay</div><span class="muted">Webhook OK</span></div>
                <div class="list-row"><div class="lr-left"><span class="status-dot green"></span> MSG91 WhatsApp</div><span class="muted">12 templates</span></div>
                <div class="list-row"><div class="lr-left"><span class="status-dot amber"></span> Daily.co video</div><span class="muted">Degraded</span></div>
                <div class="list-row"><div class="lr-left"><span class="status-dot green"></span> Sentry</div><span class="muted">0 issues today</span></div>
              </div>
            </div>
            <div class="acard">
              <h3 class="serif" style="font-size:18px;font-weight:500;margin-bottom:14px">Compliance</h3>
              <div class="col gap-8 small">
                <div class="list-row"><div>Data residency</div><b>Mumbai (ap-south-1)</b></div>
                <div class="list-row"><div>2FA for staff</div><span class="pill accent dot">Enforced</span></div>
                <div class="list-row"><div>Backup last verified</div><b class="muted">22 Apr</b></div>
                <div class="list-row"><div>DPA — Anthropic</div><span class="pill accent dot">Signed</span></div>
              </div>
            </div>
          </div>
        </div>
      </template>

      </div>
    </main>
  </div>`
};

createApp(App).mount('#app');
