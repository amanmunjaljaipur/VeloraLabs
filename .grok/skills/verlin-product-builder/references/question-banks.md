# Interview question banks

Use these banks when designing extensions. Adapt labels; keep **helpText + suggestions + allowCustom**.

## Universal (almost every local product)

### brandName
- Label: What should we call this on the website?
- Mode: free + suggestions (My Family Store, Neighbourhood Picks…)
- Required: yes

### city
- Label: Where is this based?
- Mode: single + city chips (Jaipur, Mumbai, Delhi NCR, Bengaluru…)
- Help: We use your city for colours and local feel
- Required: yes

### audience
- Label: Who usually comes to you?
- Mode: multi
- Chips: Neighbours & local families, Students, Parents, Tourists, Office-goers, Online in my city
- Required: yes

### vibe / tone
- Label: How should the website feel?
- Mode: multi
- Chips: Warm & homely, Simple & clear, Festive, Premium, Student-friendly, Trustworthy family business, Hindi–English mix ok
- Required: yes

### contact
- Label: How can people reach you?
- Mode: free multiline
- Help: Phone and/or WhatsApp, email if any, area/address
- Required: yes

### howToOrder / howToReach (channel)
- Label: How should people take the next step?
- Mode: multi
- Chips: WhatsApp, Phone call, Visit in person, Home delivery, UPI, Cash, Form on website
- Required: yes

### hours
- Label: When are you available? (optional)
- Mode: single
- Chips: Mon–Sat 10–8, Everyday 9–9, Evenings & weekends, Anytime on WhatsApp, By appointment

### mustHave
- Label: Anything you definitely want on the website?
- Mode: multi + custom
- Chips: Family shop story, Festival offers, Student discount, Safe packaging, Pay later / COD, Simple words, Quality promise

### extra / own points
- Studio step separate: free list of owner phrases → `ownerHighlights`

---

## ecom-local-shop (shipped)

- brandName, city, shopType (multi categories), whatYouSell (multiline products+prices), audience, vibe, howToOrder, hours, contact, mustHave

## booking-local (proposed)

| id | Label | Mode | Suggestion seeds |
|----|-------|------|------------------|
| brandName | Business name | free | Glow Studio, Care Clinic… |
| city | Area / city | single | cities |
| serviceType | What do you offer? | multi | Haircut, Consultation, Home visit, Online session, Repair |
| servicesDetail | List main services + rough price/time | free multi | 30-min consult ₹499… |
| audience | Who books? | multi | Women, Families, Students… |
| bookingChannel | How do they book? | multi | WhatsApp, Call, Website form, Walk-in |
| advanceNotice | How far ahead? | single | Same day ok, 1 day, 1 week |
| vibe | Feel | multi | Calm, Premium, Quick & simple |
| contact | Reach | free | |
| mustHave | Must show | multi | Cancellation note, Female staff, Parking… |

## tuition-centre (proposed)

| id | Label | Mode | Seeds |
|----|-------|------|-------|
| brandName | Centre / tutor name | free | |
| city | Location | single | |
| classes | Classes / grades | multi | 6–8, 9–10, 11–12, JEE, NEET, Spoken English |
| subjects | Subjects | multi | Maths, Science, English… |
| batchStyle | How you teach | multi | Small batch, 1:1, Online, Home tuition |
| feesHint | Fee style | free | Monthly / per subject rough range |
| audience | Who decides? | multi | Parents, Students |
| contact | Phone / WhatsApp | free | |
| vibe | Feel | multi | Strict & serious, Friendly, Exam-focused |
| mustHave | Must show | multi | Results note, Demo class, Study material |

## portfolio-creator (proposed)

| id | Label | Mode | Seeds |
|----|-------|------|-------|
| brandName | Your name / studio | free | |
| city | Based in | free | |
| craft | What you do | multi | Design, Writing, Photography, Dev, Art |
| samples | 3 projects in plain words | free multi | |
| audience | Who should hire you? | multi | Startups, Local businesses, Students |
| cta | How should they contact? | multi | Email, WhatsApp, Form |
| vibe | Portfolio feel | single | Minimal, Bold, Playful, Corporate |
| mustHave | Must include | multi | Testimonials, Pricing range, Resume PDF later |

---

## Chip writing rules

- 2–6 words, concrete nouns  
- Local / India realistic where relevant  
- No English jargon (no “omnichannel”, “SKU”, “CRM”)  
- Include at least one “soft” chip: “I will add details later”

## Required vs optional

**Required:** name, place, offer, audience, contact/channel  
**Optional:** hours, currency, long extras  

Never require perfect product catalogue—LLM/fallback can expand 3 bullets into cards.
