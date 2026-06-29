import React from 'react'
import { css } from './css'
import NoteEditor from './components/NoteEditor'

const KEY = 'lt_state_v7'
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const AR_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
const AR_DOW_SHORT = ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت']
const AR_ORD = ['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر']
const PALETTE = [
  { hex:'#00d97e', name:'زمردي' },
  { hex:'#2dd4bf', name:'فيروزي' },
  { hex:'#38bdf8', name:'سماوي' },
  { hex:'#3b82f6', name:'أزرق' },
  { hex:'#6366f1', name:'نيلي' },
  { hex:'#8b5cf6', name:'بنفسجي' },
  { hex:'#d946ef', name:'أرجواني' },
  { hex:'#ec4899', name:'وردي' },
]
function hexToRgb(hex){ let h=(hex||'').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); if(isNaN(n)||h.length!==6) return {r:0,g:217,b:126}; return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 } }
function themeVarsFor(hex){
  let c = hexToRgb(hex)
  let lum = (0.2126*c.r+0.7152*c.g+0.0722*c.b)/255
  // lift colors too dark to read on the near-black UI
  if (lum < 0.34){ const t = Math.min(0.75, (0.34-lum)/0.34); c = { r:Math.round(c.r+(255-c.r)*t), g:Math.round(c.g+(255-c.g)*t), b:Math.round(c.b+(255-c.b)*t) }; lum = (0.2126*c.r+0.7152*c.g+0.0722*c.b)/255 }
  const hexAdj = '#'+[c.r,c.g,c.b].map(x=>x.toString(16).padStart(2,'0')).join('')
  const on = lum>0.58 ? 'rgb('+Math.round(c.r*0.12)+','+Math.round(c.g*0.12)+','+Math.round(c.b*0.12)+')' : '#ffffff'
  return '--app-accent:'+hexAdj+';--app-accent-on:'+on+';--app-accent-soft:rgba('+c.r+','+c.g+','+c.b+',0.14);--st-on:'+hexAdj+';--st-on-bg:rgba('+c.r+','+c.g+','+c.b+',0.15);--focus-glow:rgba('+c.r+','+c.g+','+c.b+',0.12);'
}
const DAY = 86400000
const fmt1 = n => (Math.round(n * 10) / 10).toString()
const dayStart = ms => { const d = new Date(ms); d.setHours(0,0,0,0); return d.getTime() }
const isoDate = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') }
const uid = () => Math.random().toString(36).slice(2, 9)

