# Apex Gym — Customer Demo Guide & Pitch Script

Use this cheatsheet to run an end-to-end demo for your fitness club / gym client tomorrow.

---

## 1. Quick Setup (Before the Meeting)

Start both the backend server and frontend client with one command:
```bash
npm run dev:all
```
* **Desktop Browser Demo Link:** [http://localhost:5173](http://localhost:5173)
* **Mobile App Phone Link:** [http://localhost:5173/?app](http://localhost:5173/?app)

---

## 2. Recommended Screen Layout

Open **[http://localhost:5173](http://localhost:5173)** in Google Chrome or Safari on your laptop.
Click **"Side-by-Side"** in the top navigation bar.

> **Why:** This displays the **Member Mobile App** on the left and the **Operations Suite / Staff Scanner** on the right. Every action you take on the phone will update the admin system instantaneously via WebSockets!

---

## 3. The 3-Minute Winning Demo Script

### Act 1: The New Member Experience (Frictionless Onboarding)

* **What to say:**
  > *"When a new member joins your gym, they don’t want to fill out paper forms and wait 2 days for an access card. With Apex Gym, they can join and get their digital gate pass in 30 seconds."*

* **What to do:**
  1. On the left phone screen, click **"Join Apex Gym"** (top toggle).
  2. **Select Plan:** Click **Annual Pro (₹28,500/yr)** (or Monthly Pro) → Click **Continue**.
  3. **Enter Details:** Put in a name (e.g. *Subhadip Ghosh*) and a mobile number (e.g. *98300 55443*), choose fitness goal *Build muscle & strength* → Click **Send Verification Code**.
  4. Notice the **slide-down SMS push notification banner** at the top (`💬 Messages: Your Apex Gym security code is 4829`).
  5. The code auto-populates → Click **Confirm & Activate Membership**.
  6. **Boom!** The screen erupts with: *"Welcome to Apex Gym, Subhadip! Digital Pass Activated — Member ID APX-2045"*.
  7. Click **"Launch Your Dynamic Gate Pass"**.

---

### Act 2: Anti-Fraud Dynamic Turnstile Access (Revenue Protection)

* **What to say:**
  > *"Gyms lose up to 15% of membership revenue from members taking screenshots of their barcodes and sharing them with friends or coming in after their membership expired. Here’s how our dynamic cryptographic pass stops that permanently."*

* **What to do:**
  1. Point out the **30-second rolling countdown timer** next to the QR code.
  2. Explain: *"Every 30 seconds, the server signs a new HMAC-SHA256 token. A screenshot taken 40 seconds ago is completely dead."*
  3. Click **"Tap to Simulate Turnstile Scan"** (or use the Staff Scanner camera on the right).
  4. **Watch the live sync:**
     * The Member's screen flashes green: **Gate Unlocked** with tactile vibration.
     * The **Staff Scanner** on the right instantly verifies the pass.
     * The **Club Occupancy** counter on both the phone and the dashboard increments live (`65 / 120`).

---

### Act 3: Stopping Unpaid Members at the Gate (The #1 Gym Owner Pain Point)

* **What to say:**
  > *"What happens when a member’s payment bounces or their renewal is overdue? In traditional gyms, front-desk staff have awkward arguments or members slip in unnoticed. Here’s what happens with Apex:"*

* **What to do:**
  1. On the right-hand **Admin Operations Suite**, click **"Member Directory & Access"**.
  2. Find a member (or your new account) and click **"Toggle Status"** to set them to **Payment Due**.
  3. Now try to scan through the turnstile.
  4. **Result:** The system triggers an immediate **Red Alert: "Entry Denied. Status is Payment Due. Direct to front desk for renewal."**
  5. The gym owner sees that their revenue is 100% protected automatically.

---

### Act 4: Daily Member Engagement (Classes & PR Logging)

* **What to say:**
  > *"Beyond access, this is the app members use every day for class bookings and gym motivation."*

* **What to do:**
  1. Go to the **Classes** tab on the phone. Filter by *Strength* or *HIIT*.
  2. Show the spot counter (e.g. *9/16 spots booked*). Tap **"Book Spot"**.
  3. Point to the right-hand **Class Schedules & Rosters** on the manager dashboard: the member's name appears on the coach's live attendance roster instantly.
  4. Go to the **Lifts** tab. Log a quick workout: *Conventional Deadlift 160 kg, 4 sets, 5 reps, tap "PR Set"*.
  5. Tap **Save Workout Log** — immediate celebratory feedback and stored in the persistent database.

---

### Act 5: Front-Desk Walk-In Enrollment

* **What to say:**
  > *"When walk-in prospects come to your front desk, staff don't need clunky legacy software."*

* **What to do:**
  1. On the **Admin Operations Suite**, click the **"Enroll Walk-In Member"** button.
  2. Enter walk-in details (Name, Phone, Plan, Payment Mode like UPI/Card).
  3. Click **"Issue Pass & Activate Member"**.
  4. The member appears on the directory immediately and their phone is ready to scan.

---

## 4. Key Talking Points to Win the Deal

| Customer Pain Point | How Apex Gym Solves It |
| :--- | :--- |
| **Pass Sharing & Revenue Leakage** | 30-second rolling dynamic QR code signed with HMAC-SHA256 eliminates screenshot sharing. |
| **Overcrowding & Safety Limits** | Real-time headcount monitor connected to the turnstiles prevents gym floor crowding. |
| **Unpaid Members Slipping In** | Turnstiles automatically block entry for any member marked "Payment Due". |
| **Class No-Shows & Overbooking** | Instant 1-tap bookings with automated waitlist queueing when classes hit capacity. |
| **Legacy Clunky Software** | Modern, sleek dark-mode interface with zero lag, running on Android phones, tablets, and web. |
