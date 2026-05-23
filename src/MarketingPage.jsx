import { CheckCircle } from "lucide-react";
import logoFull from "../assets/logos/logo-main.png";

const MarketingPage=({onGetStarted})=>{
  const STEPS=[
    {n:"01",title:"We deploy your AI",desc:"We configure a custom voice agent trained on your business — FAQs, services, hours, tone. Live in 48 hours."},
    {n:"02",title:"It answers every call",desc:"Inbound, outbound, after-hours. Your AI greets callers by name, answers questions, and books appointments directly into your calendar."},
    {n:"03",title:"You grow without hiring",desc:"Get a daily report of every call, booking, and lead. Scale to 500 calls a day without adding a single staff member."},
  ];
  const FEATURES=[
    {icon:"📞",title:"24/7 inbound answering",desc:"Zero missed calls — evenings, weekends, holidays. Every caller gets a professional response in under 2 rings."},
    {icon:"📅",title:"Appointment booking",desc:"The AI books directly into your calendar system — Google Calendar, Dentrix, Jane, or any scheduling tool."},
    {icon:"🔁",title:"Outbound lead follow-up",desc:"New web lead? The AI calls them within 3 minutes, qualifies them, and books the appointment automatically."},
    {icon:"💬",title:"SMS + email sequences",desc:"Automated confirmation texts, reminders, and no-show recovery sequences run in the background nonstop."},
    {icon:"📊",title:"Daily performance reports",desc:"See every call, outcome, and booking. Know exactly what your AI said and what revenue it captured."},
    {icon:"⚡",title:"48-hour setup",desc:"No long onboarding. We get your agent live in 2 days, not 2 months. You're operational before the week is out."},
  ];
  const TIERS=[
    {name:"Starter",setup:"$750",price:"$1,200",color:"var(--t2)",features:["AI inbound answering 24/7","Appointment booking","SMS confirmations","Monthly ROI report","Up to 300 calls/mo"],cta:"Get started"},
    {name:"Standard",setup:"$1,500",price:"$2,000",color:"var(--accent)",features:["Everything in Starter","Outbound lead follow-up","No-show recovery sequences","Call recordings + transcripts","Unlimited calls","GoHighLevel integration"],cta:"Most popular",highlight:true},
    {name:"Premium",setup:"$2,500",price:"$3,000",color:"var(--accent2)",features:["Everything in Standard","Google Ads management","Weekly performance call","AI reactivation of cold leads","Priority same-day support","Custom CRM integration"],cta:"Get started"},
  ];
  const STATS=[
    {n:"94%",l:"Answer rate"},
    {n:"< 2s",l:"Response time"},
    {n:"24/7",l:"Always on"},
    {n:"48hr",l:"Setup time"},
  ];
  const NICHES=[
    {label:"Veterinary clinics",url:"/veterinary",stat:"30–42% missed calls"},
    {label:"Med spa & aesthetics",url:"/med-spa",stat:"High-ticket cash-pay"},
    {label:"Chiropractic",url:"/chiropractic",stat:"$2,500 avg patient LTV"},
    {label:"Physical therapy",url:"/physical-therapy",stat:"Referral-driven intake"},
    {label:"Optometry",url:"/optometry",stat:"Annual recall window"},
    {label:"GLP-1 & weight loss",url:"/weight-loss",stat:"$4,800 avg patient LTV"},
    {label:"IV therapy bars",url:"/iv-therapy",stat:"Peak-hour booking"},
    {label:"Tattoo studios",url:"/tattoo",stat:"Mid-session missed calls"},
    {label:"Acupuncture",url:"/acupuncture",stat:"60-min silence blocks"},
    {label:"Massage therapy",url:"/massage",stat:"90-min sessions"},
    {label:"Hormone / HRT clinics",url:"/hormone-therapy",stat:"$6,000 avg annual LTV"},
    {label:"Dog grooming",url:"/dog-grooming",stat:"Both hands on a dog"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#FFFFFF",fontFamily:"var(--font)",color:"var(--t1)"}}>
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(8px)",borderBottom:"1px solid var(--border)",padding:"0 5%",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <img src={logoFull} alt="AI Automated Calls" style={{height:36,objectFit:"contain"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onGetStarted} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:500,color:"var(--t2)"}}>Sign in</button>
          <button onClick={onGetStarted} className="btn btn-primary" style={{fontSize:14,padding:"9px 20px"}}>Book a demo</button>
        </div>
      </nav>
      <section style={{padding:"88px 5% 72px",textAlign:"center",maxWidth:860,margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(31,168,160,0.08)",border:"1px solid rgba(31,168,160,0.2)",borderRadius:100,padding:"5px 14px",marginBottom:28}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"var(--accent)",display:"inline-block"}}/>
          <span style={{fontSize:12,fontWeight:600,color:"var(--accent)",letterSpacing:".04em"}}>LIVE IN 48 HOURS · NO CONTRACTS</span>
        </div>
        <h1 style={{fontSize:"clamp(36px,5vw,62px)",fontWeight:800,lineHeight:1.1,letterSpacing:"-.03em",marginBottom:22}}>Your business answers<br/>every call. <span style={{color:"var(--accent)"}}>Automatically.</span></h1>
        <p style={{fontSize:"clamp(16px,2vw,20px)",color:"var(--t2)",lineHeight:1.65,maxWidth:620,margin:"0 auto 36px"}}>AI Automated Calls deploys a custom AI voice receptionist for your business. It books appointments, follows up on leads, and handles after-hours calls — without hiring anyone.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={onGetStarted} className="btn btn-primary" style={{fontSize:15,padding:"13px 28px",borderRadius:10}}>Get started →</button>
          <button onClick={onGetStarted} className="btn btn-ghost" style={{fontSize:15,padding:"13px 28px",borderRadius:10}}>See a live demo</button>
        </div>
        <p style={{marginTop:18,fontSize:13,color:"var(--t3)"}}>Setup fee from $750 · No long-term contracts · Cancel anytime</p>
      </section>
      <section style={{background:"var(--bg-base)",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",padding:"32px 5%"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,textAlign:"center"}}>
          {STATS.map(s=>(<div key={s.n}><div style={{fontSize:"clamp(28px,4vw,40px)",fontWeight:800,color:"var(--accent)",letterSpacing:"-.02em"}}>{s.n}</div><div style={{fontSize:13,color:"var(--t2)",marginTop:4,fontWeight:500}}>{s.l}</div></div>))}
        </div>
      </section>
      <section style={{padding:"64px 5%",textAlign:"center"}}>
        <p style={{fontSize:13,fontWeight:600,color:"var(--accent)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>Who we serve</p>
        <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:800,letterSpacing:"-.02em",marginBottom:32}}>Built for your business, not just any business</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10,maxWidth:980,margin:"0 auto 24px",textAlign:"left"}}>
          {NICHES.map(n=>(
            <a key={n.label} href={n.url} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg-base)",border:"1px solid var(--border)",borderRadius:10,padding:"13px 16px",textDecoration:"none",color:"var(--t1)",transition:"border-color .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.background="rgba(31,168,160,0.04)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-base)";}}>
              <div><div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{n.label}</div><div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{n.stat}</div></div>
              <span style={{fontSize:13,color:"var(--accent)",fontWeight:700,flexShrink:0,marginLeft:8}}>→</span>
            </a>
          ))}
        </div>
        <p style={{fontSize:13,color:"var(--t3)"}}>Don't see your industry? <span style={{color:"var(--accent)",cursor:"pointer",textDecoration:"underline"}} onClick={onGetStarted}>Book a demo</span> — we work with any appointment-based business.</p>
      </section>
      <section style={{background:"var(--bg-base)",padding:"72px 5%",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--accent)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>How it works</p>
            <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:800,letterSpacing:"-.02em"}}>From signed to live in 48 hours</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:24}}>
            {STEPS.map(s=>(<div key={s.n} className="card" style={{padding:28}}><div style={{fontSize:13,fontWeight:700,color:"var(--accent)",letterSpacing:".06em",marginBottom:10}}>{s.n}</div><div style={{fontSize:17,fontWeight:700,marginBottom:10}}>{s.title}</div><div style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>{s.desc}</div></div>))}
          </div>
        </div>
      </section>
      <section style={{padding:"72px 5%"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--accent)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>Features</p>
            <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:800,letterSpacing:"-.02em"}}>Everything your front desk does — automated</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
            {FEATURES.map(f=>(<div key={f.title} className="card" style={{padding:24}}><div style={{fontSize:26,marginBottom:12}}>{f.icon}</div><div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{f.title}</div><div style={{fontSize:13,color:"var(--t2)",lineHeight:1.65}}>{f.desc}</div></div>))}
          </div>
        </div>
      </section>
      <section style={{background:"var(--bg-base)",padding:"72px 5%",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)"}}>
        <div style={{maxWidth:980,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <p style={{fontSize:13,fontWeight:600,color:"var(--accent)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>Pricing</p>
            <h2 style={{fontSize:"clamp(24px,3vw,36px)",fontWeight:800,letterSpacing:"-.02em"}}>Simple, flat monthly pricing</h2>
            <p style={{fontSize:15,color:"var(--t2)",marginTop:10}}>One-time setup fee + monthly retainer. No per-minute charges. No surprises.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,alignItems:"start"}}>
            {TIERS.map(t=>(
              <div key={t.name} className="card" style={{padding:28,border:t.highlight?`2px solid var(--accent)`:"1px solid var(--border)",position:"relative",boxShadow:t.highlight?"0 8px 32px rgba(31,168,160,0.12)":"0 1px 4px rgba(0,0,0,0.06)"}}>
                {t.highlight&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"var(--accent)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 14px",borderRadius:100,whiteSpace:"nowrap"}}>MOST POPULAR</div>}
                <div style={{fontSize:13,fontWeight:600,color:t.color,marginBottom:8}}>{t.name}</div>
                <div style={{fontSize:13,color:"var(--t2)",marginBottom:4}}>{t.setup} setup</div>
                <div style={{fontSize:36,fontWeight:800,letterSpacing:"-.03em",color:"var(--t1)",marginBottom:4}}>
                  {t.price}<span style={{fontSize:14,fontWeight:400,color:"var(--t2)"}}>/mo</span>
                </div>
                <div style={{height:1,background:"var(--border)",margin:"20px 0"}}/>
                {t.features.map(f=>(<div key={f} style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:10,fontSize:13}}><CheckCircle size={14} color="var(--success)" style={{flexShrink:0,marginTop:1}}/>{f}</div>))}
                <button onClick={onGetStarted} className="btn btn-primary" style={{width:"100%",justifyContent:"center",marginTop:20,padding:"11px",fontSize:14,background:t.highlight?"var(--accent)":"var(--bg-base)",color:t.highlight?"#fff":"var(--t1)",border:t.highlight?"none":"1px solid var(--border)"}}>
                  {t.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{padding:"80px 5%",textAlign:"center"}}>
        <h2 style={{fontSize:"clamp(26px,4vw,44px)",fontWeight:800,letterSpacing:"-.03em",marginBottom:16}}>Ready to stop missing calls?</h2>
        <p style={{fontSize:16,color:"var(--t2)",maxWidth:480,margin:"0 auto 32px",lineHeight:1.65}}>Book a 20-minute demo and we'll show you exactly how it works for your business.</p>
        <button onClick={onGetStarted} className="btn btn-primary" style={{fontSize:16,padding:"14px 32px",borderRadius:10}}>Book your free demo →</button>
        <p style={{marginTop:16,fontSize:13,color:"var(--t3)"}}>No commitment required</p>
      </section>
      <footer style={{borderTop:"1px solid var(--border)",padding:"28px 5%",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <img src={logoFull} alt="AI Automated Calls" style={{height:28,objectFit:"contain"}}/>
        <div style={{display:"flex",gap:20,fontSize:13,color:"var(--t2)"}}>
          <span style={{cursor:"pointer"}} onClick={onGetStarted}>Sign in</span>
          <span>aiautomatedcalls.com</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
};
export default MarketingPage;