export default class LearningTracker extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.buildInitial()
  }

  buildInitial() {
    const demo = (this.props && this.props.dataset) === 'demo'
    return this.buildState(demo)
  }
  buildState(demo) {
    const base = {
      look: (this.state && this.state.look) || (this.props && this.props.look) || 'slate',
      screen: 'today', activeNoteId: null, noteSort: 'updated',
      logDate: isoDate(Date.now()), logHours: 1.5, logLearnPct: 65, logNote: '',
      showGoalModal: false, ngTitle: '', ngDeadline: isoDate(Date.now()+14*DAY), ngBudget: 12, ngTaskRows: [{id:uid(),label:'',hours:''},{id:uid(),label:'',hours:''},{id:uid(),label:'',hours:''}],
      showProjectMenu: false, showProjectModal: false, showCreate: false, npName: '', npSubtitle: '', npHourGoal: 100, npDailyTarget: 2,
      ob: this.blankOb(),
    }
    if (demo) {
      const proj = this.seedProject()
      const first = proj.goals.find(g => g.status === 'active') || proj.goals[0] || null
      return { ...base, projects: [proj], activeProjectId: proj.id, logGoalId: first ? first.id : '', timer: { mode:'focus', secsLeft: proj.settings.pomo.focus*60, running:false, endsAt:null, sessionNum:1, goalId: first ? first.id : null, noise: proj.settings.noise, volume: proj.settings.volume } }
    }
    return { ...base, projects: [], activeProjectId: null, logGoalId: '', timer: { mode:'focus', secsLeft: 25*60, running:false, endsAt:null, sessionNum:1, goalId:null, noise:'brown', volume:60 } }
  }
  blankOb() { return { step:0, mode:'form', name:'', subtitle:'', hourGoal:100, dailyTarget:2, color:'#00d97e', goals:[], stages:[], json:'', jsonError:'', jsonOk:false } }
  blankSettings(hourGoal, dailyTarget) { return { totalHourGoal: Math.max(1, hourGoal||100), dailyTarget: Math.max(0.5, dailyTarget||2), weeksTotal: 0, pomo: { focus:25, short:5, long:15 }, noise:'brown', volume:60 } }
  emptyProjectShape() { return { id:'__none', name:'', subtitle:'', color:'#00d97e', notesList:[], goals:[], sessions:[], curriculum:[], settings: this.blankSettings(100,2), activeGoalId:null } }
  seedProject() {
    const d = this.seedData()
    const first = d.goals.find(g => g.status === 'active') || d.goals[0] || null
    return { id: 'p_fs', name: 'مسار Full-Stack', subtitle: 'من واجهات إلى Full-Stack', color:'#00d97e', notesList:[], goals: d.goals, sessions: d.sessions, curriculum: d.curriculum, settings: d.settings, activeGoalId: first ? first.id : null }
  }
  clearAll() { this.stopNoise(); if (confirm('مسح كل الأهداف والجلسات والبدء من جديد؟')) this.setState(this.buildState(false), () => this.persist()) }
  loadDemo() { this.stopNoise(); this.setState(this.buildState(true), () => this.persist()) }

  seedData() {
    const now = Date.now()
    const subs = (labels, doneCount) => labels.map((l,i) => ({ id: uid(), label: l, done: i < doneCount }))
    const goals = [
      { id:'g1', title:'أساسيات Node.js وExpress', hourBudget:18, status:'active', createdAt: now-10*DAY, deadline: now+12*DAY,
        subTasks: subs(['قراءة وثائق Express ومفهوم الـ Middleware','إنشاء أول مسار GET / POST','التعامل مع الأخطاء وإرجاع رموز الحالة','بناء واجهة CRUD كاملة','تنظيم المشروع في وحدات','كتابة اختبارات أساسية'], 4) },
      { id:'g2', title:'قواعد البيانات وتصميم SQL', hourBudget:14, status:'active', createdAt: now-8*DAY, deadline: now+9*DAY,
        subTasks: subs(['أنواع البيانات وتصميم الجداول','الاستعلامات والـ JOINs','المفاتيح والعلاقات','الفهارس والأداء','ربط القاعدة بـ Node'], 1) },
      { id:'g3', title:'تصميم وبناء واجهات REST API', hourBudget:20, status:'active', createdAt: now-4*DAY, deadline: now+6*DAY,
        subTasks: subs(['مبادئ REST والموارد','تصميم نقاط النهاية','التحقّق من المدخلات','التصفّح والترقيم','التوثيق','رموز الحالة','الإصدارات'], 0) },
      { id:'g4', title:'المصادقة والأمان (JWT / OAuth)', hourBudget:12, status:'upcoming', createdAt: now, deadline: now+30*DAY,
        subTasks: subs(['أساسيات JWT','تسجيل الدخول الآمن','OAuth والموفّرون','حماية المسارات'], 0) },
      { id:'g5', title:'النشر وأساسيات CI/CD', hourBudget:10, status:'upcoming', createdAt: now, deadline: now+45*DAY,
        subTasks: subs(['تهيئة الخادم','خط أنابيب CI','النشر التلقائي','المراقبة'], 0) },
      { id:'g0', title:'أساسيات JavaScript للخوادم', hourBudget:16, status:'done', createdAt: now-32*DAY, deadline: now-3*DAY,
        subTasks: subs(['الوحدات والحزم','async / await','نظام الملفات','الأحداث'], 4) },
    ]
    goals.forEach(g => { const n = g.subTasks.length || 1; const per = Math.round((g.hourBudget / n) * 2) / 2; g.subTasks.forEach(t => { t.est = per }) })
    const mk = (daysAgo, hours, learnFrac, goalId, note, source) => ({ id: uid(), date: now - daysAgo*DAY, hours, learnHours: +(hours*learnFrac).toFixed(1), buildHours: +(hours*(1-learnFrac)).toFixed(1), goalId, note, source })
    const sessions = [
      mk(0, 1.5, 0.67, 'g1', 'فهمت الـ Middleware أخيرًا.', 'pomodoro'),
      mk(1, 2.0, 0.75, 'g2', 'JOINs بدأت تتضح. تمرين على العلاقات.', 'manual'),
      mk(2, 2.5, 0.40, 'g1', 'بنيت أول خادم Express صغير.', 'pomodoro'),
      mk(3, 1.0, 0.50, 'g3', 'قراءة عن مبادئ REST.', 'manual'),
      mk(4, 1.0, 1.0, 'g2', 'إعداد PostgreSQL محليًا.', 'manual'),
      mk(5, 2.0, 0.5, 'g1', 'تمرين على المسارات والـ params.', 'pomodoro'),
    ]
    for (let d = 6; d <= 55; d++) {
      const r = (Math.sin(d * 1.3) + Math.cos(d * 0.7) + 2) / 4
      if (r > 0.42) {
        const hours = +(0.5 + Math.round(r * 4) / 2).toFixed(1)
        sessions.push(mk(d, hours, 0.55 + (d % 3) * 0.1, 'g0', '', d % 3 === 0 ? 'pomodoro' : 'manual'))
      }
    }
    const curriculum = [
      { id:uid(), label:'الشهر الأول', title:'أساسيات الواجهة الخلفية', weeks:[
        { id:uid(), topic:'JavaScript للخوادم وNode.js', build:'سكربت CLI', done:true },
        { id:uid(), topic:'Express والتوجيه (Routing)', build:'خادم بسيط', done:true },
        { id:uid(), topic:'Middleware ومعالجة الأخطاء', build:'طبقة تسجيل', done:true },
        { id:uid(), topic:'واجهات CRUD كاملة', build:'API لقائمة مهام', done:false },
      ]},
      { id:uid(), label:'الشهر الثاني', title:'البيانات والـ APIs', weeks:[
        { id:uid(), topic:'SQL وتصميم الجداول', build:'مخطط قاعدة بيانات', done:true },
        { id:uid(), topic:'PostgreSQL مع Node', build:'ربط API بقاعدة بيانات', done:false },
        { id:uid(), topic:'تصميم REST API', build:'واجهة مدوّنة', done:false },
        { id:uid(), topic:'التحقّق والاختبار', build:'اختبارات Jest', done:false },
      ]},
      { id:uid(), label:'الشهر الثالث', title:'الأمان والنشر والمشروع', weeks:[
        { id:uid(), topic:'المصادقة (JWT / OAuth)', build:'تسجيل دخول آمن', done:false },
        { id:uid(), topic:'النشر وCI/CD', build:'خط نشر تلقائي', done:false },
        { id:uid(), topic:'الأداء والتخزين المؤقت', build:'طبقة Redis', done:false },
        { id:uid(), topic:'مشروع التخرّج الكامل', build:'تطبيق Full-Stack', done:false },
      ]},
    ]
    const settings = { totalHourGoal: 216, dailyTarget: 3, weeksTotal: 12, pomo: { focus:25, short:5, long:15 }, noise:'brown', volume:60 }
    return { goals, sessions, curriculum, settings }
  }

  componentDidMount() {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.projects && d.projects.length) {
          d.projects.forEach(pr => {
            if (!Array.isArray(pr.notesList)) { pr.notesList = (pr.notes && pr.notes.trim()) ? [{ id:uid(), title:'ملاحظة', body:pr.notes, createdAt:Date.now(), updatedAt:Date.now() }] : [] }
            delete pr.notes
          })
          const apid = (d.activeProjectId && d.projects.some(p=>p.id===d.activeProjectId)) ? d.activeProjectId : d.projects[0].id
          const ap = d.projects.find(p=>p.id===apid)
          const ag = ap.goals.find(g=>g.status==='active') || ap.goals[0] || null
          this.setState(s => {
            let timer = d.timer ? { ...d.timer } : { ...s.timer, goalId: ag?ag.id:null, secsLeft: ap.settings.pomo.focus*60, noise: ap.settings.noise, volume: ap.settings.volume }
            if (timer.running && timer.endsAt) timer.secsLeft = Math.max(0, Math.round((timer.endsAt - Date.now())/1000))
            return { projects: d.projects, activeProjectId: apid, look: d.look || s.look, logGoalId: ag?ag.id:'', timer }
          }, () => { if (this.state.timer.running && this.state.timer.mode === 'focus') this.startNoise() })
        }
      } else {
        const old = localStorage.getItem('lt_state_v6')
        if (old) {
          try {
            const d = JSON.parse(old)
            const proj = { id: uid(), name: 'مسار Full-Stack', subtitle: 'من واجهات إلى Full-Stack', goals: d.goals||[], sessions: d.sessions||[], curriculum: d.curriculum||[], settings: d.settings || this.blankSettings(216,3), activeGoalId: d.activeGoalId||null }
            const ag = proj.goals.find(g=>g.status==='active') || proj.goals[0] || null
            this.setState(s => ({ projects: [proj], activeProjectId: proj.id, logGoalId: ag?ag.id:'', timer: { ...s.timer, goalId: ag?ag.id:null } }), () => this.persist())
          } catch(e) { this.persist() }
        } else { this.persist() }
      }
    } catch (e) {}
    this._tick = setInterval(() => this.tick(), 1000)
  }
  componentWillUnmount() { if (this._tick) clearInterval(this._tick); this.stopNoise() }

  persist() {
    try {
      const { projects, activeProjectId, look, timer } = this.state
      localStorage.setItem(KEY, JSON.stringify({ projects, activeProjectId, look, timer }))
    } catch (e) {}
  }
  commit(updater) { this.setState(updater, () => this.persist()) }
  ap() { return this.state.projects.find(p => p.id === this.state.activeProjectId) || this.state.projects[0] }
  commitProject(fn) { this.commit(s => ({ projects: s.projects.map(p => p.id !== s.activeProjectId ? p : fn(p)) })) }

  // ---------- projects ----------
  toggleProjectMenu() { this.setState(s => ({ showProjectMenu: !s.showProjectMenu })) }
  switchProject(id) {
    this.stopNoise()
    this.commit(s => {
      const pr = s.projects.find(p => p.id === id) || s.projects[0]
      const ag = pr.goals.find(g => g.status === 'active') || pr.goals[0] || null
      return { activeProjectId: id, showProjectMenu: false, logGoalId: ag ? ag.id : '', timer: { ...s.timer, mode: 'focus', running: false, secsLeft: pr.settings.pomo.focus*60, goalId: ag ? ag.id : null, noise: pr.settings.noise, volume: pr.settings.volume } }
    })
  }
  removeProject(e, id) {
    if (e && e.stopPropagation) e.stopPropagation()
    if (this.state.projects.length <= 1) return
    if (!confirm('حذف هذا المشروع وكل بياناته؟')) return
    this.stopNoise()
    this.commit(s => {
      const projects = s.projects.filter(p => p.id !== id)
      const wasActive = s.activeProjectId === id
      const nextId = wasActive ? projects[0].id : s.activeProjectId
      const pr = projects.find(p => p.id === nextId)
      const ag = pr.goals.find(g => g.status === 'active') || pr.goals[0] || null
      return { projects, activeProjectId: nextId, logGoalId: wasActive ? (ag ? ag.id : '') : s.logGoalId, timer: wasActive ? { ...s.timer, mode:'focus', running:false, secsLeft: pr.settings.pomo.focus*60, goalId: ag ? ag.id : null } : s.timer }
    })
  }
  openNewProject() { this.setState({ showCreate: true, showProjectMenu: false, ob: this.blankOb() }) }
  cancelCreate() { this.setState({ showCreate: false, ob: this.blankOb() }) }
  saveProject() {
    const s = this.state
    if (!s.npName.trim()) return
    this.stopNoise()
    const pr = { id: uid(), name: s.npName.trim(), subtitle: s.npSubtitle.trim() || 'مسار تعلّم جديد', goals: [], sessions: [], curriculum: [], settings: this.blankSettings(+s.npHourGoal||100, +s.npDailyTarget||2), activeGoalId: null }
    this.commit(st => ({ projects: [...st.projects, pr], activeProjectId: pr.id, showProjectModal: false, logGoalId: '', timer: { ...st.timer, mode:'focus', running:false, secsLeft: pr.settings.pomo.focus*60, goalId: null } }))
  }

  go(s) { return () => this.setState({ screen: s }) }

  // ---------- notes ----------
  addNote() {
    const n = { id:uid(), title:'', body:'', createdAt:Date.now(), updatedAt:Date.now() }
    this.commit(s => ({ projects: s.projects.map(p => p.id!==s.activeProjectId ? p : { ...p, notesList:[n, ...(p.notesList||[])] }), screen:'notes', activeNoteId:n.id }))
  }
  selectNote(id) { this.setState({ activeNoteId: id }) }
  setNoteSort(k) { this.setState({ noteSort: k }) }
  updateNote(id, field, val) { this.commitProject(p => ({ ...p, notesList:(p.notesList||[]).map(x => x.id!==id ? x : { ...x, [field]:val, updatedAt:Date.now() }) })) }
  saveNoteBody(html) { const id = this.state.activeNoteId; if (id) this.updateNote(id, 'body', html) }
  noteTodoMap(fn) { const id = this.state.activeNoteId; this.commitProject(p => ({ ...p, notesList:(p.notesList||[]).map(n => n.id!==id ? n : { ...n, todos: fn(n.todos||[]), updatedAt:Date.now() }) })) }
  addTodo() { this.noteTodoMap(t => [...t, { id:uid(), text:'', done:false }]) }
  toggleTodo(tid) { this.noteTodoMap(t => t.map(x => x.id!==tid ? x : { ...x, done:!x.done })) }
  setTodoText(tid, val) { this.noteTodoMap(t => t.map(x => x.id!==tid ? x : { ...x, text:val })) }
  removeTodo(tid) { this.noteTodoMap(t => t.filter(x => x.id!==tid)) }
  deleteNote(id) {
    if (!confirm('حذف هذه الملاحظة؟')) return
    this.commit(s => ({ projects: s.projects.map(p => { if (p.id!==s.activeProjectId) return p; const list=(p.notesList||[]).filter(x=>x.id!==id); return { ...p, notesList:list } }), activeNoteId: (s.activeNoteId===id ? null : s.activeNoteId) }))
  }

  // ---------- derived helpers ----------
  hoursForGoal(id) { return this.ap().sessions.filter(x => x.goalId === id).reduce((a,b) => a + b.hours, 0) }
  goalPace(g) {
    const done = this.hoursForGoal(g.id)
    const pct = g.hourBudget ? Math.min(1, done / g.hourBudget) : 0
    const daysLeft = Math.max(0, Math.ceil((g.deadline - Date.now()) / DAY))
    const remaining = Math.max(0, g.hourBudget - done)
    const needed = daysLeft > 0 ? remaining / daysLeft : remaining
    let key = 'on'
    if (g.status === 'done' || remaining <= 0) key = 'done'
    else if (g.status === 'upcoming') key = 'upcoming'
    else if (needed <= 1.0) key = 'on'
    else if (needed <= 2.2) key = 'behind'
    else key = 'risk'
    return { done, pct, daysLeft, remaining, needed, key }
  }

  // ---------- subtask / curriculum toggles ----------
  toggleSub(goalId, taskId) {
    this.commitProject(p => ({ ...p, goals: p.goals.map(g => g.id !== goalId ? g : { ...g, subTasks: g.subTasks.map(t => t.id !== taskId ? t : { ...t, done: !t.done }) }) }))
  }
  toggleWeek(mi, wid) {
    this.commitProject(p => ({ ...p, curriculum: p.curriculum.map((m,i) => i !== mi ? m : { ...m, weeks: m.weeks.map(w => w.id !== wid ? w : { ...w, done: !w.done }) }) }))
  }
  addMonth() { this.commitProject(p => ({ ...p, curriculum: [...p.curriculum, { id: uid(), title: 'مرحلة جديدة', weeks: [] }] })) }
  removeMonth(mi) { this.commitProject(p => ({ ...p, curriculum: p.curriculum.filter((_,i) => i !== mi) })) }
  setMonthTitle(mi, val) { this.commitProject(p => ({ ...p, curriculum: p.curriculum.map((m,i) => i !== mi ? m : { ...m, title: val }) })) }
  addWeek(mi) { this.commitProject(p => ({ ...p, curriculum: p.curriculum.map((m,i) => i !== mi ? m : { ...m, weeks: [...m.weeks, { id: uid(), topic: '', build: '', done: false }] }) })) }
  removeWeek(mi, wid) { this.commitProject(p => ({ ...p, curriculum: p.curriculum.map((m,i) => i !== mi ? m : { ...m, weeks: m.weeks.filter(w => w.id !== wid) }) })) }
  setWeekField(mi, wid, field, val) { this.commitProject(p => ({ ...p, curriculum: p.curriculum.map((m,i) => i !== mi ? m : { ...m, weeks: m.weeks.map(w => w.id !== wid ? w : { ...w, [field]: val }) }) })) }
  activateGoal(id) { this.commitProject(p => ({ ...p, activeGoalId: id })) }

  // ---------- log form ----------
  addHours(d) { this.setState(s => ({ logHours: Math.max(0.5, +(s.logHours + d).toFixed(1)) })) }
  saveSession() {
    const s = this.state
    const h = +s.logHours
    if (!(h > 0)) return
    const learn = +(h * s.logLearnPct / 100).toFixed(1)
    const sess = { id: uid(), date: new Date(s.logDate + 'T12:00:00').getTime(), hours: h, learnHours: learn, buildHours: +(h - learn).toFixed(1), goalId: s.logGoalId, note: s.logNote.trim(), source: 'manual' }
    this.commit(st => ({ projects: st.projects.map(p => p.id !== st.activeProjectId ? p : { ...p, sessions: [sess, ...p.sessions] }), logNote: '' }))
  }
  delSession(id) { this.commitProject(p => ({ ...p, sessions: p.sessions.filter(x => x.id !== id) })) }

  // ---------- onboarding (first project) ----------
  setOb(patch) { this.setState(s => ({ ob: { ...s.ob, ...patch } })) }
  setObField(f, v) { this.setOb({ [f]: v }) }
  obGoStep(n) { this.setOb({ step: Math.max(0, Math.min(2, n)) }) }
  obNext() { const o = this.state.ob; if (o.step < 2) this.obGoStep(o.step + 1); else this.createFirstProject() }
  addObGoal() { this.setState(s => ({ ob: { ...s.ob, goals: [...s.ob.goals, { id:uid(), title:'', budget:'', deadline:'', tasks:[] }] } })) }
  removeObGoal(id) { this.setState(s => ({ ob: { ...s.ob, goals: s.ob.goals.filter(g=>g.id!==id) } })) }
  setObGoal(id, f, v) { this.setState(s => ({ ob: { ...s.ob, goals: s.ob.goals.map(g=>g.id!==id?g:{...g,[f]:v}) } })) }
  addObGoalTask(id) { this.setState(s => ({ ob: { ...s.ob, goals: s.ob.goals.map(g=>g.id!==id?g:{...g, tasks:[...g.tasks,{id:uid(),label:'',hours:''}]}) } })) }
  removeObGoalTask(gid, tid) { this.setState(s => ({ ob: { ...s.ob, goals: s.ob.goals.map(g=>g.id!==gid?g:{...g, tasks:g.tasks.filter(t=>t.id!==tid)}) } })) }
  setObGoalTask(gid, tid, f, v) { this.setState(s => ({ ob: { ...s.ob, goals: s.ob.goals.map(g=>g.id!==gid?g:{...g, tasks:g.tasks.map(t=>t.id!==tid?t:{...t,[f]:v})}) } })) }
  addObStage() { this.setState(s => ({ ob: { ...s.ob, stages: [...s.ob.stages, { id:uid(), title:'', weeks:[] }] } })) }
  removeObStage(id) { this.setState(s => ({ ob: { ...s.ob, stages: s.ob.stages.filter(x=>x.id!==id) } })) }
  setObStage(id, v) { this.setState(s => ({ ob: { ...s.ob, stages: s.ob.stages.map(x=>x.id!==id?x:{...x,title:v}) } })) }
  addObWeek(sid) { this.setState(s => ({ ob: { ...s.ob, stages: s.ob.stages.map(x=>x.id!==sid?x:{...x, weeks:[...x.weeks,{id:uid(),topic:'',build:''}]}) } })) }
  removeObWeek(sid, wid) { this.setState(s => ({ ob: { ...s.ob, stages: s.ob.stages.map(x=>x.id!==sid?x:{...x, weeks:x.weeks.filter(w=>w.id!==wid)}) } })) }
  setObWeek(sid, wid, f, v) { this.setState(s => ({ ob: { ...s.ob, stages: s.ob.stages.map(x=>x.id!==sid?x:{...x, weeks:x.weeks.map(w=>w.id!==wid?w:{...w,[f]:v})}) } })) }
  buildProjectFromOb(ob) {
    const goals = ob.goals.filter(g=>(g.title||'').trim()).map(g => {
      const tasks = (g.tasks||[]).filter(t=>(t.label||'').trim()).map(t=>({id:uid(),label:t.label.trim(),done:!!t.done,est:+t.hours||0}))
      const taskSum = tasks.reduce((a,t)=>a+t.est,0)
      const budget = taskSum>0 ? taskSum : Math.max(1, +g.budget||1)
      const deadline = g.deadline ? new Date(g.deadline+'T12:00:00').getTime() : Date.now()+14*DAY
      return { id:uid(), title:g.title.trim(), hourBudget:budget, status: g.status==='done'?'done':'active', createdAt:Date.now(), deadline, subTasks:tasks }
    })
    const curriculum = (ob.stages||[]).filter(s=>(s.title||'').trim()||(s.weeks||[]).some(w=>(w.topic||'').trim()||(w.build||'').trim())).map(s=>({ id:uid(), title:(s.title||'').trim()||'مرحلة', weeks:(s.weeks||[]).filter(w=>(w.topic||'').trim()||(w.build||'').trim()).map(w=>({id:uid(),topic:(w.topic||'').trim(),build:(w.build||'').trim(),done:!!w.done})) }))
    return { id:uid(), name:ob.name.trim(), subtitle:(ob.subtitle||'').trim()||'مسار تعلّم جديد', color: ob.color || '#00d97e', notesList:[], goals, sessions:[], curriculum, settings:this.blankSettings(+ob.hourGoal||100, +ob.dailyTarget||2), activeGoalId: goals[0]?goals[0].id:null }
  }
  commitFirstProject(proj) {
    this.commit(s => ({ projects:[...s.projects, proj], activeProjectId:proj.id, screen:'today', showCreate:false, logGoalId: proj.goals[0]?proj.goals[0].id:'', timer:{...s.timer, mode:'focus', running:false, secsLeft:proj.settings.pomo.focus*60, goalId: proj.goals[0]?proj.goals[0].id:null}, ob:this.blankOb() }))
  }
  createFirstProject() {
    const ob = this.state.ob
    if (!ob.name.trim()) { this.setOb({ step: 0 }); return }
    this.commitFirstProject(this.buildProjectFromOb(ob))
  }

  // ---------- JSON import (create from object) ----------
  validateObJson(text) {
    if (!text || !text.trim()) return { ok:false, error:'ألصق كائن JSON للمشروع أوّلاً.', value:null }
    let d
    try { d = JSON.parse(text) } catch(e) { return { ok:false, error:'JSON غير صالح: '+e.message, value:null } }
    if (typeof d !== 'object' || Array.isArray(d) || d === null) return { ok:false, error:'يجب أن يكون الجذر كائنًا { }.', value:null }
    if (!d.name || typeof d.name !== 'string' || !d.name.trim()) return { ok:false, error:'الحقل "name" مطلوب ويجب أن يكون نصًا غير فارغ.', value:null }
    const numOk = (v) => v === undefined || v === null || v === '' || (!isNaN(+v) && +v >= 0)
    if (!numOk(d.hourGoal)) return { ok:false, error:'"hourGoal" يجب أن يكون رقمًا.', value:null }
    if (!numOk(d.dailyTarget)) return { ok:false, error:'"dailyTarget" يجب أن يكون رقمًا.', value:null }
    if (d.color !== undefined && (typeof d.color !== 'string' || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(d.color))) return { ok:false, error:'"color" يجب أن يكون لونًا بصيغة #RRGGBB.', value:null }
    if (d.goals !== undefined && !Array.isArray(d.goals)) return { ok:false, error:'"goals" يجب أن تكون مصفوفة [ ].', value:null }
    if (d.stages !== undefined && !Array.isArray(d.stages)) return { ok:false, error:'"stages" يجب أن تكون مصفوفة [ ].', value:null }
    const goals = d.goals || []
    for (let i=0;i<goals.length;i++) {
      const g = goals[i]; const n = i+1
      if (typeof g !== 'object' || g===null || Array.isArray(g)) return { ok:false, error:'الهدف رقم '+n+' يجب أن يكون كائنًا.', value:null }
      if (!g.title || !String(g.title).trim()) return { ok:false, error:'الهدف رقم '+n+' ينقصه "title".', value:null }
      if (!numOk(g.budget)) return { ok:false, error:'"budget" للهدف رقم '+n+' يجب أن يكون رقمًا.', value:null }
      if (g.tasks !== undefined && !Array.isArray(g.tasks)) return { ok:false, error:'"tasks" للهدف رقم '+n+' يجب أن تكون مصفوفة.', value:null }
      const tasks = g.tasks || []
      for (let j=0;j<tasks.length;j++) {
        const t = tasks[j]
        if (typeof t !== 'object' || t===null) return { ok:false, error:'مهمة في الهدف '+n+' غير صالحة.', value:null }
        if (!t.label || !String(t.label).trim()) return { ok:false, error:'مهمة في الهدف '+n+' ينقصها "label".', value:null }
        if (!numOk(t.hours)) return { ok:false, error:'"hours" لمهمة في الهدف '+n+' يجب أن يكون رقمًا.', value:null }
      }
    }
    const stages = d.stages || []
    for (let i=0;i<stages.length;i++) {
      const s = stages[i]; const n = i+1
      if (typeof s !== 'object' || s===null || Array.isArray(s)) return { ok:false, error:'المرحلة رقم '+n+' يجب أن تكون كائنًا.', value:null }
      if (s.weeks !== undefined && !Array.isArray(s.weeks)) return { ok:false, error:'"weeks" للمرحلة رقم '+n+' يجب أن تكون مصفوفة.', value:null }
    }
    const value = {
      name: String(d.name).trim(),
      subtitle: d.subtitle ? String(d.subtitle).trim() : '',
      hourGoal: d.hourGoal ? +d.hourGoal : 100,
      dailyTarget: d.dailyTarget ? +d.dailyTarget : 2,
      color: d.color || '',
      goals: goals.map(g => ({ title:String(g.title), budget: g.budget!=null?String(g.budget):'', deadline: g.deadline||'', status:g.status, tasks:(g.tasks||[]).map(t=>({ label:String(t.label), hours: t.hours!=null?String(t.hours):'', done:!!t.done })) })),
      stages: stages.map(s => ({ title: s.title?String(s.title):'', weeks:(s.weeks||[]).map(w=>({ topic: w.topic?String(w.topic):'', build: w.build?String(w.build):'', done:!!w.done })) })),
    }
    const gc = value.goals.length, sc = value.stages.length
    return { ok:true, error:'جاهز للإنشاء · '+gc+' أهداف · '+sc+' مراحل', value }
  }
  setObMode(mode) { this.setState(s => ({ ob: { ...s.ob, mode } })) }
  setObJson(text) {
    const r = this.validateObJson(text)
    this.setState(s => ({ ob: { ...s.ob, json: text, jsonError: r.error, jsonOk: r.ok } }))
  }
  loadJsonSample() {
    const sample = {
      name: 'مسار Full-Stack',
      subtitle: 'من واجهات إلى Full-Stack',
      hourGoal: 216,
      dailyTarget: 3,
      goals: [
        { title: 'أساسيات JavaScript', budget: 20, deadline: '2026-08-15', tasks: [ { label: 'المتغيرات والدوال', hours: 6 }, { label: 'الوعود والتزامن', hours: 8 } ] },
        { title: 'بناء واجهة React', budget: 30, tasks: [] }
      ],
      stages: [
        { title: 'الشهر التأسيسي', weeks: [ { topic: 'أساسيات الويب', build: 'صفحة شخصية' }, { topic: 'JavaScript', build: 'آلة حاسبة' } ] },
        { title: 'شهر الواجهات', weeks: [ { topic: 'React', build: 'لوحة مهام' } ] }
      ]
    }
    this.setObJson(JSON.stringify(sample, null, 2))
  }
  createFromJson() {
    const r = this.validateObJson(this.state.ob.json)
    if (!r.ok) { this.setState(s => ({ ob: { ...s.ob, jsonError: r.error, jsonOk:false } })); return }
    const v = r.value; v.color = v.color || this.state.ob.color || '#00d97e'
    this.commitFirstProject(this.buildProjectFromOb(v))
  }

  // ---------- new goal ----------
  openNewGoal() { this.setState({ showGoalModal: true, ngTitle: '', ngDeadline: isoDate(Date.now()+14*DAY), ngBudget: 12, ngTaskRows: [{id:uid(),label:'',hours:''},{id:uid(),label:'',hours:''},{id:uid(),label:'',hours:''}] }) }
  addNgTask() { this.setState(s => ({ ngTaskRows: [...s.ngTaskRows, { id: uid(), label: '', hours: '' }] })) }
  removeNgTask(id) { this.setState(s => ({ ngTaskRows: s.ngTaskRows.length > 1 ? s.ngTaskRows.filter(r => r.id !== id) : s.ngTaskRows })) }
  setNgTaskField(id, field, val) { this.setState(s => { const rows = s.ngTaskRows.map(r => r.id !== id ? r : { ...r, [field]: val }); const sum = rows.reduce((a,r) => a + (+r.hours || 0), 0); return { ngTaskRows: rows, ngBudget: sum > 0 ? sum : s.ngBudget } }) }
  saveGoal() {
    const s = this.state
    if (!s.ngTitle.trim()) return
    const tasks = s.ngTaskRows.filter(r => r.label.trim()).map(r => ({ id: uid(), label: r.label.trim(), done: false, est: +r.hours || 0 }))
    const taskSum = tasks.reduce((a,t) => a + t.est, 0)
    const budget = taskSum > 0 ? taskSum : Math.max(1, +s.ngBudget || 1)
    const g = { id: uid(), title: s.ngTitle.trim(), hourBudget: budget, status: 'active', createdAt: Date.now(), deadline: new Date(s.ngDeadline + 'T12:00:00').getTime(), subTasks: tasks }
    this.commit(st => ({ projects: st.projects.map(p => p.id !== st.activeProjectId ? p : { ...p, goals: [...p.goals, g] }), showGoalModal: false }))
  }

  // ---------- focus timer ----------
  modeSecs(mode) { const p = (this.ap() || this.emptyProjectShape()).settings.pomo; return (mode === 'focus' ? p.focus : mode === 'short' ? p.short : p.long) * 60 }
  setMode(mode) { this.stopNoise(); this.setState(s => ({ timer: { ...s.timer, mode, secsLeft: this.modeSecs(mode), running: false, endsAt: null } }), () => this.persist()) }
  setFocusMinutes(min) { const m = Math.max(1, Math.min(180, Math.round(+min || 0))); this.commit(s => { const onFocus = s.timer.mode === 'focus' && !s.timer.running; return { projects: s.projects.map(p => p.id !== s.activeProjectId ? p : { ...p, settings: { ...p.settings, pomo: { ...p.settings.pomo, focus: m } } }), timer: onFocus ? { ...s.timer, secsLeft: m*60 } : s.timer } }) }
  toggleTimer() {
    this.setState(s => {
      const running = !s.timer.running
      let { secsLeft, endsAt } = s.timer
      if (running) { endsAt = Date.now() + secsLeft*1000 }
      else { if (endsAt) secsLeft = Math.max(0, Math.round((endsAt - Date.now())/1000)); endsAt = null }
      return { timer: { ...s.timer, running, secsLeft, endsAt } }
    }, () => { this.persist(); if (this.state.timer.running && this.state.timer.mode === 'focus') this.startNoise(); else this.stopNoise() })
  }
  resetTimer() { this.stopNoise(); this.setState(s => ({ timer: { ...s.timer, secsLeft: this.modeSecs(s.timer.mode), running: false, endsAt: null } }), () => this.persist()) }
  skipTimer() { this.completeBlock(true) }
  tick() {
    const t = this.state.timer
    if (!t.running) return
    if (t.endsAt) {
      const left = Math.round((t.endsAt - Date.now())/1000)
      if (left <= 0) { this.completeBlock(false) }
      else if (left !== t.secsLeft) { this.setState({ timer: { ...t, secsLeft: left } }) }
    } else if (t.secsLeft > 1) { this.setState({ timer: { ...t, secsLeft: t.secsLeft - 1 } }) }
    else { this.completeBlock(false) }
  }
  completeBlock(skipped) {
    const t = this.state.timer
    this.stopNoise()
    if (t.mode === 'focus' && !skipped) {
      const dur = this.modeSecs('focus')
      const h = +(dur / 3600).toFixed(2)
      const sess = { id: uid(), date: Date.now(), hours: h, learnHours: +(h*0.6).toFixed(2), buildHours: +(h*0.4).toFixed(2), goalId: t.goalId, note: '', source: 'pomodoro' }
      this.commit(st => ({ projects: st.projects.map(p => p.id !== st.activeProjectId ? p : { ...p, sessions: [sess, ...p.sessions] }), timer: { ...st.timer, mode:'short', secsLeft: this.modeSecs('short'), running:false, endsAt:null, sessionNum: st.timer.sessionNum + 1 } }))
    } else {
      const next = t.mode === 'focus' ? 'short' : 'focus'
      this.setState({ timer: { ...t, mode: next, secsLeft: this.modeSecs(next), running: false, endsAt:null } }, () => this.persist())
    }
  }

  // ---------- ambient sound ----------
  startNoise() {
    try {
      const t = this.state.timer
      if (!this._actx) this._actx = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = this._actx
      if (ctx.state === 'suspended') ctx.resume()
      this.stopNoise()
      const size = 2 * ctx.sampleRate
      const buf = ctx.createBuffer(1, size, ctx.sampleRate)
      const data = buf.getChannelData(0)
      if (t.noise === 'white') { for (let i=0;i<size;i++) data[i] = Math.random()*2-1 }
      else if (t.noise === 'pink') { let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0; for (let i=0;i<size;i++){ const w=Math.random()*2-1; b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980; data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926 } }
      else { let last=0; for (let i=0;i<size;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; data[i]=last*3.5 } }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true
      const gain = ctx.createGain(); gain.gain.value = (t.volume/100) * 0.5
      src.connect(gain).connect(ctx.destination); src.start()
      this._noiseSrc = src; this._noiseGain = gain
    } catch (e) {}
  }
  stopNoise() { try { if (this._noiseSrc) { this._noiseSrc.stop(); this._noiseSrc.disconnect() } if (this._noiseGain) this._noiseGain.disconnect() } catch (e) {} this._noiseSrc = null; this._noiseGain = null }
  setNoise(n) { this.commit(s => ({ projects: s.projects.map(p => p.id !== s.activeProjectId ? p : { ...p, settings: { ...p.settings, noise: n } }), timer: { ...s.timer, noise: n } })); setTimeout(() => { if (this.state.timer.running && this.state.timer.mode==='focus') this.startNoise() }, 0) }
  setVolume(v) { this.setState(s => ({ projects: s.projects.map(p => p.id !== s.activeProjectId ? p : { ...p, settings: { ...p.settings, volume: v } }), timer: { ...s.timer, volume: v } }), () => { if (this._noiseGain) this._noiseGain.gain.value = (v/100)*0.5; this.persist() }) }
  setFocusGoal(id) { this.commit(s => ({ timer: { ...s.timer, goalId: id }, projects: s.projects.map(p => p.id !== s.activeProjectId ? p : { ...p, activeGoalId: id }) })) }
  setLook(v) { this.commit(() => ({ look: v })) }

  renderVals() {
    const st = this.state
    const p = this.ap() || this.emptyProjectShape()
    const noProjects = st.projects.length === 0
    const set = p.settings
    const look = st.look || this.props.look || 'slate'
    const screen = st.screen
    const themeHex = (noProjects || st.showCreate) ? (st.ob.color || '#00d97e') : (p.color || '#00d97e')
    const themeVars = themeVarsFor(themeHex)
    const aRGB = (c => c.r+','+c.g+','+c.b)(hexToRgb(themeHex))
    const navBase = 'display:flex;align-items:center;gap:13px;width:100%;padding:11px 14px;border:none;border-radius:12px;cursor:pointer;font-family:var(--font-brand);font-size:15.5px;font-weight:600;text-align:right;background:transparent;color:var(--app-muted);'
    const navActive = 'display:flex;align-items:center;gap:13px;width:100%;padding:11px 14px;border:none;border-radius:12px;cursor:pointer;font-family:var(--font-brand);font-size:15.5px;font-weight:700;text-align:right;background:var(--app-surface-2);color:var(--app-text);'
    const nav = k => (screen === k ? navActive : navBase)

    // notes
    const noteSort = st.noteSort || 'updated'
    const noteSorter = noteSort==='created' ? (a,b)=>b.createdAt-a.createdAt
      : noteSort==='title' ? (a,b)=>((a.title||'').trim()||'ببب').localeCompare((b.title||'').trim()||'ببب','ar')
      : (a,b)=>b.updatedAt-a.updatedAt
    const noteList = [...(p.notesList||[])].sort(noteSorter)
    const activeNote = noteList.find(n => n.id === st.activeNoteId) || null
    const noteFmt = (ts) => { const d=new Date(ts); return d.getDate()+' '+AR_MONTHS[d.getMonth()]+' · '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0') }
    const noteUpdated = activeNote ? noteFmt(activeNote.updatedAt) : ''
    const stripHtml = (s) => (s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()
    const notesItems = noteList.map(n => {
      const isAct = activeNote && n.id === activeNote.id
      const body = stripHtml(n.body)
      const td = n.todos||[]; const tdDone = td.filter(x=>x.done).length
      return {
        id: n.id,
        title: (n.title||'').trim() || 'بدون عنوان',
        snippet: body ? (body.length>72 ? body.slice(0,72)+'…' : body) : 'لا محتوى بعد',
        date: noteFmt(n.updatedAt),
        hasTodos: td.length>0, todoLabel: tdDone+'/'+td.length,
        select: () => this.selectNote(n.id),
        cardStyle: 'text-align:right;width:100%;background:'+(isAct?'var(--app-surface-2)':'var(--app-surface)')+';border:1px solid '+(isAct?'var(--app-accent)':'var(--app-border)')+';border-radius:14px;padding:14px 16px;cursor:pointer;display:flex;flex-direction:column;gap:5px;font-family:var(--font-brand);color:var(--app-text);',
        titleStyle: 'font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:'+((n.title||'').trim()?'var(--app-text)':'var(--app-faint)')+';',
      }
    })
    const noteSortOptions = [['updated','الأحدث'],['created','الإنشاء'],['title','العنوان']].map(([k,lab]) => ({
      key: k, label: lab, select: () => this.setNoteSort(k),
      style: 'border:none;cursor:pointer;font:600 12px var(--font-brand);padding:6px 11px;border-radius:8px;'+(noteSort===k?'background:var(--app-accent);color:var(--app-accent-on);':'background:transparent;color:var(--app-faint);'),
    }))
    const aTodos = activeNote ? (activeNote.todos||[]) : []
    const noteTodos = aTodos.map(t => ({
      id: t.id, text: t.text, done: t.done,
      toggle: () => this.toggleTodo(t.id), setText: e => this.setTodoText(t.id, e.target.value), remove: () => this.removeTodo(t.id),
      boxStyle: 'width:20px;height:20px;flex-shrink:0;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;border:2px solid '+(t.done?'var(--app-accent)':'var(--app-border)')+';background:'+(t.done?'var(--app-accent)':'transparent')+';',
      textStyle: 'flex:1;min-width:0;background:transparent;border:none;outline:none;font:14px var(--font-brand);color:'+(t.done?'var(--app-faint)':'var(--app-text)')+';'+(t.done?'text-decoration:line-through;':''),
    }))
    const todoDone = aTodos.filter(t=>t.done).length

    const sessions = p.sessions
    const totalHoursN = sessions.reduce((a,b)=>a+b.hours,0)
    const learnN = sessions.reduce((a,b)=>a+(b.learnHours||0),0)
    const buildN = sessions.reduce((a,b)=>a+(b.buildHours||0),0)
    const lbTot = learnN + buildN || 1
    const hasLB = (learnN + buildN) > 0
    const learnPct = Math.round(learnN/lbTot*100)
    const totalPct = Math.min(1, totalHoursN / set.totalHourGoal)

    let streak = 0; const daySet = new Set(sessions.map(x => dayStart(x.date)))
    let cur = dayStart(Date.now())
    if (!daySet.has(cur)) cur -= DAY
    while (daySet.has(cur)) { streak++; cur -= DAY }
    const streakUnit = streak === 1 ? 'يوم' : streak === 2 ? 'يومين' : (streak >= 3 && streak <= 10) ? 'أيام' : 'يومًا'

    const weeksDone = p.curriculum.reduce((a,m)=>a+m.weeks.filter(w=>w.done).length,0)
    const weeksTotalN = p.curriculum.reduce((a,m)=>a+m.weeks.length,0)

    const monthsCountN = p.curriculum.length
    const monthsLabel = (n => {
      if (n === 0) return 'لا مراحل'
      if (n === 1) return 'شهر واحد'
      if (n === 2) return 'شهران'
      if (n <= 10) return n + ' أشهر'
      return n + ' شهرًا'
    })(monthsCountN)

    // projects switcher
    const projectList = st.projects.map(pr => {
      const isAct = pr.id === st.activeProjectId
      const ph = pr.sessions.reduce((a,b)=>a+b.hours,0)
      return {
        id: pr.id, name: pr.name, hours: fmt1(ph), goals: pr.goals.length, canDelete: st.projects.length > 1,
        rowStyle: 'display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;' + (isAct ? 'background:var(--app-surface-2);' : ''),
        dotStyle: 'width:8px;height:8px;border-radius:50%;flex-shrink:0;background:' + (isAct ? 'var(--app-accent)' : 'var(--app-border)') + ';',
        select: () => this.switchProject(pr.id),
        remove: (e) => this.removeProject(e, pr.id),
      }
    })

    const statusMeta = {
      on:      { color:'var(--st-on)',     bg:'var(--st-on-bg)',     label:'على المسار', dot:true },
      behind:  { color:'var(--st-behind)', bg:'var(--st-behind-bg)', label:'متأخر',      dot:true },
      risk:    { color:'var(--st-risk)',   bg:'var(--st-risk-bg)',   label:'معرّض للخطر', dot:true },
      done:    { color:'var(--st-on)',     bg:'var(--st-on-bg)',     label:'مكتمل',      dot:true },
      upcoming:{ color:'var(--app-faint)', bg:'var(--app-surface-2)',label:'قادم',       dot:false },
    }
    const badge = m => 'display:inline-flex;align-items:center;gap:5px;background:'+m.bg+';color:'+m.color+';font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;'
    const dotS = m => m.dot ? 'width:6px;height:6px;border-radius:50%;background:'+m.color+';' : 'display:none;'

    const order = { active:0, upcoming:1, done:2 }
    const sortedGoals = [...p.goals].sort((a,b) => (order[a.status]-order[b.status]) || (a.deadline-b.deadline))
    const goalsView = sortedGoals.map(g => {
      const pace = this.goalPace(g)
      const m = statusMeta[pace.key]
      const pctLabel = Math.round(pace.pct*100)+'%'
      const faded = g.status==='upcoming' || g.status==='done'
      const card = 'background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:16px;cursor:pointer;'+(faded?'opacity:0.78;':'')
      let footerText, footerColor, showClock
      if (g.status==='upcoming') { footerText = 'يبدأ بعد إكمال الأهداف النشطة'; footerColor='var(--app-faint)'; showClock=false }
      else if (pace.key==='done') { footerText = 'اكتمل — أحسنت!'; footerColor='var(--st-on)'; showClock=false }
      else { footerText = pace.daysLeft+' يومًا · يلزم ~'+fmt1(pace.needed)+' سا/يوم'; footerColor = pace.key==='on'?'var(--app-muted)':m.color; showClock=true }
      return {
        id:g.id, title:g.title, done:fmt1(pace.done), budget:g.hourBudget,
        subDone:g.subTasks.filter(t=>t.done).length, subTotal:g.subTasks.length,
        pctLabel, ringColor:m.color, dash: (pace.pct*125.66).toFixed(1)+' 126',
        pctStyle: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;'+(faded?'color:var(--app-faint);':''),
        statusLabel:m.label, badgeStyle:badge(m), dotStyle:dotS(m), cardStyle:card,
        footerStyle:'border-top:1px solid var(--app-border);padding-top:13px;font-size:13px;color:'+footerColor+';display:flex;align-items:center;gap:7px;',
        footerText, showClock,
        activate: () => this.activateGoal(g.id),
      }
    })

    const activeGoal = p.goals.find(g => g.id === p.activeGoalId) || p.goals.find(g=>g.status==='active') || p.goals[0] || null
    const hasActiveGoal = !!activeGoal
    const apace = hasActiveGoal ? this.goalPace(activeGoal) : { done:0, pct:0, daysLeft:0, remaining:0, needed:0, key:'on' }
    const am = statusMeta[apace.key]
    const agDeadlineLabel = hasActiveGoal ? (() => { const d = new Date(activeGoal.deadline); return d.getDate()+' '+AR_MONTHS[d.getMonth()] })() : '—'
    const agSubs = (hasActiveGoal ? activeGoal.subTasks : []).map(t => ({
      label:t.label, done:t.done, hasEst: !!t.est, estLabel: fmt1(t.est||0)+'س',
      boxStyle: t.done ? 'width:22px;height:22px;border-radius:7px;background:var(--app-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;' : 'width:22px;height:22px;border-radius:7px;border:2px solid var(--app-border);flex-shrink:0;',
      textStyle: t.done ? 'color:var(--app-muted);text-decoration:line-through;' : '',
      toggle: () => this.toggleSub(activeGoal.id, t.id),
    }))

    const todayN = sessions.filter(x => dayStart(x.date) === dayStart(Date.now())).reduce((a,b)=>a+b.hours,0)
    const todayRemain = Math.max(0, set.dailyTarget - todayN)

    const last7 = []
    let max7 = set.dailyTarget
    const dayTotals = []
    for (let i=6;i>=0;i--){ const ds = dayStart(Date.now()-i*DAY); const h = sessions.filter(x=>dayStart(x.date)===ds).reduce((a,b)=>a+b.hours,0); dayTotals.push({ds,h,i}); if(h>max7)max7=h }
    dayTotals.forEach(({ds,h,i}) => {
      const isToday = i===0; const dow = new Date(ds).getDay()
      const pct = Math.max(6, Math.round(h/max7*100))
      last7.push({
        label: isToday ? 'اليوم' : AR_DOW_SHORT[dow],
        barStyle: 'width:100%;max-width:34px;height:'+pct+'%;border-radius:7px;background:'+(h>0?'var(--app-accent)':'var(--app-surface-2)')+';'+(isToday?'border:1px dashed var(--app-accent);background:var(--app-accent-soft);':''),
        labelStyle: 'font-size:11px;color:'+(isToday?'var(--app-text)':'var(--app-faint)')+';'+(isToday?'font-weight:700;':''),
      })
    })

    const weekBars = []; let maxW = 1; const weekTotals = []
    for (let w=7; w>=0; w--){ const start = dayStart(Date.now()) - (w*7+ new Date().getDay())*DAY; const end = start + 7*DAY; const h = sessions.filter(x=>x.date>=start && x.date<end).reduce((a,b)=>a+b.hours,0); weekTotals.push({h, idx:8-w}); if(h>maxW)maxW=h }
    weekTotals.forEach(({h,idx}) => { const isLast = idx===8; const pct = Math.max(5, Math.round(h/maxW*100)); weekBars.push({ label:String(idx), barStyle:'width:100%;max-width:38px;height:'+pct+'%;border-radius:7px;background:'+(h>0?'var(--app-accent)':'var(--app-surface-2)')+';', labelStyle:'font-size:11px;color:'+(isLast?'var(--app-text)':'var(--app-faint)')+';'+(isLast?'font-weight:700;':'') }) })

    let maxHeat = 1; const heatDays = []
    for (let i=55;i>=0;i--){ const ds = dayStart(Date.now()-i*DAY); const h = sessions.filter(x=>dayStart(x.date)===ds).reduce((a,b)=>a+b.hours,0); heatDays.push(h); if(h>maxHeat)maxHeat=h }
    const heat = heatDays.map(h => { const on = h>0; const op = Math.min(0.95, 0.22 + (h/maxHeat)*0.78).toFixed(2); return { s:'aspect-ratio:1;border-radius:4px;background:'+(on?'rgba('+aRGB+','+op+')':'var(--app-surface-2)')+';' } })

    const history = [...sessions].sort((a,b)=>b.date-a.date).slice(0,40).map(x => {
      const g = p.goals.find(gg=>gg.id===x.goalId); const d = new Date(x.date)
      return { id:x.id, day:d.getDate(), month:AR_MONTHS[d.getMonth()], goalTitle: g?g.title:'بدون هدف', isPomodoro:x.source==='pomodoro', note:x.note, hasNote: !!x.note, hoursLabel: fmt1(x.hours)+'س', learn:fmt1(x.learnHours||0), build:fmt1(x.buildHours||0), del: () => this.delSession(x.id) }
    })

    const logH = +st.logHours
    const logLearnH = fmt1(logH * st.logLearnPct/100)
    const logBuildH = fmt1(logH * (100-st.logLearnPct)/100)
    const allGoalOptions = p.goals.map(g=>({id:g.id,title:g.title}))
    const activeGoalOptions = p.goals.filter(g=>g.status==='active').map(g=>({id:g.id,title:g.title}))

    const topicInput = done => 'width:100%;background:transparent;border:none;outline:none;padding:0;font-family:var(--font-brand);font-size:14px;'+(done?'color:var(--app-muted);text-decoration:line-through;':'font-weight:600;color:var(--app-text);')
    const months = p.curriculum.map((m,mi) => {
      const dc = m.weeks.filter(w=>w.done).length
      const len = m.weeks.length
      return {
        label:'الشهر '+(AR_ORD[mi]||(mi+1)), title:m.title, doneCount:dc, total:len, empty: len===0,
        labelStyle:'font-size:12px;font-weight:700;letter-spacing:0.4px;color:'+(dc>0?'var(--app-accent)':'var(--app-faint)')+';',
        barStyle:'width:'+(len?Math.round(dc/len*100):0)+'%;height:100%;background:var(--app-accent);border-radius:4px;',
        setTitle: e => this.setMonthTitle(mi, e.target.value),
        remove: () => this.removeMonth(mi),
        addWeek: () => this.addWeek(mi),
        weeks: m.weeks.map(w => ({
          id:w.id, topic:w.topic, build:w.build, done:w.done,
          boxStyle: (w.done ? 'width:22px;height:22px;border-radius:7px;background:var(--app-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;cursor:pointer;' : 'width:22px;height:22px;border-radius:7px;border:2px solid var(--app-border);flex-shrink:0;margin-top:1px;cursor:pointer;'),
          topicStyle: topicInput(w.done),
          toggle: () => this.toggleWeek(mi, w.id),
          setTopic: e => this.setWeekField(mi, w.id, 'topic', e.target.value),
          setBuild: e => this.setWeekField(mi, w.id, 'build', e.target.value),
          remove: () => this.removeWeek(mi, w.id),
        })),
      }
    })

    const t = st.timer
    const total = this.modeSecs(t.mode)
    const focusFrac = 1 - t.secsLeft/total
    const mm = String(Math.floor(t.secsLeft/60)).padStart(2,'0')
    const ssN = String(t.secsLeft%60).padStart(2,'0')
    const tabBase = 'padding:9px 20px;border-radius:9px;font-size:14px;font-weight:600;color:var(--app-muted);cursor:pointer;'
    const tabActive = 'padding:9px 20px;border-radius:9px;font-size:14px;font-weight:700;background:var(--app-accent);color:var(--app-accent-on);cursor:pointer;'
    const focusGoal = p.goals.find(g=>g.id===t.goalId) || activeGoal
    const nextTask = focusGoal ? ((focusGoal.subTasks.find(x=>!x.done) || {}).label || 'كل المهام مكتملة — راجع أو خطط للتالي') : 'لا أهداف بعد — أضف هدفًا لربط جلستك به'
    const noiseChip = (n) => (t.noise===n) ? 'flex:1;text-align:center;padding:9px 0;border-radius:9px;font-size:13px;font-weight:700;background:var(--app-accent);color:var(--app-accent-on);cursor:pointer;' : 'flex:1;text-align:center;padding:9px 0;border-radius:9px;font-size:13px;font-weight:600;background:var(--app-surface-2);color:var(--app-muted);cursor:pointer;'

    const hr = new Date().getHours()
    const greet = hr<12 ? 'صباح الخير، عبدالله' : 'مساء الخير، عبدالله'
    const now = new Date()

    // onboarding (first project)
    const ob = st.ob
    const obGoals = ob.goals.map(g => ({
      id: g.id, title: g.title, budget: g.budget, deadline: g.deadline,
      setTitle: e => this.setObGoal(g.id,'title',e.target.value),
      setBudget: e => this.setObGoal(g.id,'budget',e.target.value),
      setDeadline: e => this.setObGoal(g.id,'deadline',e.target.value),
      remove: () => this.removeObGoal(g.id),
      addTask: () => this.addObGoalTask(g.id),
      tasks: g.tasks.map(t => ({ id: t.id, label: t.label, hours: t.hours, setLabel: e => this.setObGoalTask(g.id,t.id,'label',e.target.value), setHours: e => this.setObGoalTask(g.id,t.id,'hours',e.target.value), remove: () => this.removeObGoalTask(g.id,t.id) })),
    }))
    const obStages = ob.stages.map((sg,si) => ({
      id: sg.id, label: 'المرحلة '+(AR_ORD[si]||(si+1)), title: sg.title, empty: sg.weeks.length === 0,
      setTitle: e => this.setObStage(sg.id,e.target.value),
      remove: () => this.removeObStage(sg.id),
      addWeek: () => this.addObWeek(sg.id),
      weeks: sg.weeks.map(w => ({ id: w.id, topic: w.topic, build: w.build, setTopic: e => this.setObWeek(sg.id,w.id,'topic',e.target.value), setBuild: e => this.setObWeek(sg.id,w.id,'build',e.target.value), remove: () => this.removeObWeek(sg.id,w.id) })),
    }))
    const obSteps = ['التفاصيل','الأهداف','المنهج'].map((lab,i) => ({
      label: lab, num: String(i+1), go: () => this.obGoStep(i),
      pillStyle: 'display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:11px;cursor:pointer;font-size:13.5px;font-weight:700;border:1px solid '+(i===ob.step?'transparent':'var(--app-border)')+';'+(i===ob.step?'background:var(--app-accent-soft);color:var(--app-accent);':'color:var(--app-faint);'),
      numStyle: 'width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;'+(i===ob.step?'background:var(--app-accent);color:var(--app-accent-on);':'background:var(--app-surface-2);color:var(--app-faint);'),
    }))

    return {
      look,
      setLook: e => this.setLook(e.target.value),
      lookOptions: [
        { id:'onyx', label:'أونيكس · أسود' },
        { id:'forest', label:'غابة · أخضر' },
        { id:'slate', label:'إردوازي · أزرق' },
      ],
      isToday:screen==='today', isGoals:screen==='goals', isFocus:screen==='focus', isLog:screen==='log', isCurr:screen==='curr', isStats:screen==='stats', isNotes:screen==='notes',
      goToday:this.go('today'), goGoals:this.go('goals'), goFocus:this.go('focus'), goLog:this.go('log'), goCurr:this.go('curr'), goStats:this.go('stats'), goNotes:this.go('notes'),
      navToday:nav('today'), navGoals:nav('goals'), navFocus:nav('focus'), navLog:nav('log'), navCurr:nav('curr'), navStats:nav('stats'), navNotes:nav('notes'),

      // notes
      notesItems, notesCount: noteList.length, hasNotes: noteList.length>0, noNotes: noteList.length===0, noteSortOptions,
      activeNote: !!activeNote, noActiveNote: noteList.length>0 && !activeNote, noteTitle: activeNote? (activeNote.title||'') : '', noteSavedLabel: activeNote? ('آخر حفظ · '+noteUpdated) : '',
      noteId: activeNote ? activeNote.id : null, noteBody: activeNote ? (activeNote.body||'') : '', onNoteChange: html => this.saveNoteBody(html),
      noteTodos, todoCount: aTodos.length, todoDone, hasTodos: aTodos.length>0, noTodos: aTodos.length===0, addTodo: () => this.addTodo(),
      setNoteTitle: e => activeNote && this.updateNote(activeNote.id,'title',e.target.value),
      deleteActiveNote: () => activeNote && this.deleteNote(activeNote.id),
      addNote: () => this.addNote(),

      // theming
      themeVars,
      obColor: ob.color || '#00d97e',
      obCustomStyle: 'position:relative;width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--app-faint);background:'+( !PALETTE.some(c=>c.hex===(ob.color||'#00d97e')) ? (ob.color||'#00d97e') : 'var(--app-surface-2)')+';border:3px solid '+(!PALETTE.some(c=>c.hex===(ob.color||'#00d97e'))?'var(--app-text)':'var(--app-border)')+';',
      obSetColorInput: e => this.setObField('color', e.target.value),
      obColorOptions: PALETTE.map(c => ({
        name: c.name, pick: () => this.setObField('color', c.hex),
        style: 'width:38px;height:38px;border-radius:11px;cursor:pointer;background:'+c.hex+';border:3px solid '+((ob.color||'#00d97e')===c.hex?'var(--app-text)':'transparent')+';box-shadow:0 0 0 1px var(--app-border);transition:transform .12s;'+((ob.color||'#00d97e')===c.hex?'transform:scale(1.08);':''),
      })),

      // onboarding / project state
      noProjects, hasProjects: !noProjects,
      showOnboarding: noProjects || st.showCreate, showApp: !noProjects && !st.showCreate,
      isFirstProject: noProjects, showCancelCreate: !noProjects,
      createTitle: noProjects ? 'أنشئ مسارك الأول' : 'أنشئ مسارًا جديدًا',
      cancelCreate: () => this.cancelCreate(),
      obStep: ob.step, obIsDetails: ob.step===0, obIsGoals: ob.step===1, obIsSystems: ob.step===2,
      obShowBack: ob.step>0, obShowQuickCreate: ob.step<2 && !!ob.name.trim(), nextLabel: ob.step<2 ? 'التالي' : 'إنشاء المسار',
      obSteps,
      obName: ob.name, setObName: e=>this.setObField('name',e.target.value),
      obSubtitle: ob.subtitle, setObSubtitle: e=>this.setObField('subtitle',e.target.value),
      obHourGoal: ob.hourGoal, setObHourGoal: e=>this.setObField('hourGoal',e.target.value),
      obDailyTarget: ob.dailyTarget, setObDailyTarget: e=>this.setObField('dailyTarget',e.target.value),
      obGoals, obStages,
      addObGoal: ()=>this.addObGoal(), addObStage: ()=>this.addObStage(),
      obBack: ()=>this.obGoStep(ob.step-1), obNext: ()=>this.obNext(),
      createFirstProject: ()=>this.createFirstProject(),
      obMode: ob.mode, obFormMode: ob.mode==='form', obJsonMode: ob.mode==='json',
      setFormMode: ()=>this.setObMode('form'), setJsonMode: ()=>this.setObMode('json'),
      formTabStyle: 'flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font:600 13.5px var(--font-brand);'+(ob.mode==='form'?'background:var(--app-elev);color:var(--app-text);box-shadow:0 1px 3px rgba(0,0,0,0.3);':'background:transparent;color:var(--app-faint);'),
      jsonTabStyle: 'flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;font:600 13.5px var(--font-brand);'+(ob.mode==='json'?'background:var(--app-elev);color:var(--app-text);box-shadow:0 1px 3px rgba(0,0,0,0.3);':'background:transparent;color:var(--app-faint);'),
      obJson: ob.json, setObJson: e=>this.setObJson(e.target.value),
      obJsonError: ob.jsonError, obJsonOk: ob.jsonOk, obHasJson: !!ob.json.trim(),
      jsonMsgStyle: 'font-size:12.5px;margin-top:10px;padding:10px 12px;border-radius:10px;line-height:1.5;'+(ob.jsonOk?'background:var(--app-accent-soft);color:var(--app-accent);':'background:rgba(229,86,78,0.12);color:#f08a84;'),
      loadJsonSample: ()=>this.loadJsonSample(), createFromJson: ()=>this.createFromJson(),

      // project switcher / topbar
      projName: p.name, projSubtitle: p.subtitle, projCount: st.projects.length, projectList,
      showProjectMenu: st.showProjectMenu, toggleProjectMenu: () => this.toggleProjectMenu(), closeProjectMenu: () => this.setState({showProjectMenu:false}),
      openNewProject: () => this.openNewProject(),
      showProjectModal: st.showProjectModal, closeNewProject: () => this.setState({showProjectModal:false}),
      npName: st.npName, setNpName: e => this.setState({npName:e.target.value}),
      npSubtitle: st.npSubtitle, setNpSubtitle: e => this.setState({npSubtitle:e.target.value}),
      npHourGoal: st.npHourGoal, setNpHourGoal: e => this.setState({npHourGoal:e.target.value}),
      npDailyTarget: st.npDailyTarget, setNpDailyTarget: e => this.setState({npDailyTarget:e.target.value}),
      saveProject: () => this.saveProject(),

      streak, streakUnit, totalHours: fmt1(totalHoursN), totalGoal: set.totalHourGoal,
      totalBarStyle: 'width:'+Math.round(totalPct*100)+'%;height:100%;background:var(--app-accent);border-radius:3px;',
      weeksDone, weeksTotal: weeksTotalN,
      monthsLabel,
      learnPctLabel: hasLB?learnPct+'%':'0%', buildPctLabel: hasLB?(100-learnPct)+'%':'0%',
      learnHours: fmt1(learnN), buildHours: fmt1(buildN),
      totalPctLabel: Math.round(totalPct*100)+'%',
      lbDash: (learnN/lbTot*314).toFixed(0)+' 314',
      sessionCount: sessions.length,
      todayWeekday: AR_DAYS[now.getDay()], todayDay: now.getDate(), todayMonth: AR_MONTHS[now.getMonth()], todayYear: now.getFullYear(),
      greeting: greet, todaySub: !hasActiveGoal ? 'ابدأ بإضافة أول هدف لك لتتبّع تقدّمك وإيقاعك اليومي.' : (todayRemain>0 ? fmt1(set.dailyTarget)+' ساعات اليوم تُقرّبك خطوة من أن تصبح Full-Stack. لنبدأ.' : 'أنجزت هدف اليوم — عمل رائع! استمر غدًا.'),
      hasActiveGoal, noActiveGoal: !hasActiveGoal,
      agRingColor:am.color, agDash:(apace.pct*389.6).toFixed(1)+' 390', agPct:Math.round(apace.pct*100)+'%', agDone:fmt1(apace.done), agBudget: hasActiveGoal?activeGoal.hourBudget:0,
      agBadgeStyle:badge(am), agDotStyle:dotS(am), agStatusLabel:am.label, agTitle: hasActiveGoal?activeGoal.title:'لا يوجد هدف نشِط', agTitleShort: hasActiveGoal?(activeGoal.title.length>22?activeGoal.title.slice(0,22)+'…':activeGoal.title):'المهام',
      agDaysLeft:apace.daysLeft, agDeadlineLabel, agNeeded:fmt1(apace.needed),
      agSubDone: hasActiveGoal?activeGoal.subTasks.filter(x=>x.done).length:0, agSubTotal: hasActiveGoal?activeGoal.subTasks.length:0, agSubs,
      todayHours: fmt1(todayN), dailyTarget:set.dailyTarget,
      todayBarStyle: 'width:'+Math.min(100,Math.round(todayN/set.dailyTarget*100))+'%;height:100%;background:var(--app-accent);border-radius:5px;',
      todayRemainLabel: todayRemain>0 ? 'بقي '+fmt1(todayRemain)+' ساعة لإكمال هدف اليوم.' : 'اكتمل هدف اليوم 🎉',
      pomoFocus:set.pomo.focus, pomoShort:set.pomo.short, pomoLong:set.pomo.long,
      last7,
      goalsView, goalsTotal: p.goals.length, goalsActive: p.goals.filter(g=>g.status==='active').length,
      openNewGoal: () => this.openNewGoal(),
      historyEmpty: sessions.length === 0,
      clearAll: () => this.clearAll(), loadDemo: () => this.loadDemo(),
      addMonth: () => this.addMonth(),
      timer:t, running:t.running, paused:!t.running,
      focusLocked: t.running, focusLockAttr: t.running ? '1' : '0',
      focusDash:(focusFrac*942.48).toFixed(0)+' 943', focusTime: mm+':'+ssN, focusModeLabel: t.mode==='focus'?'تبقّى':'استراحة', sessionNum:t.sessionNum,
      tabFocus: t.mode==='focus'?tabActive:tabBase, tabShort: t.mode==='short'?tabActive:tabBase, tabLong: t.mode==='long'?tabActive:tabBase,
      setFocusMode: () => this.setMode('focus'), setShortMode: () => this.setMode('short'), setLongMode: () => this.setMode('long'),
      setFocusMinutes: e => this.setFocusMinutes(e.target.value),
      durationPresets: [25,40,50,60].map(min => ({ min, set: () => this.setFocusMinutes(min), style: (set.pomo.focus===min ? 'padding:6px 12px;border-radius:8px;font-size:13px;font-weight:700;background:var(--app-accent);color:var(--app-accent-on);cursor:pointer;' : 'padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;background:var(--app-surface);border:1px solid var(--app-border);color:var(--app-muted);cursor:pointer;') })),
      toggleTimer: () => this.toggleTimer(), resetTimer: () => this.resetTimer(), skipTimer: () => this.skipTimer(),
      focusGoalId:t.goalId, setFocusGoal: e => this.setFocusGoal(e.target.value), activeGoalOptions, focusNextTask: nextTask,
      noiseWhiteStyle:noiseChip('white'), noisePinkStyle:noiseChip('pink'), noiseBrownStyle:noiseChip('brown'),
      setNoiseWhite: () => this.setNoise('white'), setNoisePink: () => this.setNoise('pink'), setNoiseBrown: () => this.setNoise('brown'),
      volume:t.volume, volumeLabel:t.volume+'%', setVolume: e => this.setVolume(+e.target.value),
      logDate:st.logDate, setLogDate: e => this.setState({logDate:e.target.value}),
      logHours: fmt1(logH), incHours: () => this.addHours(0.5), decHours: () => this.addHours(-0.5),
      logLearnPct:st.logLearnPct, setLearnPct: e => this.setState({logLearnPct:+e.target.value}),
      logLearnH, logBuildH,
      learnSegStyle:'width:'+st.logLearnPct+'%;background:var(--st-info);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;',
      buildSegStyle:'width:'+(100-st.logLearnPct)+'%;background:var(--app-accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--app-accent-on);white-space:nowrap;overflow:hidden;',
      logGoalId:st.logGoalId, setLogGoal: e => this.setState({logGoalId:e.target.value}), allGoalOptions,
      logNote:st.logNote, setLogNote: e => this.setState({logNote:e.target.value}),
      saveSession: () => this.saveSession(),
      history,
      months,
      weekBars, heat,
      showGoalModal:st.showGoalModal, closeNewGoal: () => this.setState({showGoalModal:false}), stop: e => e.stopPropagation(),
      ngTitle:st.ngTitle, setNgTitle: e => this.setState({ngTitle:e.target.value}),
      ngDeadline:st.ngDeadline, setNgDeadline: e => this.setState({ngDeadline:e.target.value}),
      ngBudget:st.ngBudget, setNgBudget: e => this.setState({ngBudget:e.target.value}),
      ngTaskRows: st.ngTaskRows.map(r => ({ id:r.id, label:r.label, hours:r.hours, setLabel: e => this.setNgTaskField(r.id,'label',e.target.value), setHours: e => this.setNgTaskField(r.id,'hours',e.target.value), remove: () => this.removeNgTask(r.id) })),
      ngTasksTotal: fmt1(st.ngTaskRows.reduce((a,r)=>a+(+r.hours||0),0)),
      addNgTask: () => this.addNgTask(),
      saveGoal: () => this.saveGoal(),
    }
  }

  render() {
    const v = this.renderVals()
    const I = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }
    return (
      <div data-look={v.look} data-focus-lock={v.focusLockAttr} dir="rtl" style={css('min-height:100vh;display:flex;background:var(--app-canvas);color:var(--app-text);font-family:var(--font-brand);'+v.themeVars)}>

        {/* ONBOARDING (create project) */}
        {v.showOnboarding && (
        <div style={css('min-height:100vh;width:100%;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:54px 24px 90px;')}>
          <div style={css('width:100%;max-width:780px;')}>
            <div style={css('display:flex;align-items:center;gap:13px;margin-bottom:16px;')}>
              <div style={css('width:42px;height:42px;border-radius:12px;background:var(--app-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;')}>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#06231a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9"></path><path d="M12 8v4l3 2"></path></svg>
              </div>
              <div style={css('flex:1;')}>
                <div style={css('font-size:12px;color:var(--app-faint);')}>مسار التعلّم</div>
                <div style={css('font-size:25px;font-weight:700;letter-spacing:-0.3px;')}>{v.createTitle}</div>
              </div>
              {v.showCancelCreate && <button onClick={v.cancelCreate} style={css('flex-shrink:0;background:var(--app-surface);color:var(--app-muted);border:1px solid var(--app-border);border-radius:11px;padding:10px 18px;font:600 13.5px var(--font-brand);cursor:pointer;')}>إلغاء</button>}
            </div>
            <div style={css('color:var(--app-muted);font-size:15px;margin-bottom:24px;line-height:1.6;')}>عرّف مشروعك، أضف أهدافه ومنهجه، ثم أنشئه. كل التفاصيل قابلة للتعديل في أي وقت.</div>

            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:18px 20px;margin-bottom:16px;')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;')}>
                <label style={css('font-size:13.5px;font-weight:700;color:var(--app-text);')}>لون المسار</label>
                <span style={css('font-size:12px;color:var(--app-faint);')}>يصبغ الواجهة بالكامل</span>
              </div>
              <div style={css('display:flex;gap:10px;flex-wrap:wrap;align-items:center;')}>
                {v.obColorOptions.map((c, i) => (
                  <button key={i} onClick={c.pick} title={c.name} style={css(c.style)}></button>
                ))}
                <label style={css(v.obCustomStyle)}>
                  <input type="color" value={v.obColor} onInput={v.obSetColorInput} style={css('position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;border:none;padding:0;')} />
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents:'none' }}><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                </label>
              </div>
            </div>

            <div style={css('display:flex;gap:5px;padding:5px;background:var(--app-surface);border:1px solid var(--app-border);border-radius:12px;margin-bottom:20px;')}>
              <button onClick={v.setFormMode} style={css(v.formTabStyle)}>نموذج تفاعلي</button>
              <button onClick={v.setJsonMode} style={css(v.jsonTabStyle)}>لصق JSON</button>
            </div>

            {v.obFormMode && (<>
            <div style={css('display:flex;gap:9px;margin-bottom:22px;flex-wrap:wrap;')}>
              {v.obSteps.map((s, i) => (
                <div key={i} onClick={s.go} style={css(s.pillStyle)}><span className="num" style={css(s.numStyle)}>{s.num}</span>{s.label}</div>
              ))}
            </div>

            {v.obIsDetails && (
            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;')}>
              <div style={css('font-size:17px;font-weight:700;margin-bottom:4px;')}>تفاصيل المشروع</div>
              <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:20px;')}>ما المسار الذي تتعلّمه، وكم تطمح أن تستثمر فيه؟</div>
              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>اسم المشروع</label>
              <input value={v.obName} onChange={v.setObName} placeholder="مثال: مسار Full-Stack" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />
              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>وصف مختصر</label>
              <input value={v.obSubtitle} onChange={v.setObSubtitle} placeholder="مثال: من واجهات إلى Full-Stack" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />
              <div style={css('display:flex;gap:14px;')}>
                <div style={css('flex:1;')}>
                  <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>هدف الساعات الإجمالي</label>
                  <input type="number" min="1" value={v.obHourGoal} onChange={v.setObHourGoal} className="num" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
                </div>
                <div style={css('flex:1;')}>
                  <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>ساعات اليوم المستهدفة</label>
                  <input type="number" min="0.5" step="0.5" value={v.obDailyTarget} onChange={v.setObDailyTarget} className="num" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
                </div>
              </div>
            </div>
            )}

            {v.obIsGoals && (
            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;')}>
              <div style={css('font-size:17px;font-weight:700;margin-bottom:4px;')}>الأهداف</div>
              <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:20px;')}>قسّم مسارك إلى أهداف، ولكلّ هدف مهامه وساعاته. (اختياري — يمكن إضافتها لاحقًا.)</div>
              <div style={css('display:flex;flex-direction:column;gap:14px;')}>
                {v.obGoals.map((g) => (
                  <div key={g.id} style={css('border:1px solid var(--app-border);border-radius:14px;padding:16px;background:var(--app-surface-2);')}>
                    <div style={css('display:flex;gap:9px;align-items:center;margin-bottom:11px;')}>
                      <input value={g.title} onChange={g.setTitle} placeholder="عنوان الهدف" style={css('flex:1;min-width:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:10px;padding:10px 12px;font-size:14px;font-weight:600;color:var(--app-text);outline:none;')} />
                      <input type="number" min="0" step="0.5" value={g.budget} onChange={g.setBudget} className="num" placeholder="ساعات" style={css('width:74px;flex-shrink:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:10px;padding:10px 8px;font-size:13.5px;color:var(--app-text);text-align:center;outline:none;')} />
                      <button onClick={g.remove} style={css('width:36px;height:36px;flex-shrink:0;border-radius:9px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:13px;')}>✕</button>
                    </div>
                    <div style={css('display:flex;align-items:center;gap:8px;margin-bottom:12px;')}>
                      <span style={css('font-size:12px;color:var(--app-faint);flex-shrink:0;')}>الموعد:</span>
                      <input type="date" value={g.deadline} onChange={g.setDeadline} style={css('background:var(--app-elev);border:1px solid var(--app-border);border-radius:9px;padding:8px 10px;font-size:13px;color:var(--app-text);color-scheme:dark;outline:none;')} />
                    </div>
                    <div style={css('display:flex;flex-direction:column;gap:7px;')}>
                      {g.tasks.map((t) => (
                        <div key={t.id} style={css('display:flex;gap:7px;align-items:center;')}>
                          <input value={t.label} onChange={t.setLabel} placeholder="مهمة فرعية" style={css('flex:1;min-width:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:9px;padding:9px 11px;font-size:13px;color:var(--app-text);outline:none;')} />
                          <input type="number" min="0" step="0.5" value={t.hours} onChange={t.setHours} className="num" placeholder="سا" style={css('width:54px;flex-shrink:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:9px;padding:9px 6px;font-size:13px;color:var(--app-text);text-align:center;outline:none;')} />
                          <button onClick={t.remove} style={css('width:32px;height:32px;flex-shrink:0;border-radius:8px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:12px;')}>✕</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={g.addTask} style={css('margin-top:10px;display:flex;align-items:center;gap:6px;background:transparent;border:none;color:var(--app-accent);font:600 12.5px var(--font-brand);cursor:pointer;padding:2px;')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                      أضف مهمة فرعية
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={v.addObGoal} style={css('width:100%;display:flex;align-items:center;justify-content:center;gap:7px;background:transparent;border:1.5px dashed var(--app-border);border-radius:12px;padding:13px;color:var(--app-text);font:600 14px var(--font-brand);cursor:pointer;margin-top:14px;')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                أضف هدفًا
              </button>
            </div>
            )}

            {v.obIsSystems && (
            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;')}>
              <div style={css('font-size:17px;font-weight:700;margin-bottom:4px;')}>المنهج والمراحل</div>
              <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:20px;')}>رتّب تعلّمك في مراحل (أشهر)، ولكل مرحلة مواضيعها الأسبوعية. (اختياري.)</div>
              <div style={css('display:flex;flex-direction:column;gap:14px;')}>
                {v.obStages.map((sg) => (
                  <div key={sg.id} style={css('border:1px solid var(--app-border);border-radius:14px;padding:16px;background:var(--app-surface-2);')}>
                    <div style={css('display:flex;gap:9px;align-items:center;margin-bottom:12px;')}>
                      <span style={css('font-size:12px;font-weight:700;color:var(--app-faint);flex-shrink:0;')}>{sg.label}</span>
                      <input value={sg.title} onChange={sg.setTitle} placeholder="عنوان المرحلة" style={css('flex:1;min-width:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:10px;padding:10px 12px;font-size:14px;font-weight:600;color:var(--app-text);outline:none;')} />
                      <button onClick={sg.remove} style={css('width:36px;height:36px;flex-shrink:0;border-radius:9px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:13px;')}>✕</button>
                    </div>
                    <div style={css('display:flex;flex-direction:column;gap:8px;')}>
                      {sg.weeks.map((w) => (
                        <div key={w.id} style={css('display:flex;gap:7px;align-items:center;')}>
                          <input value={w.topic} onChange={w.setTopic} placeholder="الموضوع" style={css('flex:1;min-width:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:9px;padding:9px 11px;font-size:13px;color:var(--app-text);outline:none;')} />
                          <input value={w.build} onChange={w.setBuild} placeholder="المخرَج / تبني" style={css('flex:1;min-width:0;background:var(--app-elev);border:1px solid var(--app-border);border-radius:9px;padding:9px 11px;font-size:13px;color:var(--app-faint);outline:none;')} />
                          <button onClick={w.remove} style={css('width:32px;height:32px;flex-shrink:0;border-radius:8px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:12px;')}>✕</button>
                        </div>
                      ))}
                      {sg.empty && <div style={css('font-size:12.5px;color:var(--app-faint);')}>لا مواضيع — أضف أوّلها بالأسفل.</div>}
                    </div>
                    <button onClick={sg.addWeek} style={css('margin-top:10px;display:flex;align-items:center;gap:6px;background:transparent;border:none;color:var(--app-accent);font:600 12.5px var(--font-brand);cursor:pointer;padding:2px;')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                      أضف أسبوعًا
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={v.addObStage} style={css('width:100%;display:flex;align-items:center;justify-content:center;gap:7px;background:transparent;border:1.5px dashed var(--app-border);border-radius:12px;padding:13px;color:var(--app-text);font:600 14px var(--font-brand);cursor:pointer;margin-top:14px;')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                أضف مرحلة
              </button>
            </div>
            )}

            <div style={css('display:flex;align-items:center;gap:12px;margin-top:22px;')}>
              {v.obShowBack && <button onClick={v.obBack} style={css('background:var(--app-surface);color:var(--app-text);border:1px solid var(--app-border);border-radius:12px;padding:13px 22px;font:600 14px var(--font-brand);cursor:pointer;')}>السابق</button>}
              <div style={css('flex:1;')}></div>
              {v.obShowQuickCreate && <button onClick={v.createFirstProject} style={css('background:transparent;color:var(--app-muted);border:none;font:600 14px var(--font-brand);cursor:pointer;padding:13px 10px;')}>إنشاء الآن</button>}
              <button onClick={v.obNext} style={css('background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:13px 26px;font:700 14px var(--font-brand);cursor:pointer;')}>{v.nextLabel}</button>
            </div>
            </>)}

            {v.obJsonMode && (
            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px;')}>
                <div style={css('font-size:17px;font-weight:700;')}>إنشاء من كائن JSON</div>
                <button onClick={v.loadJsonSample} style={css('background:var(--app-surface-2);color:var(--app-accent);border:1px solid var(--app-border);border-radius:9px;padding:7px 13px;font:600 12.5px var(--font-brand);cursor:pointer;')}>إدراج مثال</button>
              </div>
              <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:16px;line-height:1.6;')}>ألصق كائن المشروع بالكامل — تفاصيله وأهدافه ومنهجه — ثم أنشئه دفعة واحدة. الحقل الوحيد المطلوب هو <span className="num" style={css('font-weight:700;color:var(--app-text);')}>name</span>.</div>
              <textarea value={v.obJson} onChange={v.setObJson} dir="ltr" spellCheck="false" placeholder={'{\n  "name": "مسار Full-Stack",\n  "hourGoal": 216,\n  "goals": [ { "title": "...", "tasks": [...] } ],\n  "stages": [ { "title": "...", "weeks": [...] } ]\n}'} style={css('width:100%;min-height:300px;resize:vertical;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:12px;padding:14px;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--app-text);outline:none;text-align:left;')} />
              {v.obHasJson && <div style={css(v.jsonMsgStyle)}>{v.obJsonError}</div>}
              <div style={css('display:flex;align-items:center;gap:12px;margin-top:18px;')}>
                <div style={css('font-size:12px;color:var(--app-faint);flex:1;')}>المفاتيح المدعومة: name، subtitle، hourGoal، dailyTarget، goals[]، stages[].</div>
                <button onClick={v.createFromJson} style={css('background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:13px 26px;font:700 14px var(--font-brand);cursor:pointer;')}>إنشاء المسار</button>
              </div>
            </div>
            )}
          </div>
        </div>
        )}

        {v.showApp && (
        <>
        {/* SIDEBAR */}
        <aside className="focus-lockable" style={css('width:252px;flex-shrink:0;border-left:1px solid var(--app-border);padding:26px 18px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:6px;')}>
          <div style={css('position:relative;padding-bottom:18px;')}>
            <button onClick={v.toggleProjectMenu} style={css('width:100%;display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:13px;background:var(--app-surface);border:1px solid var(--app-border);cursor:pointer;font-family:var(--font-brand);text-align:right;color:var(--app-text);')}>
              <div style={css('width:34px;height:34px;border-radius:10px;background:var(--app-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;')}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#06231a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9"></path><path d="M12 8v4l3 2"></path></svg>
              </div>
              <div style={css('flex:1;min-width:0;')}>
                <div style={css('font-size:11px;color:var(--app-faint);line-height:1;')}>مسار التعلّم</div>
                <div style={css('font-weight:700;font-size:15px;line-height:1.2;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;')}>{v.projName}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6"></path></svg>
            </button>

            {v.showProjectMenu && (
            <>
              <div onClick={v.closeProjectMenu} style={css('position:fixed;inset:0;z-index:39;')}></div>
              <div style={css('position:absolute;top:100%;right:0;left:0;margin-top:7px;background:var(--app-elev);border:1px solid var(--app-border);border-radius:15px;padding:7px;z-index:40;box-shadow:0 20px 46px rgba(0,0,0,0.55);max-height:60vh;overflow:auto;')}>
                <div style={css('font-size:11px;color:var(--app-faint);padding:6px 9px 7px;')}>مشاريعك · <span className="num">{v.projCount}</span></div>
                {v.projectList.map((pr) => (
                  <div key={pr.id} style={css(pr.rowStyle)} onClick={pr.select}>
                    <span style={css(pr.dotStyle)}></span>
                    <div style={css('flex:1;min-width:0;')}>
                      <div style={css('font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;')}>{pr.name}</div>
                      <div style={css('font-size:11px;color:var(--app-faint);margin-top:2px;')}><span className="num">{pr.hours}</span> ساعة · <span className="num">{pr.goals}</span> أهداف</div>
                    </div>
                    {pr.canDelete && <button onClick={pr.remove} style={css('width:28px;height:28px;flex-shrink:0;border-radius:8px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:12px;line-height:1;')}>✕</button>}
                  </div>
                ))}
                <button onClick={v.openNewProject} style={css('width:100%;display:flex;align-items:center;gap:9px;padding:11px 10px;margin-top:4px;border-radius:10px;background:transparent;border:1.5px dashed var(--app-border);color:var(--app-text);cursor:pointer;font-family:var(--font-brand);')}>
                  <span style={css('width:26px;height:26px;border-radius:8px;background:var(--app-accent-soft);display:flex;align-items:center;justify-content:center;flex-shrink:0;')}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></span>
                  <span style={css('font-size:14px;font-weight:600;')}>مشروع جديد</span>
                </button>
              </div>
            </>
            )}
          </div>

          <button onClick={v.goToday} style={css(v.navToday)}>
            <svg width="21" height="21" viewBox="0 0 24 24" strokeWidth="1.7" {...I}><path d="M3 10.5 12 4l9 6.5"></path><path d="M5.5 9.5V20h13V9.5"></path></svg>
            <span>اليوم</span>
          </button>
          <button onClick={v.goGoals} style={css(v.navGoals)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4.2"></circle><circle cx="12" cy="12" r="1" fill="currentColor"></circle></svg>
            <span>الأهداف</span>
          </button>
          <button onClick={v.goFocus} style={css(v.navFocus)}>
            <svg width="21" height="21" viewBox="0 0 24 24" strokeWidth="1.7" {...I}><circle cx="12" cy="13.5" r="7.5"></circle><path d="M12 13.5V9.5"></path><path d="M9.5 3h5"></path></svg>
            <span>تركيز</span>
          </button>
          <button onClick={v.goLog} style={css(v.navLog)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path><circle cx="4.5" cy="6" r="1.1" fill="currentColor"></circle><circle cx="4.5" cy="12" r="1.1" fill="currentColor"></circle><circle cx="4.5" cy="18" r="1.1" fill="currentColor"></circle></svg>
            <span>السجل</span>
          </button>
          <button onClick={v.goCurr} style={css(v.navCurr)}>
            <svg width="21" height="21" viewBox="0 0 24 24" strokeWidth="1.7" {...I}><rect x="4" y="5" width="16" height="15" rx="2.5"></rect><path d="M4 9.5h16"></path><path d="M9 3v4"></path><path d="M15 3v4"></path></svg>
            <span>المنهج</span>
          </button>
          <button onClick={v.goStats} style={css(v.navStats)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 20V13"></path><path d="M10 20V8"></path><path d="M15 20V15"></path><path d="M20 20V5"></path></svg>
            <span>الإحصائيات</span>
          </button>
          <button onClick={v.goNotes} style={css(v.navNotes)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h11l3 3v13H5z"></path><path d="M9 9h6"></path><path d="M9 13h6"></path><path d="M9 17h3"></path></svg>
            <span>ملاحظات</span>
          </button>

          <div style={css('margin-top:auto;display:flex;flex-direction:column;gap:10px;')}>
            <div style={css('border:1px solid var(--app-border);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;')}>
              <div style={css('width:40px;height:40px;border-radius:11px;background:var(--app-accent-soft);display:flex;align-items:center;justify-content:center;flex-shrink:0;')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1.5 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.4.5-2.5 1-3 0 1.5 1 2 1.5 2 .8 0 1-.8.5-2-.5-1.3-.5-2.7 1-5z"></path></svg>
              </div>
              <div>
                <div style={css('font-size:20px;font-weight:700;line-height:1;')}><span className="num">{v.streak}</span> {v.streakUnit}</div>
                <div style={css('font-size:12px;color:var(--app-faint);margin-top:3px;')}>سلسلة متتالية</div>
              </div>
            </div>
            <div style={css('position:relative;')}>
              <div style={css('font-size:11px;color:var(--app-faint);margin-bottom:6px;padding-right:2px;')}>مظهر الألوان</div>
              <select value={v.look} onChange={v.setLook} style={css('width:100%;appearance:none;background:var(--app-surface);border:1px solid var(--app-border);border-radius:11px;padding:10px 36px 10px 12px;color:var(--app-text);font:600 13px var(--font-brand);cursor:pointer;')}>
                {v.lookOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--app-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:'13px', bottom:'13px', pointerEvents:'none' }}><path d="m6 9 6 6 6-6"></path></svg>
            </div>
            <div style={css('display:flex;gap:8px;')}>
              <button onClick={v.loadDemo} style={css('flex:1;background:transparent;border:1px solid var(--app-border);border-radius:10px;padding:9px;color:var(--app-muted);font:600 12px var(--font-brand);cursor:pointer;')}>بيانات تجريبية</button>
              <button onClick={v.clearAll} style={css('flex:1;background:transparent;border:1px solid var(--app-border);border-radius:10px;padding:9px;color:var(--app-faint);font:600 12px var(--font-brand);cursor:pointer;')}>مسح الكل</button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={css('flex:1;min-width:0;display:flex;flex-direction:column;')}>

          <header className="focus-lockable" style={css('display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 34px;border-bottom:1px solid var(--app-border);flex-wrap:wrap;')}>
            <div style={css('display:flex;align-items:center;gap:30px;flex-wrap:wrap;')}>
              <div style={css('min-width:150px;')}>
                <div style={css('font-size:12px;color:var(--app-faint);margin-bottom:6px;')}>إجمالي ساعات التعلّم</div>
                <div style={css('display:flex;align-items:baseline;gap:6px;')}><span className="num" style={css('font-size:21px;font-weight:700;')}>{v.totalHours}</span><span style={css('color:var(--app-faint);font-size:13px;')}>/ <span className="num">{v.totalGoal}</span> ساعة</span></div>
                <div style={css('height:4px;border-radius:3px;background:var(--app-surface-2);margin-top:8px;overflow:hidden;')}><div style={css(v.totalBarStyle)}></div></div>
              </div>
              <div style={css('width:1px;height:38px;background:var(--app-border);')}></div>
              <div>
                <div style={css('font-size:12px;color:var(--app-faint);margin-bottom:6px;')}>أسابيع المنهج</div>
                <div style={css('display:flex;align-items:baseline;gap:6px;')}><span className="num" style={css('font-size:21px;font-weight:700;')}>{v.weeksDone}</span><span style={css('color:var(--app-faint);font-size:13px;')}>/ <span className="num">{v.weeksTotal}</span> أسبوع</span></div>
              </div>
              <div style={css('width:1px;height:38px;background:var(--app-border);')}></div>
              <div>
                <div style={css('font-size:12px;color:var(--app-faint);margin-bottom:6px;')}>تعلّم · بناء</div>
                <div style={css('display:flex;align-items:baseline;gap:7px;')}><span className="num" style={css('font-size:21px;font-weight:700;color:var(--st-info);')}>{v.learnPctLabel}</span><span style={css('color:var(--app-faint);')}>·</span><span className="num" style={css('font-size:21px;font-weight:700;color:var(--app-accent);')}>{v.buildPctLabel}</span></div>
              </div>
            </div>
            <div style={css('display:flex;align-items:center;gap:16px;')}>
              <div style={css('text-align:left;')}>
                <div style={css('font-size:13px;color:var(--app-faint);')}>{v.todayWeekday}</div>
                <div style={css('font-size:15px;font-weight:600;')}><span className="num">{v.todayDay}</span> {v.todayMonth} <span className="num">{v.todayYear}</span></div>
              </div>
              <button onClick={v.goFocus} style={css('display:flex;align-items:center;gap:8px;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:11px;padding:11px 18px;font:700 14px var(--font-brand);cursor:pointer;')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13l11-6.5z"></path></svg>
                ابدأ التركيز
              </button>
            </div>
          </header>

          {/* SCREEN: TODAY */}
          {v.isToday && (
          <section style={css('padding:34px;display:flex;flex-direction:column;gap:24px;')}>
            <div>
              <div style={css('font-size:28px;font-weight:700;letter-spacing:-0.3px;')}>{v.greeting}</div>
              <div style={css('color:var(--app-muted);font-size:16px;margin-top:6px;')}>{v.todaySub}</div>
            </div>

            <div style={css('display:grid;grid-template-columns:1.55fr 1fr;gap:22px;align-items:stretch;')}>
              {v.hasActiveGoal && (
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;display:flex;gap:26px;align-items:center;')}>
                <div style={css('position:relative;width:148px;height:148px;flex-shrink:0;')}>
                  <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="74" cy="74" r="62" fill="none" stroke="var(--app-surface-2)" strokeWidth="11"></circle>
                    <circle cx="74" cy="74" r="62" fill="none" stroke={v.agRingColor} strokeWidth="11" strokeLinecap="round" strokeDasharray={v.agDash}></circle>
                  </svg>
                  <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;')}>
                    <div className="num" style={css('font-size:30px;font-weight:700;line-height:1;')}>{v.agPct}</div>
                    <div style={css('font-size:12px;color:var(--app-faint);margin-top:4px;')}><span className="num">{v.agDone}</span> / <span className="num">{v.agBudget}</span> ساعة</div>
                  </div>
                </div>
                <div style={css('flex:1;min-width:0;')}>
                  <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:8px;')}>
                    <span style={css('font-size:12px;color:var(--app-faint);letter-spacing:0.4px;')}>هدفك النشِط</span>
                    <span style={css(v.agBadgeStyle)}><span style={css(v.agDotStyle)}></span>{v.agStatusLabel}</span>
                  </div>
                  <div style={css('font-size:23px;font-weight:700;line-height:1.25;')}>{v.agTitle}</div>
                  <div style={css('color:var(--app-muted);font-size:14px;margin-top:8px;display:flex;align-items:center;gap:7px;')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...I}><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
                    ينتهي خلال <span className="num">{v.agDaysLeft}</span> يومًا · <span className="num">{v.agDeadlineLabel}</span>
                  </div>
                  <div style={css('margin-top:16px;padding:13px 15px;border-radius:12px;background:var(--app-accent-soft);display:flex;align-items:center;gap:10px;')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"></path><path d="M21 7v5h-5"></path></svg>
                    <span style={css('font-size:14px;')}>تحتاج <b className="num">~{v.agNeeded}</b> ساعة/يوم للبقاء على المسار حتى الموعد.</span>
                  </div>
                </div>
              </div>
              )}

              {v.noActiveGoal && (
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:13px;')}>
                <div style={css('width:62px;height:62px;border-radius:18px;background:var(--app-accent-soft);display:flex;align-items:center;justify-content:center;')}>
                  <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="1.7"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4.4"></circle><circle cx="12" cy="12" r="1" fill="var(--app-accent)"></circle></svg>
                </div>
                <div style={css('font-size:20px;font-weight:700;')}>لا أهداف بعد</div>
                <div style={css('font-size:14px;color:var(--app-muted);max-width:340px;line-height:1.6;')}>أضف هدفك الأول — عنوان، موعد، ميزانية ساعات، ومهام — وسيتتبّع التطبيق تقدّمك وإيقاعك تلقائيًا.</div>
                <button onClick={v.openNewGoal} style={css('margin-top:4px;display:flex;align-items:center;gap:8px;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:13px 20px;font:700 15px var(--font-brand);cursor:pointer;')}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                  أضف أول هدف
                </button>
              </div>
              )}

              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;display:flex;flex-direction:column;')}>
                <div style={css('font-size:13px;color:var(--app-faint);')}>هدف اليوم</div>
                <div style={css('display:flex;align-items:baseline;gap:8px;margin-top:8px;')}>
                  <span className="num" style={css('font-size:46px;font-weight:700;line-height:0.9;')}>{v.todayHours}</span>
                  <span style={css('color:var(--app-muted);font-size:16px;')}>/ <span className="num">{v.dailyTarget}</span> ساعات</span>
                </div>
                <div style={css('height:8px;border-radius:5px;background:var(--app-surface-2);margin-top:16px;overflow:hidden;')}><div style={css(v.todayBarStyle)}></div></div>
                <div style={css('font-size:13px;color:var(--app-muted);margin-top:10px;')}>{v.todayRemainLabel}</div>
                <button onClick={v.goFocus} style={css('margin-top:auto;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:14px;padding:16px;font:700 17px var(--font-brand);cursor:pointer;width:100%;')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13l11-6.5z"></path></svg>
                  ابدأ جلسة تركيز
                </button>
                <div style={css('text-align:center;font-size:12px;color:var(--app-faint);margin-top:10px;')}>بومودورو · <span className="num">{v.pomoFocus}</span> دقيقة تركيز</div>
              </div>
            </div>

            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:22px;')}>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:24px;')}>
                <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;')}>
                  <div style={css('font-size:16px;font-weight:700;')}>المهام الفرعية · {v.agTitleShort}</div>
                  <span style={css('font-size:13px;color:var(--app-faint);')}><span className="num">{v.agSubDone}</span> / <span className="num">{v.agSubTotal}</span></span>
                </div>
                <div style={css('display:flex;flex-direction:column;gap:12px;')}>
                  {v.agSubs.map((t, i) => (
                    <div key={i} style={css('display:flex;align-items:center;gap:12px;cursor:pointer;')} onClick={t.toggle}>
                      <span style={css(t.boxStyle)}>{t.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06231a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"></path></svg>}</span>
                      <span style={css(t.textStyle)}>{t.label}</span>
                      {t.hasEst && <span className="num" style={css('margin-right:auto;font-size:12px;color:var(--app-faint);flex-shrink:0;')}>{t.estLabel}</span>}
                    </div>
                  ))}
                  {v.noActiveGoal && <div style={css('font-size:13.5px;color:var(--app-faint);padding:6px 0;')}>لا مهام بعد — أضف هدفًا لرؤية مهامه هنا.</div>}
                </div>
              </div>

              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:24px;')}>
                <div style={css('font-size:16px;font-weight:700;margin-bottom:18px;')}>نشاط آخر ٧ أيام</div>
                <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:10px;height:96px;')}>
                  {v.last7.map((b, i) => (
                    <div key={i} style={css('display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;')}><div style={css(b.barStyle)}></div><span style={css(b.labelStyle)}>{b.label}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          )}

          {/* SCREEN: GOALS */}
          {v.isGoals && (
          <section style={css('padding:34px;')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;')}>
              <div>
                <div style={css('font-size:26px;font-weight:700;')}>الأهداف</div>
                <div style={css('color:var(--app-muted);font-size:14px;margin-top:5px;')}><span className="num">{v.goalsTotal}</span> أهداف · <span className="num">{v.goalsActive}</span> نشطة · أساس رحلتك نحو Full-Stack</div>
              </div>
              <button onClick={v.openNewGoal} style={css('display:flex;align-items:center;gap:8px;background:var(--app-surface);color:var(--app-text);border:1px solid var(--app-border);border-radius:11px;padding:11px 16px;font:600 14px var(--font-brand);cursor:pointer;')}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                هدف جديد
              </button>
            </div>

            <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;')}>
              {v.goalsView.map((g) => (
                <div key={g.id} style={css(g.cardStyle)} onClick={g.activate}>
                  <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:12px;')}>
                    <span style={css(g.badgeStyle)}><span style={css(g.dotStyle)}></span>{g.statusLabel}</span>
                    <div style={css('position:relative;width:50px;height:50px;flex-shrink:0;')}>
                      <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)' }}><circle cx="25" cy="25" r="20" fill="none" stroke="var(--app-surface-2)" strokeWidth="5"></circle><circle cx="25" cy="25" r="20" fill="none" stroke={g.ringColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={g.dash}></circle></svg>
                      <div className="num" style={css(g.pctStyle)}>{g.pctLabel}</div>
                    </div>
                  </div>
                  <div style={css('font-size:17px;font-weight:700;line-height:1.3;')}>{g.title}</div>
                  <div style={css('display:flex;justify-content:space-between;font-size:13px;color:var(--app-muted);')}>
                    <span><span className="num">{g.done}</span> / <span className="num">{g.budget}</span> ساعة</span>
                    <span style={css('color:var(--app-faint);')}><span className="num">{g.subDone}</span> / <span className="num">{g.subTotal}</span> مهام</span>
                  </div>
                  <div style={css(g.footerStyle)}>
                    {g.showClock && <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>}
                    <span>{g.footerText}</span>
                  </div>
                </div>
              ))}

              <button onClick={v.openNewGoal} style={css('background:transparent;border:1.5px dashed var(--app-border);border-radius:16px;padding:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;color:var(--app-faint);min-height:200px;font-family:var(--font-brand);')}>
                <span style={css('width:46px;height:46px;border-radius:13px;background:var(--app-surface-2);display:flex;align-items:center;justify-content:center;')}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></span>
                <span style={css('font-size:15px;font-weight:600;color:var(--app-text);')}>أضف هدفًا جديدًا</span>
                <span style={css('font-size:12.5px;')}>عنوان · موعد · ميزانية ساعات</span>
              </button>
            </div>
          </section>
          )}

          {/* SCREEN: FOCUS */}
          {v.isFocus && (
          <section style={css('flex:1;background:var(--focus-canvas);background-image:radial-gradient(circle at 50% 38%,var(--focus-glow),transparent 60%);padding:30px 34px 40px;display:flex;flex-direction:column;align-items:center;')}>
            {v.focusLocked && (
            <div style={css('display:inline-flex;align-items:center;gap:8px;background:var(--app-accent-soft);border:1px solid var(--app-accent);border-radius:999px;padding:6px 14px;margin-bottom:14px;')}>
              <span style={css('width:7px;height:7px;border-radius:50%;background:var(--app-accent);')}></span>
              <span style={css('font-size:12.5px;font-weight:600;color:var(--app-accent);')}>وضع التركيز نشِط · باقي الواجهة معطّلة حتى تُوقِف الجلسة</span>
            </div>
            )}
            <div className="focus-lockable" style={css('display:inline-flex;background:var(--app-surface);border:1px solid var(--app-border);border-radius:13px;padding:5px;gap:4px;margin-bottom:6px;')}>
              <span onClick={v.setFocusMode} style={css(v.tabFocus)}>تركيز <span className="num">{v.pomoFocus}</span></span>
              <span onClick={v.setShortMode} style={css(v.tabShort)}>استراحة قصيرة <span className="num">{v.pomoShort}</span></span>
              <span onClick={v.setLongMode} style={css(v.tabLong)}>استراحة طويلة <span className="num">{v.pomoLong}</span></span>
            </div>

            <div className="focus-lockable" style={css('display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap;justify-content:center;')}>
              <span style={css('font-size:12px;color:var(--app-faint);')}>مدة جلسة التركيز</span>
              <div style={css('display:inline-flex;gap:6px;')}>
                {v.durationPresets.map((d, i) => (
                  <span key={i} onClick={d.set} style={css(d.style)}><span className="num">{d.min}</span></span>
                ))}
              </div>
              <div style={css('display:flex;align-items:center;gap:6px;background:var(--app-surface);border:1px solid var(--app-border);border-radius:9px;padding:4px 8px;')}>
                <input type="number" min="1" max="180" value={v.pomoFocus} onChange={v.setFocusMinutes} className="num" style={css('width:42px;background:transparent;border:none;color:var(--app-text);font-size:14px;font-weight:700;text-align:center;outline:none;')} />
                <span style={css('font-size:12px;color:var(--app-faint);')}>دقيقة</span>
              </div>
            </div>

            <div style={css('position:relative;width:332px;height:332px;margin:30px 0 8px;')}>
              <svg width="332" height="332" viewBox="0 0 332 332" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="166" cy="166" r="150" fill="none" stroke="var(--app-surface-2)" strokeWidth="13"></circle>
                <circle cx="166" cy="166" r="150" fill="none" stroke="var(--app-accent)" strokeWidth="13" strokeLinecap="round" strokeDasharray={v.focusDash}></circle>
              </svg>
              <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;')}>
                <div style={css('font-size:13px;color:var(--app-faint);letter-spacing:2px;margin-bottom:6px;')}>{v.focusModeLabel}</div>
                <div className="num" style={css('font-size:72px;font-weight:700;line-height:0.95;letter-spacing:1px;')}>{v.focusTime}</div>
                <div style={css('font-size:13.5px;color:var(--app-muted);margin-top:10px;')}>الجلسة <span className="num">{v.sessionNum}</span> · تُسجَّل تلقائيًا</div>
              </div>
            </div>

            <div style={css('display:flex;align-items:center;gap:18px;margin:14px 0 8px;')}>
              <button onClick={v.resetTimer} style={css('width:52px;height:52px;border-radius:50%;background:var(--app-surface);border:1px solid var(--app-border);color:var(--app-text);cursor:pointer;display:flex;align-items:center;justify-content:center;')}><svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="1.8" {...I}><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v4h4"></path></svg></button>
              <button onClick={v.toggleTimer} style={css('width:78px;height:78px;border-radius:50%;background:var(--app-accent);border:none;color:var(--app-accent-on);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px var(--focus-glow);')}>
                {v.running && <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"></rect><rect x="13.5" y="5" width="4" height="14" rx="1.2"></rect></svg>}
                {v.paused && <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13l11-6.5z"></path></svg>}
              </button>
              <button onClick={v.skipTimer} style={css('width:52px;height:52px;border-radius:50%;background:var(--app-surface);border:1px solid var(--app-border);color:var(--app-text);cursor:pointer;display:flex;align-items:center;justify-content:center;')}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg></button>
            </div>

            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:18px;width:100%;max-width:680px;margin-top:22px;')}>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:20px;')}>
                <div style={css('font-size:12px;color:var(--app-faint);margin-bottom:12px;')}>علامَ تركّز الآن؟</div>
                <div style={css('position:relative;background:var(--app-surface-2);border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:9px;')}>
                  <span style={css('width:9px;height:9px;border-radius:50%;background:var(--app-accent);flex-shrink:0;')}></span>
                  <select value={v.focusGoalId || ''} onChange={v.setFocusGoal} style={css('appearance:none;background:transparent;border:none;color:var(--app-text);font-size:14px;font-weight:600;width:100%;cursor:pointer;outline:none;')}>
                    {v.activeGoalOptions.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6"></path></svg>
                </div>
                <div style={css('margin-top:12px;font-size:14px;color:var(--app-muted);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;')}>{v.focusNextTask}</div>
              </div>

              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:20px;')}>
                <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;')}>
                  <span style={css('font-size:12px;color:var(--app-faint);')}>الصوت المحيط</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>
                </div>
                <div style={css('display:flex;gap:6px;margin-bottom:16px;')}>
                  <span onClick={v.setNoiseWhite} style={css(v.noiseWhiteStyle)}>أبيض</span>
                  <span onClick={v.setNoisePink} style={css(v.noisePinkStyle)}>وردي</span>
                  <span onClick={v.setNoiseBrown} style={css(v.noiseBrownStyle)}>بني</span>
                </div>
                <div style={css('display:flex;align-items:center;gap:12px;')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-faint)" strokeWidth="1.8" strokeLinecap="round"><path d="M11 5 6 9H3v6h3l5 4z"></path></svg>
                  <input type="range" min="0" max="100" value={v.volume} onChange={v.setVolume} style={css('flex:1;cursor:pointer;')} />
                  <span className="num" style={css('font-size:13px;color:var(--app-muted);width:38px;')}>{v.volumeLabel}</span>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* SCREEN: LOG */}
          {v.isLog && (
          <section style={css('padding:34px;display:grid;grid-template-columns:0.85fr 1.15fr;gap:24px;align-items:start;')}>
            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;')}>
              <div style={css('font-size:18px;font-weight:700;margin-bottom:6px;')}>تسجيل جلسة</div>
              <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:22px;')}>سجّل ما أنجزته اليوم لتبقى على المسار.</div>

              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>التاريخ</label>
              <input type="date" value={v.logDate} onChange={v.setLogDate} style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:18px;font-size:14px;color:var(--app-text);color-scheme:dark;')} />

              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>إجمالي الساعات</label>
              <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:18px;')}>
                <button onClick={v.decHours} style={css('width:42px;height:42px;border-radius:11px;background:var(--app-surface-2);border:1px solid var(--app-border);color:var(--app-text);font-size:20px;cursor:pointer;')}>−</button>
                <div style={css('flex:1;text-align:center;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:11px;')}><span className="num" style={css('font-size:18px;font-weight:700;')}>{v.logHours}</span></div>
                <button onClick={v.incHours} style={css('width:42px;height:42px;border-radius:11px;background:var(--app-surface-2);border:1px solid var(--app-border);color:var(--app-text);font-size:20px;cursor:pointer;')}>+</button>
              </div>

              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>التقسيم: تعلّم · بناء</label>
              <div style={css('display:flex;height:36px;border-radius:11px;overflow:hidden;margin-bottom:10px;border:1px solid var(--app-border);')}>
                <div style={css(v.learnSegStyle)}><span className="num">{v.logLearnH}</span>{' '}تعلّم</div>
                <div style={css(v.buildSegStyle)}><span className="num">{v.logBuildH}</span>{' '}بناء</div>
              </div>
              <input type="range" min="0" max="100" value={v.logLearnPct} onChange={v.setLearnPct} style={css('width:100%;margin-bottom:18px;cursor:pointer;')} />

              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>الهدف</label>
              <div style={css('position:relative;margin-bottom:18px;')}>
                <select value={v.logGoalId} onChange={v.setLogGoal} style={css('width:100%;appearance:none;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);cursor:pointer;outline:none;')}>
                  {v.allGoalOptions.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><path d="M6 9l6 6 6-6"></path></svg>
              </div>

              <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>ملاحظة · فوز · عائق</label>
              <textarea value={v.logNote} onChange={v.setLogNote} placeholder="ما الذي فهمته؟ ما الذي عطّلك؟" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;min-height:72px;font-size:14px;color:var(--app-text);resize:vertical;margin-bottom:20px;outline:none;')}></textarea>

              <button onClick={v.saveSession} style={css('width:100%;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:14px;font:700 15px var(--font-brand);cursor:pointer;')}>حفظ الجلسة</button>
            </div>

            <div>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;')}>
                <div style={css('font-size:18px;font-weight:700;')}>السجل الزمني</div>
                <span style={css('font-size:13px;color:var(--app-faint);')}><span className="num">{v.sessionCount}</span> جلسة · <span className="num">{v.totalHours}</span> ساعة</span>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:10px;')}>
                {v.history.map((h) => (
                  <div key={h.id} style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:16px;')}>
                    <div style={css('text-align:center;flex-shrink:0;width:48px;')}><div className="num" style={css('font-size:20px;font-weight:700;line-height:1;')}>{h.day}</div><div style={css('font-size:11px;color:var(--app-faint);')}>{h.month}</div></div>
                    <div style={css('width:1px;height:42px;background:var(--app-border);')}></div>
                    <div style={css('flex:1;min-width:0;')}>
                      <div style={css('display:flex;align-items:center;gap:9px;')}><span style={css('font-size:14.5px;font-weight:600;')}>{h.goalTitle}</span>{h.isPomodoro && <span style={css('font-size:11px;background:var(--app-accent-soft);color:var(--app-accent);padding:2px 7px;border-radius:6px;font-weight:700;')}>بومودورو</span>}</div>
                      {h.hasNote && <div style={css('font-size:13px;color:var(--app-muted);margin-top:4px;')}>{h.note}</div>}
                    </div>
                    <div style={css('text-align:left;flex-shrink:0;')}><div className="num" style={css('font-size:16px;font-weight:700;')}>{h.hoursLabel}</div><div style={css('font-size:11px;color:var(--app-faint);')}><span className="num">{h.learn}</span> تعلّم · <span className="num">{h.build}</span> بناء</div></div>
                    <button onClick={h.del} style={css('width:34px;height:34px;border-radius:9px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;')}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16"></path><path d="M9 7V5h6v2"></path><path d="M6 7l1 13h10l1-13"></path></svg></button>
                  </div>
                ))}
                {v.historyEmpty && (
                  <div style={css('background:var(--app-surface);border:1px dashed var(--app-border);border-radius:14px;padding:36px 18px;text-align:center;')}>
                    <div style={css('font-size:15px;font-weight:600;margin-bottom:6px;')}>لا جلسات بعد</div>
                    <div style={css('font-size:13px;color:var(--app-muted);')}>سجّل أول جلسة من النموذج، أو ابدأ جلسة تركيز وستُسجَّل تلقائيًا.</div>
                  </div>
                )}
              </div>
            </div>
          </section>
          )}

          {/* SCREEN: CURRICULUM */}
          {v.isCurr && (
          <section style={css('padding:34px;')}>
            <div style={css('margin-bottom:24px;')}>
              <div style={css('font-size:26px;font-weight:700;')}>المنهج · {v.monthsLabel}</div>
              <div style={css('color:var(--app-muted);font-size:14px;margin-top:5px;')}>{v.projSubtitle} — <span className="num">{v.totalGoal}</span> ساعة على <span className="num">{v.weeksTotal}</span> أسبوعًا.</div>
            </div>

            <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:start;')}>
              {v.months.map((m, mi) => (
                <div key={mi} style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:22px;')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;')}>
                    <div style={css(m.labelStyle)}>{m.label}</div>
                    <div style={css('display:flex;align-items:center;gap:8px;')}>
                      <span className="num" style={css('font-size:13px;color:var(--app-faint);')}>{m.doneCount} / {m.total}</span>
                      <button onClick={m.remove} style={css('width:26px;height:26px;border-radius:7px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:11px;line-height:1;')}>✕</button>
                    </div>
                  </div>
                  <input value={m.title} onChange={m.setTitle} placeholder="عنوان المرحلة" className="ed-line" style={css('width:100%;background:transparent;border:none;border-bottom:1px solid transparent;font-size:18px;font-weight:700;color:var(--app-text);outline:none;margin-bottom:14px;padding:2px 0;font-family:var(--font-brand);')} />
                  <div style={css('height:6px;border-radius:4px;background:var(--app-surface-2);margin-bottom:20px;overflow:hidden;')}><div style={css(m.barStyle)}></div></div>
                  <div style={css('display:flex;flex-direction:column;gap:13px;')}>
                    {m.weeks.map((w) => (
                      <div key={w.id} style={css('display:flex;gap:11px;align-items:flex-start;')}>
                        <span onClick={w.toggle} style={css(w.boxStyle)}>{w.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06231a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"></path></svg>}</span>
                        <div style={css('flex:1;min-width:0;')}>
                          <input value={w.topic} onChange={w.setTopic} placeholder="الموضوع" style={css(w.topicStyle)} />
                          <div style={css('display:flex;align-items:center;gap:5px;margin-top:2px;')}><span style={css('font-size:12px;color:var(--app-faint);flex-shrink:0;')}>تبني:</span><input value={w.build} onChange={w.setBuild} placeholder="المخرَج" style={css('flex:1;min-width:0;background:transparent;border:none;font-size:12px;color:var(--app-faint);outline:none;font-family:var(--font-brand);padding:0;')} /></div>
                        </div>
                        <button onClick={w.remove} style={css('width:26px;height:26px;flex-shrink:0;border-radius:7px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:11px;')}>✕</button>
                      </div>
                    ))}
                    {m.empty && <div style={css('font-size:12.5px;color:var(--app-faint);padding:2px 0;')}>لا أسابيع — أضف أوّلها بالأسفل.</div>}
                  </div>
                  <button onClick={m.addWeek} style={css('width:100%;display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;border:1.5px dashed var(--app-border);border-radius:10px;padding:9px;color:var(--app-muted);font:600 12.5px var(--font-brand);cursor:pointer;margin-top:14px;')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                    أضف أسبوعًا
                  </button>
                </div>
              ))}
              <button onClick={v.addMonth} style={css('background:transparent;border:1.5px dashed var(--app-border);border-radius:18px;padding:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;color:var(--app-faint);min-height:170px;font-family:var(--font-brand);')}>
                <span style={css('width:46px;height:46px;border-radius:13px;background:var(--app-surface-2);display:flex;align-items:center;justify-content:center;')}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></span>
                <span style={css('font-size:15px;font-weight:600;color:var(--app-text);')}>أضف مرحلة</span>
                <span style={css('font-size:12.5px;')}>شهر أو محور جديد في خطتك</span>
              </button>
            </div>
          </section>
          )}

          {/* SCREEN: STATS */}
          {v.isStats && (
          <section style={css('padding:34px;display:flex;flex-direction:column;gap:22px;')}>
            <div style={css('font-size:26px;font-weight:700;')}>الإحصائيات</div>

            <div style={css('display:grid;grid-template-columns:repeat(4,1fr);gap:18px;')}>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:22px;')}><div style={css('font-size:13px;color:var(--app-faint);')}>إجمالي الساعات</div><div style={css('display:flex;align-items:baseline;gap:6px;margin-top:8px;')}><span className="num" style={css('font-size:34px;font-weight:700;')}>{v.totalHours}</span><span style={css('color:var(--app-faint);font-size:14px;')}>/ <span className="num">{v.totalGoal}</span></span></div></div>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:22px;')}><div style={css('font-size:13px;color:var(--app-faint);')}>نسبة الإنجاز</div><div className="num" style={css('font-size:34px;font-weight:700;margin-top:8px;color:var(--app-accent);')}>{v.totalPctLabel}</div></div>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:22px;')}><div style={css('font-size:13px;color:var(--app-faint);')}>السلسلة الحالية</div><div style={css('display:flex;align-items:baseline;gap:6px;margin-top:8px;')}><span className="num" style={css('font-size:34px;font-weight:700;')}>{v.streak}</span><span style={css('color:var(--app-faint);font-size:14px;')}>{v.streakUnit}</span></div></div>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:16px;padding:22px;')}><div style={css('font-size:13px;color:var(--app-faint);')}>إجمالي الجلسات</div><div className="num" style={css('font-size:34px;font-weight:700;margin-top:8px;')}>{v.sessionCount}</div></div>
            </div>

            <div style={css('display:grid;grid-template-columns:1.4fr 1fr;gap:22px;')}>
              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:24px;')}>
                <div style={css('font-size:16px;font-weight:700;margin-bottom:22px;')}>الساعات على مدى ٨ أسابيع</div>
                <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:12px;height:150px;')}>
                  {v.weekBars.map((b, i) => (
                    <div key={i} style={css('display:flex;flex-direction:column;align-items:center;gap:9px;flex:1;')}><div style={css(b.barStyle)}></div><span className="num" style={css(b.labelStyle)}>{b.label}</span></div>
                  ))}
                </div>
              </div>

              <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:24px;')}>
                <div style={css('font-size:16px;font-weight:700;margin-bottom:22px;')}>تعلّم مقابل بناء</div>
                <div style={css('display:flex;align-items:center;gap:22px;')}>
                  <div style={css('position:relative;width:120px;height:120px;flex-shrink:0;')}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}><circle cx="60" cy="60" r="50" fill="none" stroke="var(--app-accent)" strokeWidth="16"></circle><circle cx="60" cy="60" r="50" fill="none" stroke="var(--st-info)" strokeWidth="16" strokeDasharray={v.lbDash}></circle></svg>
                    <div className="num" style={css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;')}>{v.totalHours}س</div>
                  </div>
                  <div style={css('display:flex;flex-direction:column;gap:14px;')}>
                    <div><div style={css('display:flex;align-items:center;gap:8px;')}><span style={css('width:11px;height:11px;border-radius:3px;background:var(--st-info);')}></span><span style={css('font-size:14px;')}>تعلّم</span></div><div className="num" style={css('font-size:18px;font-weight:700;margin-top:4px;margin-right:19px;')}>{v.learnHours} ساعة · {v.learnPctLabel}</div></div>
                    <div><div style={css('display:flex;align-items:center;gap:8px;')}><span style={css('width:11px;height:11px;border-radius:3px;background:var(--app-accent);')}></span><span style={css('font-size:14px;')}>بناء</span></div><div className="num" style={css('font-size:18px;font-weight:700;margin-top:4px;margin-right:19px;')}>{v.buildHours} ساعة · {v.buildPctLabel}</div></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={css('background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:24px;')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;')}><div style={css('font-size:16px;font-weight:700;')}>خريطة النشاط · آخر ٨ أسابيع</div><div style={css('display:flex;align-items:center;gap:8px;font-size:12px;color:var(--app-faint);')}>أقل<span style={css('width:11px;height:11px;border-radius:3px;background:var(--app-surface-2);')}></span><span style={css('width:11px;height:11px;border-radius:3px;background:rgba(0,217,126,0.35);')}></span><span style={css('width:11px;height:11px;border-radius:3px;background:rgba(0,217,126,0.65);')}></span><span style={css('width:11px;height:11px;border-radius:3px;background:var(--app-accent);')}></span>أكثر</div></div>
              <div style={css('display:grid;grid-template-columns:repeat(14,1fr);gap:7px;')}>
                {v.heat.map((cell, i) => (<div key={i} style={css(cell.s)}></div>))}
              </div>
              <div style={css('font-size:12px;color:var(--app-faint);margin-top:14px;')}>المربعات الفارغة أيام راحة — لا بأس، الاستمرارية أهم من الكمال.</div>
            </div>
          </section>
          )}

          {/* SCREEN: NOTES */}
          {v.isNotes && (
          <section style={css('padding:26px 34px 34px;display:flex;flex-direction:column;gap:16px;min-height:calc(100vh - 73px);')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;gap:16px;')}>
              <div>
                <div style={css('font-size:26px;font-weight:700;')}>ملاحظات المسار</div>
                <div style={css('color:var(--app-muted);font-size:14px;margin-top:5px;')}>دوّن أفكارك ومواردك وما تعلّمته أثناء العمل — تُحفظ تلقائيًا مع هذا المسار.</div>
              </div>
              <button onClick={v.addNote} style={css('flex-shrink:0;display:flex;align-items:center;gap:8px;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:13px 20px;font:700 14px var(--font-brand);cursor:pointer;')}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                ملاحظة جديدة
              </button>
            </div>

            {v.hasNotes && (
            <div style={css('flex:1;min-height:560px;display:flex;gap:20px;')}>
              <div style={css('width:252px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;min-height:0;')}>
                <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px;')}>
                  <span style={css('font-size:12.5px;color:var(--app-faint);')}>الكل · <span className="num">{v.notesCount}</span></span>
                  <div style={css('display:flex;gap:2px;background:var(--app-surface-2);border-radius:9px;padding:3px;')}>
                    {v.noteSortOptions.map(o => <button key={o.key} onClick={o.select} style={css(o.style)}>{o.label}</button>)}
                  </div>
                </div>
                <div style={css('flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:9px;padding-left:4px;')}>
                  {v.notesItems.map(n => (
                    <button key={n.id} onClick={n.select} style={css(n.cardStyle)}>
                      <div style={css(n.titleStyle)}>{n.title}</div>
                      <div style={css('font-size:12.5px;color:var(--app-muted);line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;')}>{n.snippet}</div>
                      <div style={css('display:flex;align-items:center;gap:10px;margin-top:2px;')}>
                        <span className="num" style={css('font-size:11px;color:var(--app-faint);')}>{n.date}</span>
                        {n.hasTodos && <span style={css('display:flex;align-items:center;gap:4px;font-size:11px;color:var(--app-faint);')}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"></path></svg><span className="num">{n.todoLabel}</span></span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {v.activeNote && (
              <div style={css('flex:1;min-width:0;display:flex;flex-direction:column;gap:16px;min-height:0;')}>
                <div style={css('flex:1;min-height:0;background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;')}>
                  <input value={v.noteTitle} onChange={v.setNoteTitle} placeholder="عنوان الملاحظة" style={css('background:transparent;border:none;outline:none;padding:22px 26px 10px;font:700 23px var(--font-brand);color:var(--app-text);')} />
                  <NoteEditor key={v.noteId} value={v.noteBody} onChange={v.onNoteChange} />
                  <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 22px;border-top:1px solid var(--app-border);')}>
                    <div style={css('font-size:12px;color:var(--app-faint);display:flex;align-items:center;gap:7px;')}><span style={css('width:7px;height:7px;border-radius:50%;background:var(--app-accent);')}></span>{v.noteSavedLabel}</div>
                    <button onClick={v.deleteActiveNote} style={css('display:flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);border-radius:9px;padding:8px 14px;font:600 12.5px var(--font-brand);cursor:pointer;')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16"></path><path d="M9 7V5h6v2"></path><path d="M7 7l1 13h8l1-13"></path></svg>حذف</button>
                  </div>
                </div>

                <div style={css('flex-shrink:0;max-height:320px;background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px 12px;')}>
                    <div style={css('display:flex;align-items:center;gap:10px;')}>
                      <span style={css('font-size:15px;font-weight:700;')}>قائمة المهام</span>
                      {v.hasTodos && <span className="num" style={css('font-size:12px;color:var(--app-faint);background:var(--app-surface-2);padding:3px 9px;border-radius:20px;')}>{v.todoDone}/{v.todoCount}</span>}
                    </div>
                    <button onClick={v.addTodo} style={css('display:flex;align-items:center;gap:6px;background:var(--app-accent-soft);border:none;color:var(--app-accent);font:700 12.5px var(--font-brand);cursor:pointer;padding:8px 13px;border-radius:9px;')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>إضافة مهمة</button>
                  </div>
                  {v.hasTodos && (
                  <div style={css('flex:1;overflow:auto;min-height:0;padding:0 12px 12px;display:flex;flex-direction:column;gap:2px;')}>
                    {v.noteTodos.map(t => (
                      <div key={t.id} style={css('display:flex;align-items:center;gap:12px;padding:8px;border-radius:10px;')}>
                        <div onClick={t.toggle} style={css(t.boxStyle)}>{t.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent-on)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"></path></svg>}</div>
                        <input value={t.text} onChange={t.setText} placeholder="اكتب المهمة…" style={css(t.textStyle)} />
                        <button onClick={t.remove} style={css('width:28px;height:28px;flex-shrink:0;border:none;background:transparent;color:var(--app-faint);border-radius:7px;cursor:pointer;font-size:13px;')}>✕</button>
                      </div>
                    ))}
                  </div>
                  )}
                  {v.noTodos && <div style={css('padding:4px 20px 18px;font-size:13px;color:var(--app-faint);')}>لا مهام بعد — أضف أوّل مهمة لتتبّع خطواتك.</div>}
                </div>
              </div>
              )}
              {v.noActiveNote && (
              <div style={css('flex:1;min-width:0;background:var(--app-surface);border:1px dashed var(--app-border);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--app-faint);')}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h11l3 3v13H5z"></path><path d="M9 9h6"></path><path d="M9 13h6"></path></svg>
                <div style={css('font-size:14px;')}>اختر ملاحظة من القائمة لتحريرها.</div>
              </div>
              )}
            </div>
            )}

            {v.noNotes && (
            <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;border:1px dashed var(--app-border);border-radius:18px;color:var(--app-faint);')}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h11l3 3v13H5z"></path><path d="M9 9h6"></path><path d="M9 13h6"></path><path d="M9 17h3"></path></svg>
              <div style={css('font-size:15px;')}>لا ملاحظات بعد لهذا المسار.</div>
              <button onClick={v.addNote} style={css('display:flex;align-items:center;gap:8px;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:12px 22px;font:700 14px var(--font-brand);cursor:pointer;')}>أنشئ أول ملاحظة</button>
            </div>
            )}
          </section>
          )}

        </main>
        </>
        )}

        {/* NEW PROJECT MODAL */}
        {v.showProjectModal && (
        <div style={css('position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:55;padding:24px;')} onClick={v.closeNewProject}>
          <div onClick={v.stop} style={css('width:100%;max-width:440px;background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;')}>
              <div style={css('font-size:19px;font-weight:700;')}>مشروع جديد</div>
              <button onClick={v.closeNewProject} style={css('width:34px;height:34px;border-radius:9px;background:var(--app-surface-2);border:1px solid var(--app-border);color:var(--app-muted);cursor:pointer;font-size:16px;')}>✕</button>
            </div>
            <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:22px;')}>مسار تعلّم جديد بأهدافه ومنهجه وجلساته الخاصة — كل شيء تضيفه بنفسك.</div>

            <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>اسم المشروع</label>
            <input value={v.npName} onChange={v.setNpName} placeholder="مثال: مسار الذكاء الاصطناعي" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />

            <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>وصف مختصر</label>
            <input value={v.npSubtitle} onChange={v.setNpSubtitle} placeholder="مثال: من Python إلى نماذج الإنتاج" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />

            <div style={css('display:flex;gap:14px;margin-bottom:22px;')}>
              <div style={css('flex:1;')}>
                <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>هدف الساعات</label>
                <input type="number" min="1" value={v.npHourGoal} onChange={v.setNpHourGoal} className="num" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
              </div>
              <div style={css('flex:1;')}>
                <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>ساعات اليوم</label>
                <input type="number" min="0.5" step="0.5" value={v.npDailyTarget} onChange={v.setNpDailyTarget} className="num" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
              </div>
            </div>

            <div style={css('display:flex;gap:12px;')}>
              <button onClick={v.closeNewProject} style={css('flex:1;background:var(--app-surface-2);color:var(--app-text);border:1px solid var(--app-border);border-radius:12px;padding:13px;font:600 14px var(--font-brand);cursor:pointer;')}>إلغاء</button>
              <button onClick={v.saveProject} style={css('flex:2;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:13px;font:700 14px var(--font-brand);cursor:pointer;')}>إنشاء المشروع</button>
            </div>
          </div>
        </div>
        )}

        {/* NEW GOAL MODAL */}
        {v.showGoalModal && (
        <div style={css('position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50;padding:24px;')} onClick={v.closeNewGoal}>
          <div onClick={v.stop} style={css('width:100%;max-width:460px;background:var(--app-surface);border:1px solid var(--app-border);border-radius:18px;padding:26px;max-height:88vh;overflow:auto;')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;')}>
              <div style={css('font-size:19px;font-weight:700;')}>هدف جديد</div>
              <button onClick={v.closeNewGoal} style={css('width:34px;height:34px;border-radius:9px;background:var(--app-surface-2);border:1px solid var(--app-border);color:var(--app-muted);cursor:pointer;font-size:16px;')}>✕</button>
            </div>

            <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>عنوان الهدف</label>
            <input value={v.ngTitle} onChange={v.setNgTitle} placeholder="مثال: إتقان WebSockets" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />

            <div style={css('display:flex;gap:14px;margin-bottom:16px;')}>
              <div style={css('flex:1;')}>
                <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>الموعد النهائي</label>
                <input type="date" value={v.ngDeadline} onChange={v.setNgDeadline} style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);color-scheme:dark;outline:none;')} />
              </div>
              <div style={css('width:130px;')}>
                <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>ميزانية الساعات</label>
                <input type="number" min="1" value={v.ngBudget} onChange={v.setNgBudget} style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
              </div>
            </div>

            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;')}>
              <label style={css('font-size:13px;color:var(--app-muted);')}>المهام الفرعية وساعاتها</label>
              <span style={css('font-size:12px;color:var(--app-faint);')}>مجموع المهام: <b className="num" style={css('color:var(--app-accent);')}>{v.ngTasksTotal}</b> ساعة</span>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:8px;margin-bottom:10px;')}>
              {v.ngTaskRows.map((row) => (
                <div key={row.id} style={css('display:flex;gap:8px;align-items:center;')}>
                  <input value={row.label} onChange={row.setLabel} placeholder="وصف المهمة" style={css('flex:1;min-width:0;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:10px;padding:10px 12px;font-size:13.5px;color:var(--app-text);outline:none;')} />
                  <input type="number" min="0" step="0.5" value={row.hours} onChange={row.setHours} className="num" style={css('width:58px;flex-shrink:0;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:10px;padding:10px 8px;font-size:13.5px;color:var(--app-text);text-align:center;outline:none;')} />
                  <span style={css('font-size:12px;color:var(--app-faint);flex-shrink:0;')}>سا</span>
                  <button onClick={row.remove} style={css('width:34px;height:34px;flex-shrink:0;border-radius:9px;background:transparent;border:1px solid var(--app-border);color:var(--app-faint);cursor:pointer;font-size:14px;')}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={v.addNgTask} style={css('width:100%;display:flex;align-items:center;justify-content:center;gap:7px;background:transparent;border:1.5px dashed var(--app-border);border-radius:10px;padding:10px;color:var(--app-muted);font:600 13px var(--font-brand);cursor:pointer;margin-bottom:22px;')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
              أضف مهمة
            </button>

            <div style={css('display:flex;gap:12px;')}>
              <button onClick={v.closeNewGoal} style={css('flex:1;background:var(--app-surface-2);color:var(--app-text);border:1px solid var(--app-border);border-radius:12px;padding:13px;font:600 14px var(--font-brand);cursor:pointer;')}>إلغاء</button>
              <button onClick={v.saveGoal} style={css('flex:2;background:var(--app-accent);color:var(--app-accent-on);border:none;border-radius:12px;padding:13px;font:700 14px var(--font-brand);cursor:pointer;')}>إنشاء الهدف</button>
            </div>
          </div>
        </div>
        )}
      </div>
    )
  }
}
