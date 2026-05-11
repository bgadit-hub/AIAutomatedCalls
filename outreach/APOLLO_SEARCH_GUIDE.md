# Apollo.io Lead Sourcing Guide
# How to find and export 200+ qualified leads per niche per week

---

## OVERVIEW

Apollo.io is your lead database. The free tier gives 200 exports/month.
The $49/month Basic plan gives 10,000 exports/month — upgrade once outreach is working.

**Goal per week:** 200 fresh leads uploaded to Instantly.ai campaign
**Time required:** 15–20 minutes/week (or automate via Apollo API — see bottom)

---

## ACCOUNT SETUP

1. Sign up at apollo.io (free)
2. Install the Apollo Chrome extension (helps verify emails as you browse)
3. Connect your email to Apollo for engagement tracking
4. Navigate to: **Search → People**

---

## SAVED SEARCH TEMPLATES

Save each of these as a named search in Apollo. Run weekly and export new leads.

---

### SEARCH 1: Dental Practices — Decision Makers

**People filters:**
```
Job Titles (include ANY):
- Owner
- Practice Owner  
- Office Manager
- Dentist
- Principal Dentist
- Managing Partner

Seniority: Owner, C-Suite, Director, Manager

Keywords (NOT): Associate, Resident, Intern, Student
```

**Company filters:**
```
Industry: Medical & Health (select "Dentistry" subcategory)
Employee count: 1–20
Location: [YOUR TARGET CITY + 50 mile radius]
Technologies: NOT (Birdeye, Podium, PatientPop) — these already have review/comm tools
Has phone number: YES
Has email: YES
```

**Exclusions:**
```
Company keywords to EXCLUDE: hospital, health system, urgent care, pediatric hospital
Already contacted: YES (Apollo filters these automatically)
```

**Export name:** `Dental_[CITY]_[DATE]`
**Expected results:** 50–200 per city depending on size

---

### SEARCH 2: Real Estate Agents — Individual Agents

**People filters:**
```
Job Titles (include ANY):
- Real Estate Agent
- Realtor
- Real Estate Broker
- Buyer's Agent
- Listing Agent
- Real Estate Sales Agent

Seniority: Individual Contributor, Manager

Keywords: NOT (Property Management, Commercial, Appraisal)
```

**Company filters:**
```
Industry: Real Estate
Employee count: 1–10 (individual agents or small teams)
Location: [TARGET CITY]
Has phone: YES
Has email: YES
```

**Note:** Real estate agents often use personal emails (Gmail). Include them — they read personal email more than business email.

**Export name:** `RealEstate_[CITY]_[DATE]`

---

### SEARCH 3: HVAC / Plumbing / Home Services

**People filters:**
```
Job Titles (include ANY):
- Owner
- Co-Owner
- General Manager
- Service Manager
- Operations Manager

Seniority: Owner, C-Suite
```

**Company filters:**
```
Industry: Construction (select subcategories: HVAC, Plumbing, Electrical, Roofing, Landscaping)
Employee count: 2–30
Location: [TARGET CITY]
Has phone: YES
Has email: YES
```

**Export name:** `HomeServices_[CITY]_[DATE]`

---

### SEARCH 4: Med Spas / Aesthetics

**People filters:**
```
Job Titles (include ANY):
- Owner
- Founder
- Medical Director
- Practice Manager
- Clinic Director
- Aesthetic Director
```

**Company filters:**
```
Industry: Health, Wellness & Fitness
Keywords (company name includes ANY): spa, medspa, aesthetics, laser, skin, wellness, beauty, botox, filler, cosmetic
Employee count: 2–15
Location: [TARGET CITY]
Has phone: YES
Has email: YES
```

**Export name:** `MedSpa_[CITY]_[DATE]`

---

### SEARCH 5: Law Firms — Small Practices

**People filters:**
```
Job Titles (include ANY):
- Owner
- Managing Partner
- Partner
- Attorney
- Principal

Seniority: Owner, C-Suite, Partner
```

**Company filters:**
```
Industry: Legal Services
Employee count: 2–15 (avoid big firms — they have IT departments who block you)
Location: [TARGET CITY]
Practice area keywords (optional): personal injury, family law, criminal defense, immigration, estate planning
Has phone: YES
Has email: YES
```

**Export name:** `LawFirm_[CITY]_[DATE]`

---

### SEARCH 6: Chiropractic / Physical Therapy

**People filters:**
```
Job Titles (include ANY):
- Owner
- Chiropractor
- Physical Therapist
- Practice Manager
- Office Manager
- Clinic Owner
```

**Company filters:**
```
Industry: Health, Wellness & Fitness
Keywords: chiropractic, chiropractor, physical therapy, PT, sports medicine, rehab
Employee count: 1–15
Location: [TARGET CITY]
Has phone: YES
Has email: YES
```

