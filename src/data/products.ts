// Product-education pages: evergreen "explainer" content (informational intent),
// distinct from the transactional service pages and the local/timely blog. Each
// page links DOWN to its matching service + service areas (hub-and-spoke).

export interface ProductType { name: string; desc: string }
export interface ProductFaq { question: string; answer: string }
export interface Product {
  slug: string;
  name: string;
  category: 'Residential' | 'Commercial' | 'Residential & Commercial';
  title: string;
  description: string;
  h1: string;
  intro: string;
  what: { heading: string; html: string };
  types: { heading: string; items: ProductType[] };
  pros: string[];
  cons: string[];
  comparison: { heading: string; html: string };
  useCases: { heading: string; items: string[] };
  service: { label: string; href: string };
  related: string[]; // slugs
  faqs: ProductFaq[];
}

export const products: Product[] = [
  {
    slug: 'deadbolts',
    name: 'Deadbolts',
    category: 'Residential',
    title: 'Deadbolt Locks Explained: Types, Grades & How to Choose | Be Secure Locksmith',
    description: 'What a deadbolt is, single- vs double-cylinder, ANSI grades, and when to upgrade — plain-English guidance from licensed Gainesville & Ocala, FL locksmiths.',
    h1: 'Deadbolt Locks: Types, Grades, and How to Choose the Right One',
    intro: 'A deadbolt is the single most important lock on most exterior doors. Unlike the spring latch in a knob or lever, a deadbolt throws a solid metal bolt deep into the door frame and can only be moved by turning the key or thumbturn — which is exactly what makes it so much harder to force or slip open.',
    what: {
      heading: 'How a deadbolt works',
      html: '<p>A deadbolt has no spring. When you turn the key or thumbturn, a rigid bolt extends (or retracts) from the lock body into a reinforced strike in the door jamb. Because nothing pushes it back automatically, an intruder can’t "loid" it with a card or pry the latch the way they can with a spring-loaded knob lock. Real-world security comes from three things together: the <strong>grade of the deadbolt</strong>, the <strong>length of the bolt throw</strong> (a full 1-inch throw is standard), and a <strong>reinforced strike plate</strong> anchored with 3-inch screws into the wall stud.</p>',
    },
    types: {
      heading: 'Common types of deadbolts',
      items: [
        { name: 'Single-cylinder', desc: 'Keyed on the outside, thumbturn on the inside. The most common residential deadbolt.' },
        { name: 'Double-cylinder', desc: 'Keyed on both sides — no thumbturn. Used on doors with nearby glass, but there are important safety trade-offs (see below).' },
        { name: 'Lockable thumbturn', desc: 'A middle ground: a thumbturn that can be key-locked, giving glass-door security without a permanently keyed interior.' },
        { name: 'Smart deadbolt', desc: 'A deadbolt driven by a keypad or app instead of (or in addition to) a key.' },
        { name: 'Vertical / "jimmy-proof" deadbolt', desc: 'Surface-mounted interlocking bolt often seen on apartment and older doors; resists spreading the frame.' },
      ],
    },
    pros: [
      'Far more force- and pry-resistant than a spring latch',
      'Can’t be slipped with a card like a knob lock',
      'Inexpensive, huge security-per-dollar upgrade',
      'Works on virtually any door with no power needed',
    ],
    cons: [
      'Only as strong as the strike plate and frame behind it',
      'A quality Grade-1 deadbolt still can’t stop a determined pro alone — layer it with a reinforced strike',
      'Double-cylinder versions can trap you in a fire (see comparison)',
    ],
    comparison: {
      heading: 'Single-cylinder vs double-cylinder: security vs. escape',
      html: '<p>Double-cylinder deadbolts remove the interior thumbturn so a burglar can’t break nearby glass, reach in, and turn the lock. The trade-off is real: in a fire or emergency you need a key to get <em>out</em>, which can be dangerous and may violate local egress codes on some doors. For most homes we recommend a <strong>single-cylinder Grade-1 deadbolt with a reinforced strike</strong>, or a <strong>lockable thumbturn</strong> when there’s glass within reach — you get the security without locking yourself in.</p>',
    },
    useCases: {
      heading: 'When a deadbolt upgrade makes sense',
      items: [
        'Any exterior door protected only by a knob or lever lock',
        'After moving into a home or unit (pair with a rekey so old keys stop working)',
        'Doors with a short bolt throw or a flimsy builder-grade strike plate',
        'Rental turnovers where you want dependable, low-maintenance security',
      ],
    },
    service: { label: 'New lock installation', href: '/services/new-lock-installation/' },
    related: ['high-security-locks', 'mortise-locks'],
    faqs: [
      { question: 'What is the difference between ANSI Grade 1 and Grade 2 deadbolts?', answer: 'ANSI grades rate how much force and how many operations a lock survives. Grade 1 is commercial-strength (the highest residential-available tier), Grade 2 is solid residential, and Grade 3 is basic. For an exterior door, a Grade 1 or good Grade 2 deadbolt with a reinforced strike is the sweet spot.' },
      { question: 'Should I get a single- or double-cylinder deadbolt?', answer: 'Single-cylinder is best for most homes because you can always exit without a key. Consider a double-cylinder or a lockable thumbturn only when there is glass within arm’s reach of the lock — and check that it is allowed for that door under local fire-egress rules.' },
      { question: 'Are deadbolts pick-proof?', answer: 'No lock is truly pick-proof, but a good deadbolt raises the bar significantly. If you want strong pick, drill, and key-copy resistance, look at a high-security deadbolt with a restricted keyway.' },
      { question: 'Can you rekey my existing deadbolt instead of replacing it?', answer: 'Usually, yes. If the deadbolt is good quality and in good shape, rekeying is faster and cheaper than replacement and makes all old keys stop working.' },
    ],
  },

  {
    slug: 'mortise-locks',
    name: 'Mortise Locks',
    category: 'Commercial',
    title: 'Mortise Locks Explained: How They Work & Where They’re Used | Be Secure',
    description: 'What a mortise lock is, how it differs from a cylindrical (bored) lock, common functions, and repair vs. replace — from Gainesville & Ocala commercial locksmiths.',
    h1: 'Mortise Locks: What They Are and Why Commercial Doors Rely on Them',
    intro: 'A mortise lock is the heavy, all-in-one lock body you’ll find on office buildings, older homes, and high-traffic commercial doors. Instead of boring two round holes, the lock installs in a rectangular pocket — a "mortise" — cut into the edge of the door, giving it far more strength and versatility than a standard knob or lever set.',
    what: {
      heading: 'How a mortise lock works',
      html: '<p>A mortise lock combines a latch and a deadbolt inside one rugged rectangular case that seats into a pocket cut into the door edge. A separate cylinder threads into that case, and the trim (lever or knob) attaches on each side. Because the mechanism is larger and mounted inside the door rather than through two bored holes, it handles heavy daily use and offers lock "functions" a cylindrical lock can’t. It’s a repairable, rebuildable system — often you can service or rekey the lock without replacing the whole door.</p>',
    },
    types: {
      heading: 'Mortise lock functions you’ll see',
      items: [
        { name: 'Entry / office function', desc: 'Locks and unlocks from the outside with a key; free egress from inside.' },
        { name: 'Storeroom function', desc: 'Outside lever is always locked and needs a key; the door secures every time it closes.' },
        { name: 'Classroom function', desc: 'Locked or unlocked from the outside by key so a room can be secured without touching the inside.' },
        { name: 'Privacy / restroom function', desc: 'Thumbturn lock with an emergency release — no keyed cylinder.' },
        { name: 'Mortise deadbolt', desc: 'A deadbolt-only mortise body, sometimes paired with separate lever trim.' },
      ],
    },
    pros: [
      'Extremely durable — built for high-traffic commercial doors',
      'One body offers many security "functions"',
      'Repairable and rekeyable rather than disposable',
      'Accepts high-security and interchangeable-core cylinders',
    ],
    cons: [
      'More labor to install than a bored (cylindrical) lock',
      'Requires a properly prepped door with a mortise pocket',
      'Parts vary by manufacturer — best serviced by a locksmith',
    ],
    comparison: {
      heading: 'Mortise vs. cylindrical (bored) locks',
      html: '<p>A <strong>cylindrical lock</strong> installs through two round holes and is quick, cheap, and fine for most residential doors. A <strong>mortise lock</strong> takes more work to fit but is dramatically stronger, lasts longer under heavy use, and supports functions and cylinder options a bored lock can’t. For a busy storefront, office suite, or a period home that already has a mortise pocket, the mortise lock is almost always the better long-term choice — and it can usually be rebuilt instead of replaced.</p>',
    },
    useCases: {
      heading: 'Where mortise locks shine',
      items: [
        'Commercial entry, office, and storeroom doors with heavy daily traffic',
        'Older and historic homes originally built for mortise hardware',
        'Doors that need a specific keyed function (storeroom, classroom)',
        'Upgrades that pair a mortise body with a high-security or IC-core cylinder',
      ],
    },
    service: { label: 'Commercial locksmith services', href: '/services/commercial-locksmith/' },
    related: ['exit-devices', 'high-security-locks'],
    faqs: [
      { question: 'What is the difference between a mortise lock and a cylindrical lock?', answer: 'A cylindrical (bored) lock installs through two round holes and is quick and inexpensive. A mortise lock seats in a rectangular pocket cut into the door edge, is far more durable, and supports more functions and cylinder types — which is why commercial and older doors use it.' },
      { question: 'Can a mortise lock be rekeyed?', answer: 'Yes. The cylinder in a mortise lock can be rekeyed just like other locks, and mortise bodies can accept high-security or interchangeable-core cylinders for easier future rekeying.' },
      { question: 'Should I repair or replace a failing mortise lock?', answer: 'Often it can be repaired or rebuilt — mortise locks are designed to be serviced. A locksmith can tell you whether new parts or a full replacement is the smarter call based on the body’s condition and part availability.' },
    ],
  },

  {
    slug: 'exit-devices',
    name: 'Exit Devices & Panic Bars',
    category: 'Commercial',
    title: 'Exit Devices & Panic Bars: Types, Code & When Required | Be Secure',
    description: 'How push-bar exit devices work, the difference between panic and fire exit hardware, common types, and when code requires them — from Gainesville & Ocala locksmiths.',
    h1: 'Exit Devices & Panic Bars: How They Work and When Code Requires Them',
    intro: 'An exit device — the push bar you press to leave a store, school, or office — is life-safety hardware first and a lock second. Its job is to let anyone get out instantly in an emergency, even in a crowd, while still keeping the door secured from the outside.',
    what: {
      heading: 'How an exit device works',
      html: '<p>An exit device replaces a normal latch with a spring-loaded push bar or paddle that spans the door. Pushing anywhere along it retracts the latch and lets the door swing open immediately — no knob to turn, no thumbturn to find. From the outside the door stays locked (often with a keyed lever or pull), so you get free, panic-proof egress without giving up security. We install, align, adjust, and repair mechanical exit hardware; we don’t install wired access-control or electric-strike systems.</p>',
    },
    types: {
      heading: 'Types of exit hardware',
      items: [
        { name: 'Rim exit device', desc: 'Surface-mounted latch on the door face — the most common and economical style.' },
        { name: 'Surface vertical rod', desc: 'Rods run to the top and bottom of the door; common on double doors.' },
        { name: 'Concealed vertical rod', desc: 'Same top/bottom latching, hidden inside the door for a cleaner look.' },
        { name: 'Mortise exit device', desc: 'Pairs a push bar with a mortise lock body for heavy-duty openings.' },
        { name: 'Fire-rated vs. non-rated', desc: 'Fire exit hardware has no mechanical dogging so the door always re-latches; standard panic hardware can be held open.' },
      ],
    },
    pros: [
      'Instant, intuitive egress in an emergency',
      'Keeps the door secured from the outside',
      'Meets panic/egress requirements for many occupancies',
      'Durable, repairable mechanical hardware',
    ],
    cons: [
      'Required by code on certain doors — not optional there',
      'Fire-rated openings have stricter rules (no dogging)',
      'Worn or misaligned devices can fail to latch — needs periodic service',
    ],
    comparison: {
      heading: 'Panic hardware vs. fire exit hardware',
      html: '<p>They look alike but aren’t interchangeable. <strong>Panic hardware</strong> provides emergency egress and can often be "dogged" (held retracted) so the door pushes open freely during business hours. <strong>Fire exit hardware</strong> is used on fire-rated doors and has <em>no</em> mechanical dogging — the door must latch every time to hold back smoke and flame. Putting the wrong type on a fire door is a code violation, so the opening’s fire rating decides which one you need.</p>',
    },
    useCases: {
      heading: 'Where exit devices are used',
      items: [
        'Retail, restaurant, and assembly spaces with higher occupant loads',
        'Fire-rated stair and corridor doors',
        'School, office, and warehouse exits',
        'Any door where local code requires panic or fire exit hardware',
      ],
    },
    service: { label: 'Commercial locksmith services', href: '/services/commercial-locksmith/' },
    related: ['mortise-locks', 'high-security-locks'],
    faqs: [
      { question: 'When does code require a panic bar?', answer: 'It depends on the building’s occupancy type and how many people the space holds. Assembly, educational, and high-occupancy spaces commonly require panic hardware on egress doors. Your local fire marshal or building code has the exact thresholds — we can help you evaluate a specific door.' },
      { question: 'What’s the difference between a panic bar and fire exit hardware?', answer: 'Panic hardware provides emergency egress and can often be held open (dogged). Fire exit hardware goes on fire-rated doors and cannot be dogged — it must re-latch every time so the door contains fire and smoke.' },
      { question: 'Do you install electric strikes or access control with exit devices?', answer: 'We install, align, and repair mechanical exit hardware. We do not install wired access-control systems, badge readers, or electric strikes — if your project needs integrated electronic access, that’s a different specialty.' },
    ],
  },

  {
    slug: 'high-security-locks',
    name: 'High-Security Locks',
    category: 'Residential & Commercial',
    title: 'High-Security Locks: Restricted Keys, Pick & Drill Resistance | Be Secure',
    description: 'What actually makes a lock "high-security" — restricted keyways, key control, pick/drill/bump resistance — and when it’s worth it. Gainesville & Ocala, FL locksmiths.',
    h1: 'High-Security Locks: What "High-Security" Really Means and When You Need One',
    intro: 'The word "high-security" gets stamped on a lot of hardware-store boxes, but a true high-security lock is a different category. It combines a restricted key that can’t be copied at a kiosk with physical resistance to picking, drilling, and bumping — protecting both how the lock opens and who can make a key for it.',
    what: {
      heading: 'What makes a lock "high-security"',
      html: '<p>Three things separate a genuine high-security lock from a standard one. First, <strong>key control</strong>: the keyway is patented and restricted, so keys can only be cut by an authorized dealer with your permission — no unauthorized copies at the hardware store. Second, <strong>physical attack resistance</strong>: hardened pins and inserts resist drilling, tight tolerances resist picking, and special pin designs resist bumping. Third, <strong>independent certification</strong> — look for ANSI Grade 1 and UL 437 ratings rather than just the words on the package.</p>',
    },
    types: {
      heading: 'Common high-security options',
      items: [
        { name: 'High-security deadbolts', desc: 'A restricted-key, drill- and pick-resistant deadbolt for exterior doors.' },
        { name: 'Rim & mortise cylinders', desc: 'High-security cylinders that drop into existing commercial hardware and exit devices.' },
        { name: 'Restricted key systems', desc: 'A patented keyway (e.g., Medeco, Mul-T-Lock) with documented key control across all your doors.' },
        { name: 'High-security padlocks', desc: 'Shrouded, boron-shackle padlocks for gates, trailers, and storage.' },
      ],
    },
    pros: [
      'Keys can’t be copied without your authorization (key control)',
      'Strong resistance to picking, drilling, and bumping',
      'Independently rated (ANSI Grade 1 / UL 437)',
      'Can be built into a master key system for whole-property control',
    ],
    cons: [
      'Higher upfront cost than standard locks',
      'Replacement keys come from an authorized dealer, not a kiosk',
      'Overkill for low-risk interior doors',
    ],
    comparison: {
      heading: 'High-security vs. standard locks',
      html: '<p>A standard lock protects the <em>opening</em> — but its key can usually be copied by anyone who holds it for five minutes, and the cylinder is comparatively easy to pick or drill. A <strong>high-security lock protects the key, too</strong>: a lost or "borrowed" key can’t be duplicated without your say-so, which is often the bigger real-world risk for landlords, businesses, and anyone who’s handed out keys over the years. If key control matters — or you’ve had a break-in — high-security is where the money is best spent.</p>',
    },
    useCases: {
      heading: 'When high-security is worth it',
      items: [
        'Businesses that need to control who can make keys',
        'Rentals and properties where keys have circulated for years',
        'Homes after a break-in or a lost/stolen key',
        'Master key systems where a single copied key would be a big exposure',
      ],
    },
    service: { label: 'Lock rekeying & high-security upgrades', href: '/services/lock-rekeying/' },
    related: ['deadbolts', 'mortise-locks'],
    faqs: [
      { question: 'What is a restricted keyway?', answer: 'A restricted keyway is a patented key profile whose blanks are controlled by the manufacturer. Only an authorized dealer can cut copies, and only with the owner’s authorization — so nobody duplicates your key without permission.' },
      { question: 'Are high-security keys impossible to copy?', answer: 'They can’t be copied at an ordinary kiosk or hardware store, and many are patent-protected so even other locksmiths can’t duplicate them without authorization. Copies come from the authorized dealer for that system, with your permission on file.' },
      { question: 'Is a high-security lock worth the extra cost?', answer: 'If your bigger risk is uncontrolled key copies — common for businesses, landlords, and homes that have handed out keys — then yes, because key control is exactly what standard locks don’t give you. For a low-risk interior door, a standard Grade-2 lock is usually enough.' },
    ],
  },
  {
    slug: 'smart-locks',
    name: 'Smart Locks',
    category: 'Residential',
    title: 'Smart Locks Explained: Types, Pros & Cons, and How to Choose | Be Secure',
    description: 'How smart locks work, Wi-Fi vs. Bluetooth vs. keypad models, real pros and cons, and what to know before you buy — from licensed Gainesville & Ocala, FL locksmiths.',
    h1: 'Smart Locks: How They Work and How to Choose the Right One',
    intro: 'A smart lock lets you lock and unlock a door with a code, a phone, or a fingerprint instead of (or alongside) a traditional key. Done right it’s a genuine convenience and security upgrade — but the model you pick and how it’s installed make the difference between "set it and forget it" and a frustrating lockout.',
    what: {
      heading: 'How a smart lock works',
      html: '<p>Most residential smart locks are a motorized deadbolt with a keypad, a wireless radio, and batteries. You unlock with a PIN, a phone app, or auto-unlock that senses your phone — and most keep a physical key as a backup. They connect over <strong>Bluetooth</strong> (short range, no hub), <strong>Wi-Fi</strong> (control from anywhere), or <strong>Z-Wave/Zigbee</strong> (needs a smart-home hub). These are standalone consumer locks, not wired building access-control systems.</p>',
    },
    types: {
      heading: 'Types of smart locks',
      items: [
        { name: 'Keypad deadbolt', desc: 'Enter a PIN — the most popular and reliable style.' },
        { name: 'Wi-Fi smart lock', desc: 'Lock, unlock, and check status from anywhere via app.' },
        { name: 'Bluetooth smart lock', desc: 'Unlocks when your phone is close; no internet needed.' },
        { name: 'Retrofit smart lock', desc: 'Mounts over your existing deadbolt’s interior, so your keys still work.' },
        { name: 'Fingerprint / biometric', desc: 'Unlocks with a stored fingerprint.' },
      ],
    },
    pros: ['No more hidden or lost keys', 'Give guests and cleaners their own code', 'Auto-lock so the door is never left unlocked', 'Remote lock/unlock and activity history (Wi-Fi models)'],
    cons: ['Batteries need upkeep — heed low-battery warnings', 'Wi-Fi models depend on your home network', 'Cheap units can be finicky — model and install quality matter', 'Keep a physical-key backup'],
    comparison: {
      heading: 'Smart lock vs. traditional deadbolt',
      html: '<p>A <strong>traditional deadbolt</strong> wins on simplicity and never needs a battery. A <strong>smart lock</strong> adds keyless convenience, per-user codes, and (on Wi-Fi models) remote control and history. Security-wise a smart lock is only as strong as the deadbolt hardware it’s built on — so choose a reputable Grade-2-or-better model and pair it with a reinforced strike. For most homes the code control alone makes it worth it; just keep a key backup and stay ahead of the batteries.</p>',
    },
    useCases: {
      heading: 'When a smart lock is a good fit',
      items: ['Rentals and guests who need temporary codes', 'Households tired of hiding or copying keys', 'Anyone who wants to lock or check the door remotely', 'Aging-in-place where turning a key is difficult'],
    },
    service: { label: 'Smart lock installation', href: '/services/smart-lock-installation/' },
    related: ['deadbolts', 'keypad-locks'],
    faqs: [
      { question: 'Are smart locks secure?', answer: 'A quality smart lock built on Grade-2-or-better deadbolt hardware is as physically secure as a traditional deadbolt, plus it adds code control and auto-lock. Choose a reputable brand, keep the firmware updated, and use strong, unique codes.' },
      { question: 'What happens if the battery dies?', answer: 'Most smart locks warn you for weeks before the battery dies and keep a physical-key override or external power contacts as a backup — so you won’t get locked out if you replace batteries promptly.' },
      { question: 'Do I need Wi-Fi for a smart lock?', answer: 'No. Bluetooth and keypad models work without internet. Wi-Fi is only needed if you want to control or monitor the lock remotely from anywhere.' },
    ],
  },

  {
    slug: 'keypad-locks',
    name: 'Keypad & Keyless Locks',
    category: 'Residential & Commercial',
    title: 'Keypad & Keyless Entry Locks: How They Work & Pros/Cons | Be Secure',
    description: 'Code-based keypad and keyless entry locks for homes and businesses — how they work, mechanical vs. electronic types, and when to choose them. Gainesville & Ocala, FL.',
    h1: 'Keypad & Keyless Entry Locks: Ditch the Key, Keep the Control',
    intro: 'A keypad lock replaces the key with a code — punch in the PIN and you’re in. For homes it means no more hidden spare key; for businesses it means handing out a code instead of cutting keys. These are standalone locks you program yourself, not wired badge-reader systems.',
    what: {
      heading: 'How keypad locks work',
      html: '<p>A keypad lock uses a numeric pad to control the bolt — enter a valid <strong>PIN code</strong> and it retracts. Two families exist: <strong>mechanical push-button locks</strong> that use one fixed combination, need no batteries, and are popular on back doors and storage; and <strong>electronic keypad locks</strong> that run on batteries and let you add, change, and delete multiple user codes. Both are standalone — nothing is wired to a panel or badge reader.</p>',
    },
    types: {
      heading: 'Types of keypad locks',
      items: [
        { name: 'Mechanical push-button lock', desc: 'One fixed code, no batteries, extremely durable — common on offices and storage.' },
        { name: 'Electronic keypad deadbolt', desc: 'Battery-powered, with multiple user codes you can add or delete.' },
        { name: 'Keypad lever / handleset', desc: 'A keypad built into a lever for commercial and high-traffic doors.' },
        { name: 'Keypad + smart lock', desc: 'A keypad model that also connects to an app (see our smart locks guide).' },
      ],
    },
    pros: ['No keys to cut, copy, or lose', 'Change the code instantly at staff or tenant turnover', 'Multiple codes on electronic models — one per user', 'Mechanical models need no power at all'],
    cons: ['Codes get shared casually — change them periodically', 'Electronic models need battery upkeep', 'Worn keypads can hint at frequent digits — vary codes', 'Not the same as audited, wired access control'],
    comparison: {
      heading: 'Keypad locks vs. traditional keys',
      html: '<p>Keys are simple, but every copy is a loose end — you can’t un-issue a key that’s been duplicated. A <strong>keypad lock</strong> trades that for a code you can change in seconds, which is why offices, rentals, and vacation homes love them. The catch is that codes get shared, so change them on a schedule. For businesses that need to know exactly <em>who</em> opened a door and <em>when</em>, that’s audited electronic access control — a wired specialty we don’t install. A keypad lock gives you code convenience without the wiring.</p>',
    },
    useCases: {
      heading: 'When keypad locks make sense',
      items: ['Rentals and vacation homes with rotating guests', 'Offices and storage rooms with shared access', 'Back and side doors where you don’t want a key', 'Keyless convenience on a budget'],
    },
    service: { label: 'Keypad & smart lock installation', href: '/services/smart-lock-installation/' },
    related: ['smart-locks', 'deadbolts'],
    faqs: [
      { question: 'What’s the difference between a keypad lock and access control?', answer: 'A keypad lock is a standalone lock you program with codes — no wiring. Access control is a wired system with badge readers, controllers, and audit logs. We install and service standalone keypad locks; we don’t install wired access-control systems.' },
      { question: 'Are mechanical or electronic keypad locks better?', answer: 'Mechanical (no-battery) locks are simple and bulletproof for a single shared code. Electronic locks are better when you need several user codes you can add or remove. We match the type to your door and how you manage access.' },
      { question: 'How often should I change the code?', answer: 'Change it whenever someone with the code leaves, and periodically otherwise — every few months is a good habit, especially on high-traffic doors.' },
    ],
  },

  {
    slug: 'lever-sets',
    name: 'Lever Sets & Door Knobs',
    category: 'Residential & Commercial',
    title: 'Door Levers vs. Knobs: Types, Functions & How to Choose | Be Secure',
    description: 'Door levers vs. knobs, ANSI grades, lock functions (passage, privacy, entry), and ADA considerations — plain-English guidance from Gainesville & Ocala locksmiths.',
    h1: 'Door Levers & Knobs: Types, Functions, and How to Choose',
    intro: 'Levers and knobs are the hardware you touch on every door — but they’re not all the same. The right choice comes down to the door’s job (does it need to lock?), the grade of the hardware, and increasingly, accessibility.',
    what: {
      heading: 'How lever and knob sets work',
      html: '<p>A lever or knob set operates a spring latch — the beveled bolt that lets a door close and stay shut. Some are purely for passage; others add a lock. The set’s <strong>function</strong> decides how it behaves, and the <strong>ANSI grade</strong> decides how long it lasts. Levers are increasingly standard because they’re easier to operate — you can open one with an elbow or a full hand, which matters for accessibility. On an exterior door, a lever or knob handles daily use while a <strong>deadbolt</strong> does the real securing.</p>',
    },
    types: {
      heading: 'Common functions',
      items: [
        { name: 'Passage', desc: 'No lock — for closets and hallways that just need to latch.' },
        { name: 'Privacy', desc: 'Push-button or turn lock with an emergency release — bedrooms and baths.' },
        { name: 'Entry / keyed', desc: 'Keyed outside, turn inside — for doors that need to secure.' },
        { name: 'Dummy', desc: 'A fixed pull with no latch — for closets and inactive double-door leaves.' },
        { name: 'Commercial-grade lever', desc: 'Heavy-duty Grade-1/2 levers for offices and public buildings.' },
      ],
    },
    pros: ['Levers are easier to operate than knobs (ADA-friendly)', 'Huge range of finishes and styles', 'Available in every function and grade', 'Simple, reliable everyday hardware'],
    cons: ['Spring-latch sets alone aren’t much security — add a deadbolt outside', 'Cheap builder-grade sets wear out on busy doors', 'A lever can occasionally snag clothing or pets'],
    comparison: {
      heading: 'Levers vs. knobs',
      html: '<p><strong>Knobs</strong> are compact and traditional, but they require gripping and twisting — hard for kids, seniors, and anyone with full hands. <strong>Levers</strong> push down easily and meet accessibility guidelines, which is why commercial code often requires them and more homeowners are switching. Security is similar for both, and neither replaces a deadbolt on an exterior door — the lever or knob handles daily use while the <em>deadbolt</em> secures.</p>',
    },
    useCases: {
      heading: 'When to choose new levers or knobs',
      items: ['Interior doors that need passage or privacy', 'Accessibility upgrades (switching knobs to levers)', 'Rental turnovers and whole-home hardware refreshes', 'Commercial doors needing Grade-1/2 levers'],
    },
    service: { label: 'New lock & hardware installation', href: '/services/new-lock-installation/' },
    related: ['deadbolts', 'high-security-locks'],
    faqs: [
      { question: 'Are levers more secure than knobs?', answer: 'Security is about the same — both use a spring latch. The real difference is ease of use: levers are ADA-friendly and easier to operate. For actual security on an exterior door, add a deadbolt.' },
      { question: 'What is a passage vs. privacy vs. entry set?', answer: 'Passage sets don’t lock (closets, halls). Privacy sets have a simple push/turn lock with an emergency release (bedrooms, baths). Entry sets are keyed for doors that need to secure.' },
      { question: 'Can you match new hardware to my existing finish?', answer: 'Usually, yes — levers and knobs come in a wide range of finishes, and we can help match new hardware to what you already have.' },
    ],
  },

  {
    slug: 'padlocks-mailbox-locks',
    name: 'Padlocks & Mailbox Locks',
    category: 'Residential & Commercial',
    title: 'Padlocks & Mailbox Locks: Types, Security & Rekeying | Be Secure',
    description: 'How to choose a padlock (shackle, materials, rekeyable) plus cluster-mailbox (CBU) lock replacement and keying — from Gainesville & Ocala, FL locksmiths.',
    h1: 'Padlocks & Mailbox Locks: Choosing Right and Keeping Keys Under Control',
    intro: 'Padlocks and mailbox locks are small, but the details matter — the wrong padlock is cut in seconds, and a mailbox lock keyed to the wrong system means lost mail or a trip to the post office. Here’s how to choose well and keep them keyed the way you want.',
    what: {
      heading: 'How they work',
      html: '<p>A <strong>padlock</strong> is a portable lock with a shackle (the U-shaped bar) that secures a hasp, chain, or latch. Real security comes from the shackle’s material and diameter, whether it’s <strong>shrouded</strong> against bolt cutters, and the quality of the cylinder inside. <strong>Mailbox locks</strong> — especially the cluster box units (CBUs) at apartments and newer neighborhoods — use a small cam lock we can replace and key to your existing system or a fresh key.</p>',
    },
    types: {
      heading: 'Types',
      items: [
        { name: 'Standard padlock', desc: 'General-purpose for gates, sheds, and lockers.' },
        { name: 'Shrouded / boron-shackle padlock', desc: 'Cut-resistant for higher-security outdoor use.' },
        { name: 'Weatherproof padlock', desc: 'Sealed against rain and corrosion for exterior gates.' },
        { name: 'Rekeyable padlock', desc: 'Can be rekeyed to match your other locks or a master system.' },
        { name: 'Mailbox cam lock (CBU)', desc: 'The replaceable lock in cluster and wall mailboxes.' },
      ],
    },
    pros: ['Portable security for anything with a hasp', 'Rekeyable models can join your existing key system', 'Shrouded / boron shackles resist bolt cutters', 'Mailbox locks can be keyed to match your other keys'],
    cons: ['Cheap padlocks are easily cut or picked — grade matters', 'An exposed shackle is the weak point', 'Lost mailbox keys sometimes need a locksmith or the post office', 'Outdoor padlocks seize without weather resistance'],
    comparison: {
      heading: 'Choosing a padlock: what actually matters',
      html: '<p>Price hides big differences. A hardware-store padlock with a thin, exposed shackle is cut in seconds; a <strong>shrouded padlock with a hardened boron shackle</strong> resists bolt cutters and is worth it for gates, trailers, and storage. If you manage several locks, a <strong>rekeyable padlock</strong> brings them onto one key or a master system. For mailboxes, the priority is simply getting the cam lock re-keyed correctly so only you have access.</p>',
    },
    useCases: {
      heading: 'When to upgrade or rekey',
      items: ['Gates, sheds, trailers, and storage units', 'Businesses that want padlocks on one master key', 'Replacing a lost or worn cluster-mailbox lock', 'Swapping a flimsy padlock for a cut-resistant one'],
    },
    service: { label: 'Mailbox & lock installation', href: '/services/mailbox-lock-installation/' },
    related: ['high-security-locks', 'deadbolts'],
    faqs: [
      { question: 'What makes a padlock high-security?', answer: 'A hardened (boron) shackle, a shrouded body that shields the shackle from bolt cutters, and a quality pick-resistant cylinder. Shackle material and diameter matter more than overall size.' },
      { question: 'Can you rekey a padlock to match my other locks?', answer: 'If it’s a rekeyable padlock, yes — we can key it to match your existing key or bring it onto a master system so one key runs everything.' },
      { question: 'I lost my mailbox key — can you help?', answer: 'Usually, yes. For cluster mailboxes (CBUs) we can replace the cam lock and provide new keys; for USPS-owned master compartments you may need the post office, and we’ll tell you which applies.' },
    ],
  },

  {
    slug: 'master-key-ic',
    name: 'Master Key & IC Systems',
    category: 'Commercial',
    title: 'Master Key & Interchangeable Core (IC) Systems Explained | Be Secure',
    description: 'How master key hierarchies and interchangeable-core (IC) cylinders work, their pros and cons, and when each makes sense — from Gainesville & Ocala commercial locksmiths.',
    h1: 'Master Key & Interchangeable Core (IC) Systems: Key Control Without the Chaos',
    intro: 'Once you have more than a few doors, loose keys become a headache. A master key system lets one key open many doors while each person carries a key only to their areas — and interchangeable cores let you rekey a door in seconds. Together they’re how businesses keep control of who opens what.',
    what: {
      heading: 'How master keying and IC cores work',
      html: '<p>In a <strong>master key system</strong>, each lock is pinned so its own <em>change key</em> opens just that door, while a higher-level <em>master key</em> opens a group of doors — a hierarchy of who can open what. An <strong>interchangeable core (IC)</strong> goes further: the core (the part with the keyway) pops out with a special control key and a new one drops in seconds, so you can rekey a door instantly without taking the lock apart. Both are purely mechanical key control — no wiring or power.</p>',
    },
    types: {
      heading: 'Common setups',
      items: [
        { name: 'Master key system', desc: 'One master opens many doors; each door keeps its own key.' },
        { name: 'Grand-master system', desc: 'Multiple master levels for larger or multi-tenant buildings.' },
        { name: 'Small-format IC (SFIC)', desc: 'The common figure-8 core used across many manufacturers.' },
        { name: 'Large-format IC (LFIC)', desc: 'Brand-specific cores for certain hardware lines.' },
      ],
    },
    pros: ['One key opens what a person needs — nothing more', 'Rekey an IC door in seconds when someone leaves', 'No power required — reliable and low-maintenance', 'Scales cleanly as you add doors and staff'],
    cons: ['Requires up-front planning of the keying hierarchy', 'A lost master key is a bigger deal — plan for it', 'IC cores cost more per door than standard cylinders', 'Best designed and documented by a locksmith'],
    comparison: {
      heading: 'Master keys / IC vs. electronic access control',
      html: '<p>A <strong>master key or IC system</strong> is reliable, needs no power, works on virtually any door, and is far cheaper to deploy building-wide. <strong>Electronic access control</strong> adds audit trails and instant remote revocation — but it’s a wired specialty (readers, controllers, power) we don’t install. For most small and mid-size businesses, a well-designed master key system with IC cores delivers the control they actually need — and you can build it on <em>high-security cylinders</em> for real key control on top.</p>',
    },
    useCases: {
      heading: 'When master keying / IC makes sense',
      items: ['Buildings where staff need different access levels', 'Properties with regular tenant or employee turnover (IC cores)', 'Multi-building or multi-tenant sites needing a hierarchy', 'Anyone tired of carrying a ring of keys'],
    },
    service: { label: 'Master key systems', href: '/services/master-key-systems/' },
    related: ['high-security-locks', 'mortise-locks'],
    faqs: [
      { question: 'What’s the difference between a master key system and interchangeable cores?', answer: 'A master key system is the keying hierarchy — which keys open which doors. Interchangeable cores are a hardware type that lets you swap the keyed core in seconds to rekey a door. They’re often used together.' },
      { question: 'How is an IC core rekeyed so fast?', answer: 'A special control key removes the entire core from the lock in one motion, and a re-pinned core drops in to replace it — no disassembly and no removing the lock from the door. It’s ideal for quick tenant or staff turnover.' },
      { question: 'Can a master key system use high-security keys?', answer: 'Yes. You can build a master key system on restricted, high-security cylinders so the convenience of master keying comes with real key control.' },
    ],
  },

  {
    slug: 'door-closers',
    name: 'Door Closers',
    category: 'Commercial',
    title: 'Door Closers Explained: Types, Adjustment & Code | Be Secure Locksmith',
    description: 'How door closers work, hydraulic vs. spring closers, ADA closing force, fire-door latching, and when they need service — from Gainesville & Ocala locksmiths.',
    h1: 'Door Closers: How They Work and Why Getting Them Right Matters',
    intro: 'A door closer is the arm at the top of a commercial door that pulls it shut and controls how it closes. It’s easy to ignore until a door slams, drifts open, or won’t latch — at which point it becomes a security, safety, and sometimes code problem.',
    what: {
      heading: 'How a door closer works',
      html: '<p>A door closer uses a spring to pull the door shut and a <strong>hydraulic mechanism</strong> to control the speed so it doesn’t slam. Adjustment valves let a technician tune the <strong>closing speed</strong>, the final <strong>latching speed</strong>, and the <strong>backcheck</strong> that keeps the door from flying open into a wall. Proper adjustment matters for more than comfort: fire doors must close and latch every time, and accessibility rules limit how much force it takes to open the door.</p>',
    },
    types: {
      heading: 'Common types',
      items: [
        { name: 'Surface-mounted closer', desc: 'The familiar arm-and-body unit on the door or frame — most common.' },
        { name: 'Concealed / overhead closer', desc: 'Hidden in the door or frame for a clean look.' },
        { name: 'Floor-spring closer', desc: 'Mounted in the floor, common on glass storefront doors.' },
        { name: 'Fire-rated closer', desc: 'Ensures a fire door closes and latches every time.' },
      ],
    },
    pros: ['Keeps doors shut for security and climate control', 'Prevents slamming and protects the door and frame', 'Required for fire doors and many accessible entrances', 'Adjustable to the exact feel and speed you want'],
    cons: ['Leaks or wear cause slamming or a door that won’t latch', 'The wrong size/spring for the door means poor performance', 'ADA force limits mean it must be set correctly — not just tight', 'Best adjusted or replaced by a technician'],
    comparison: {
      heading: 'Adjust/repair vs. replace',
      html: '<p>Many closer problems — a door that slams, drifts, or won’t latch — are just an <strong>adjustment</strong> away, and a technician can dial in the speed and force in minutes. But once a closer starts <strong>leaking hydraulic fluid</strong> or the arm is worn, adjustment only buys time and <strong>replacement</strong> is the right call. Matching the closer’s size and spring power to the door — and its fire rating, if any — is what separates a door that works for years from one that fails again in months.</p>',
    },
    useCases: {
      heading: 'When door closers need attention',
      items: ['Commercial entrances that must close and secure on their own', 'Fire-rated doors that have to latch every time', 'Accessible entrances with opening-force limits', 'Storefront and glass doors with floor-spring closers'],
    },
    service: { label: 'Commercial locksmith services', href: '/services/commercial-locksmith/' },
    related: ['exit-devices', 'mortise-locks'],
    faqs: [
      { question: 'Why won’t my commercial door close or latch properly?', answer: 'Usually the closer needs adjustment (closing/latching speed), or it’s worn or leaking and needs replacement. Door and strike alignment also matter. A technician can quickly tell which it is.' },
      { question: 'Is there a limit on how hard a door should be to open?', answer: 'Yes — accessibility guidelines limit opening force on many doors, so a closer cranked down too tight can be both non-compliant and hard to use. It should close reliably within those limits.' },
      { question: 'Can you fix a slamming door?', answer: 'Almost always. A slamming door usually just needs the closing and latching speed adjusted; if the closer is leaking, we’ll recommend replacing it and sizing the new one correctly.' },
    ],
  },
];

export const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
