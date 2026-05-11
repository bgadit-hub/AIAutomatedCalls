// ============================================================
// src/BookingPage.jsx
// Public booking page — patients visit /book?client_id=XXX
// to book appointments with a client's AI receptionist.
//
// Flow: Date picker → Time slots → Patient form → Confirmation
// API:  GET /api/check-availability  POST /api/book-appointment
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import logoFull from '../assets/logos/logo-main.png';

// ─── Styles ──────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  :root {
    --accent:#1FA8A0; --accent-dim:rgba(31,168,160,0.10);
    --success:#059669; --success-dim:rgba(5,150,105,0.08);
    --danger:#DC2626;
    --t1:#111827; --t2:#6B7280; --t3:#9CA3AF;
    --border:rgba(0,0,0,0.08); --border2:rgba(0,0,0,0.14);
    --bg:#F8FAFB; --card:#FFFFFF;
    --font:'Outfit',sans-serif;
    --r:12px;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:var(--font);background:var(--bg);color:var(--t1);}
  .bk-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 22px;
    border-radius:8px;font-family:var(--font);font-size:14px;font-weight:600;
    cursor:pointer;border:none;transition:all .14s;}
  .bk-primary{background:var(--accent);color:#fff;} .bk-primary:hover{filter:brightness(1.07);}
  .bk-ghost{background:transparent;color:var(--t2);border:1px solid var(--border2);}
  .bk-ghost:hover{background:rgba(0,0,0,0.04);}
  .bk-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);
    padding:24px;box-shadow:0 1px 6px rgba(0,0,0,0.06);}
  .bk-input{width:100%;padding:11px 14px;border:1px solid var(--border2);border-radius:8px;
    font-family:var(--font);font-size:14px;color:var(--t1);outline:none;background:#fff;}
  .bk-input:focus{border-color:var(--accent);}
  @keyframes bkFade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .bk-fade{animation:bkFade .22s ease both;}
  @media(max-width:600px){
    .bk-grid-2{grid-template-columns:1fr!important;}
  }
`;

// ─── Helpers ─────────────────────────────────────────────────
const TODAY = new Date();
TODAY.setHours(0,0,0,0);

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function formatDateLabel(d) {
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

function formatTimeFull(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour:'numeric', minute:'2-digit', hour12:true, timeZone:'UTC',
  });
}

function formatDateFull(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric', timeZone:'UTC',
  });
}

function cleanPhone(raw) {
  const d = raw.replace(/\D/g,'');
  const n = d.length===11&&d.startsWith('1') ? d.slice(1) : d;
  return n.length===10 ? n : null;
}

// ─── Main Component ──────────────────────────────────────────
export default function BookingPage() {
  const params   = new URLSearchParams(window.location.search);
  const clientId = params.get('client_id');

  // Step: 'date' | 'time' | 'form' | 'success' | 'error'
  const [step,         setStep]         = useState('date');
  const [businessName, setBusinessName] = useState('Your provider');
  const [apptTypes,    setApptTypes]    = useState(['Appointment','Consultation','Follow-up']);

  // Date selection
  const [selectedDate, setSelectedDate] = useState(null);

  // Time slots
  const [slots,        setSlots]        = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Patient form
  const [form,         setForm]         = useState({ name:'', phone:'', email:'', appt_type:'' });
  const [submitting,   setSubmitting]   = useState(false);
  const [formErr,      setFormErr]      = useState('');

  // Confirmation
  const [confirmation, setConfirmation] = useState(null);
  const [fatalErr,     setFatalErr]     = useState('');

  // Inject CSS
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Load client info
  useEffect(() => {
    if (!clientId) { setFatalErr('Missing client_id in URL.'); return; }
    // Fetch client name from booking_settings or clients table via availability check
    // For now we load it from the first availability check response
  }, [clientId]);

  // Build next 14 days (skip Sundays and past days)
  const days = [];
  for (let i = 0; i < 21 && days.length < 14; i++) {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + i + 1); // start tomorrow
    days.push(d);
  }

  // Fetch slots when date selected
  const fetchSlots = useCallback(async (date) => {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res  = await fetch(`/api/check-availability?client_id=${clientId}&date=${isoDate(date)}`);
      const data = await res.json();
      if (data.available) {
        setSlots(data.slots || []);
        if (data.appointment_types?.length) setApptTypes(data.appointment_types);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [clientId]);

  const handleDateSelect = (d) => {
    setSelectedDate(d);
    setStep('time');
    fetchSlots(d);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleSubmit = async () => {
    setFormErr('');
    if (!form.name.trim())  { setFormErr('Please enter your name.'); return; }
    if (!form.phone.trim()) { setFormErr('Please enter your phone number.'); return; }
    if (!cleanPhone(form.phone)) { setFormErr('Please enter a valid 10-digit US phone number.'); return; }

    setSubmitting(true);
    try {
      const res  = await fetch('/api/book-appointment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          client_id:        clientId,
          patient_name:     form.name.trim(),
          phone:            form.phone.trim(),
          patient_email:    form.email.trim() || null,
          appointment_type: form.appt_type || apptTypes[0] || 'Appointment',
          scheduled_at:     selectedSlot.datetime,
          duration_minutes: selectedSlot.duration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmation(data);
        setStep('success');
      } else {
        setFormErr(data.error || 'Booking failed. Please try another time.');
      }
    } catch {
      setFormErr('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  if (fatalErr) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'var(--bg)',fontFamily:'var(--font)'}}>
      <div style={{textAlign:'center',maxWidth:360}}>
        <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8,color:'var(--t1)'}}>Invalid booking link</div>
        <div style={{fontSize:14,color:'var(--t2)'}}>{fatalErr}</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'var(--font)',paddingBottom:60}}>

      {/* Nav */}
      <div style={{background:'#fff',borderBottom:'1px solid var(--border)',padding:'0 5%',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <img src={logoFull} alt="AI Automated Calls" style={{height:30,objectFit:'contain'}}/>
        <span style={{fontSize:13,color:'var(--t3)'}}>Secure booking</span>
      </div>

      <div style={{maxWidth:600,margin:'0 auto',padding:'32px 20px'}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--accent)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:8}}>Online Booking</div>
          <h1 style={{fontSize:'clamp(22px,4vw,30px)',fontWeight:800,letterSpacing:'-.02em',color:'var(--t1)',marginBottom:6}}>
            Book an appointment
          </h1>
          <p style={{fontSize:14,color:'var(--t2)'}}>Choose a date and time that works for you.</p>
        </div>

        {/* Progress */}
        <div style={{display:'flex',gap:0,marginBottom:28,background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {[['date','1. Date'],['time','2. Time'],['form','3. Info']].map(([s,label],i,arr)=>(
            <div key={s} style={{flex:1,padding:'10px 0',textAlign:'center',fontSize:12,fontWeight:600,
              background:step===s?'var(--accent)':['success'].includes(step)||arr.slice(0,i).map(x=>x[0]).every(ps=>['date','time','form'].indexOf(ps)<['date','time','form'].indexOf(step))?'var(--accent-dim)':'transparent',
              color:step===s?'#fff':step==='success'||(['time','form','success'].indexOf(step)>['time','form','success'].indexOf(s))?'var(--accent)':'var(--t3)',
              borderRight:i<arr.length-1?'1px solid var(--border)':'none',transition:'all .2s'}}>
              {label}
            </div>
          ))}
        </div>

        {/* ── STEP: Date ── */}
        {step==='date'&&(
          <div className="bk-card bk-fade">
            <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:'var(--t1)'}}>Select a date</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
              {days.map(d=>(
                <button key={isoDate(d)} onClick={()=>handleDateSelect(d)}
                  style={{padding:'12px 8px',borderRadius:8,border:'1px solid var(--border)',
                    background:selectedDate&&isoDate(selectedDate)===isoDate(d)?'var(--accent)':'var(--card)',
                    color:selectedDate&&isoDate(selectedDate)===isoDate(d)?'#fff':'var(--t1)',
                    fontFamily:'var(--font)',fontSize:13,fontWeight:500,cursor:'pointer',transition:'all .12s',
                    textAlign:'center',lineHeight:1.5}}>
                  {formatDateLabel(d)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: Time ── */}
        {step==='time'&&(
          <div className="bk-card bk-fade">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700}}>{selectedDate&&formatDateLabel(selectedDate)}</div>
              <button className="bk-btn bk-ghost" style={{padding:'6px 12px',fontSize:12}} onClick={()=>setStep('date')}>← Change</button>
            </div>
            {slotsLoading&&(
              <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:14}}>Loading available times…</div>
            )}
            {!slotsLoading&&slots.length===0&&(
              <div style={{textAlign:'center',padding:'32px 0'}}>
                <div style={{fontSize:32,marginBottom:10}}>📅</div>
                <div style={{fontSize:15,fontWeight:600,color:'var(--t1)',marginBottom:6}}>No availability</div>
                <div style={{fontSize:13,color:'var(--t2)',marginBottom:16}}>No open slots for this date. Try another day.</div>
                <button className="bk-btn bk-ghost" onClick={()=>setStep('date')}>Pick a different date</button>
              </div>
            )}
            {!slotsLoading&&slots.length>0&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8}}>
                {slots.map(slot=>(
                  <button key={slot.datetime} onClick={()=>handleSlotSelect(slot)}
                    style={{padding:'12px 8px',borderRadius:8,border:'1px solid var(--border)',
                      background:selectedSlot?.datetime===slot.datetime?'var(--accent)':'var(--card)',
                      color:selectedSlot?.datetime===slot.datetime?'#fff':'var(--t1)',
                      fontFamily:'var(--font)',fontSize:13,fontWeight:500,cursor:'pointer',transition:'all .12s',
                      textAlign:'center'}}>
                    {formatTimeFull(slot.datetime)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Form ── */}
        {step==='form'&&(
          <div className="bk-card bk-fade">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{selectedDate&&formatDateLabel(selectedDate)}</div>
                <div style={{fontSize:13,color:'var(--accent)',fontWeight:600,marginTop:2}}>{selectedSlot&&formatTimeFull(selectedSlot.datetime)}</div>
              </div>
              <button className="bk-btn bk-ghost" style={{padding:'6px 12px',fontSize:12}} onClick={()=>setStep('time')}>← Change time</button>
            </div>

            <div style={{display:'grid',gap:14}}>
              <div className="bk-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5}}>Your name *</label>
                  <input className="bk-input" placeholder="Full name"
                    value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5}}>Phone number *</label>
                  <input className="bk-input" placeholder="(555) 555-5555" type="tel"
                    value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5}}>Email (optional)</label>
                <input className="bk-input" placeholder="you@example.com" type="email"
                  value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              </div>
              {apptTypes.length>1&&(
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5}}>Appointment type</label>
                  <select className="bk-input" value={form.appt_type} onChange={e=>setForm(f=>({...f,appt_type:e.target.value}))}>
                    {apptTypes.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
              {formErr&&<div style={{fontSize:13,color:'var(--danger)',fontWeight:500}}>{formErr}</div>}
              <button className="bk-btn bk-primary" onClick={handleSubmit} disabled={submitting}
                style={{width:'100%',padding:'13px',fontSize:15,opacity:submitting?.75:1}}>
                {submitting?'Booking your appointment…':'Confirm appointment →'}
              </button>
              <div style={{fontSize:12,color:'var(--t3)',textAlign:'center'}}>
                You’ll receive a confirmation after booking.
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step==='success'&&(
          <div className="bk-card bk-fade" style={{textAlign:'center',padding:36,background:'var(--success-dim)',border:'1px solid rgba(5,150,105,0.2)'}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--success)',marginBottom:8}}>You’re booked!</div>
            <div style={{fontSize:15,color:'var(--t1)',marginBottom:20,fontWeight:500}}>
              {selectedDate&&formatDateFull(selectedSlot?.datetime)}{selectedSlot&&` at ${formatTimeFull(selectedSlot.datetime)}`}
            </div>
            <div style={{fontSize:14,color:'var(--t2)',maxWidth:360,margin:'0 auto 24px',lineHeight:1.65}}>
              {confirmation?.confirmation_message || 'Your appointment is confirmed. You’ll receive a reminder before your visit.'}
            </div>
            <div style={{background:'#fff',borderRadius:8,padding:'14px 18px',display:'inline-block',textAlign:'left',marginBottom:24,border:'1px solid rgba(5,150,105,0.15)'}}>
              <div style={{fontSize:12,color:'var(--t3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Booking reference</div>
              <div style={{fontSize:13,fontFamily:'monospace',color:'var(--t1)'}}>{confirmation?.ical_uid?.split('@')[0] || '—'}</div>
            </div>
            <div style={{fontSize:13,color:'var(--t3)'}}>
              Need to reschedule? Call us directly.
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{textAlign:'center',padding:'24px 20px 0',fontSize:12,color:'var(--t3)'}}>
        Powered by <span style={{color:'var(--accent)',fontWeight:600}}>AI Automated Calls</span>
      </div>
    </div>
  );
}