**Export name:** `Chiro_PT_[CITY]_[DATE]`

---

## EXPORT PROCESS (for each saved search)

1. Run the saved search
2. Sort by **Last Activity** (most recently active profiles first)
3. Select top 50–100 results
4. Click **Export** → CSV
5. Map fields to Instantly.ai template (see below)

### Required CSV columns for Instantly.ai:
```
email          → apollo "Email"
first_name     → apollo "First Name"  
last_name      → apollo "Last Name"
company_name   → apollo "Company"
phone          → apollo "Phone"
city           → apollo "City"
state          → apollo "State"
business_type  → apollo "Industry" (rename column)
title          → apollo "Title"
```

---

## LEAD QUALITY FILTERING (Do before upload)

Remove leads that match ANY of these:
- Email domain is gmail.com/yahoo.com/hotmail.com without a real name match (likely outdated)
- Job title contains "student", "intern", "assistant" (not decision makers)
- Company has 0 reviews on Google (may be dormant)
- Company name contains "LLC" only with no other info (shell companies)
- Phone number is missing

**Quick filter in Excel/Google Sheets:**
```
=IF(OR(
  ISNUMBER(SEARCH("intern",D2)),
  ISNUMBER(SEARCH("student",D2)),
  ISNUMBER(SEARCH("assistant",D2)),
  LEN(E2)<7
),"REMOVE","KEEP")
```

Run this in column J, filter to KEEP only.

---

## GOOGLE MAPS SUPPLEMENTAL SCRAPING

For niches with low Apollo coverage (especially local home services), use Google Maps data.

**Tool:** Outscraper.com or PhantomBuster Google Maps scraper

**Search queries to run:**
```
"dental office [city]"
"dentist [city]"
"real estate agent [city]"
"HVAC company [city]"
"plumber [city]"
"med spa [city]"
"law firm [city]"
"chiropractor [city]"
```

**What to extract:** Business name, phone, website, owner name (from "About" section), review count, rating

**Filter:** Rating > 3.5 stars AND > 10 reviews (active businesses)

**Then:** Find owner email via Apollo's search by company name, or Hunter.io

---

## AUTOMATING LEAD UPLOAD WITH APOLLO API (Advanced — week 3+)

Once you're ready to fully automate, add this n8n node before your email campaign:

```json
{
  "node": "Apollo API — Weekly Lead Pull",
  "schedule": "Every Monday 7am",
  "endpoint": "POST https://api.apollo.io/v1/mixed_people/search",
  "body": {
    "api_key": "[YOUR_APOLLO_KEY]",
    "q_organization_industries": ["Medical & Health"],
    "person_titles": ["Owner", "Office Manager", "Practice Owner"],
    "per_page": 100,
    "prospected_by_current_team": ["no"],
    "contact_email_status": ["verified"],
    "organization_num_employees_ranges": ["1,20"],
    "person_locations": ["[YOUR_TARGET_CITY], [STATE]"]
  }
}
```

Map response → filter → Claude personalization → Instantly.ai upload via API.

Full Apollo API docs: https://apolloio.github.io/apollo-api-docs/

---

## WEEKLY LEAD SOURCING SCHEDULE

| Day | Action | Time |
|-----|--------|------|
| Monday | Run all 3 saved searches for primary niche, export 60 leads | 20 min |
| Monday | Run Claude personalization node in n8n for all 60 | Automated |
| Monday | Upload to Instantly.ai campaign | 5 min |
| Wednesday | Check Apollo for "recently changed jobs" leads — re-engage | 10 min |
| Friday | Review reply rates — if below 2%, test new niche/city next week | 10 min |

**Total manual time per week: 35 minutes**

---

## SCALING: WHEN TO ADD MORE CITIES

Once reply rate is stable at >3% in your first city:
1. Duplicate the saved searches for the next nearest major city
2. Create a separate Instantly.ai campaign for each city
3. One email account per campaign (buy an extra Google Workspace seat)
4. 200 leads × $2,000 avg retainer value = every 1% conversion = $4,000/month added

**Highest-value city expansions** (in order of SMB density):
New York → Los Angeles → Chicago → Houston → Phoenix → Philadelphia → San Antonio → Dallas → Austin → Jacksonville

---

## COMPLIANCE NOTES

**CAN-SPAM (US):**
- Every email must have a physical address (use a PO box if home-based)
- Unsubscribe link required — Instantly.ai adds this automatically
- Must honor unsubscribes within 10 business days
- "From" name must not be deceptive

**CASL (Canada):**
- B2B cold email IS allowed in Canada to business email addresses
- Must have easy opt-out
- Do not email personal emails (Gmail, Yahoo) in Canada without consent

**GDPR (EU/UK):**
- Cold B2B email requires "legitimate interest" basis
- Add privacy notice to your website
- Remove EU contacts from lists upon request
- Consider skipping EU for simplicity until you're established
