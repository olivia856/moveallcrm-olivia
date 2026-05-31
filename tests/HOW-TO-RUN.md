# How to run the automated tests on Windows

## What you need first
- Node.js installed on your PC
  → Download from: https://nodejs.org (click the big green "LTS" button)
  → After installing, restart your computer once

---

## Step 1 — Put these files on your PC

1. Create a new folder on your Desktop called:  `moveallcrm-tests`
2. Copy both files into it:
   - `crm.test.js`
   - `package.json`

---

## Step 2 — Open Command Prompt in that folder

1. Open the folder in File Explorer
2. Click the address bar at the top (where it shows the folder path)
3. Type `cmd` and press Enter
   → A black Command Prompt window opens, already inside your folder

---

## Step 3 — Install the test tools (one time only)

In the Command Prompt window, type this and press Enter:

```
npm install
```

Wait for it to finish (takes 30–60 seconds). You'll see some text scroll by — that's normal.

---

## Step 4 — Run the tests

Type this and press Enter:

```
npm test
```

---

## What you'll see

The tests run one by one and show results like this:

```
 PASS  crm.test.js

  1. Login & Authentication
    ✓ Admin can log in with correct credentials (312ms)
    ✓ Login fails with wrong password (201ms)
    ✓ Staff can log in (188ms)
    ...

  5. Role permissions
    ✓ Staff cannot access users list (155ms)
    ✓ Admin can access users list (143ms)
    ...

Test Suites: 1 passed
Tests:       22 passed
Time:        8.3s
```

A ✓ means the test PASSED (working correctly)
A ✗ means the test FAILED (something needs fixing)

---

## If a test fails

Take a screenshot and send it to your developer (or paste it into Claude chat).
The error message will say exactly what went wrong, for example:

```
✗ Staff cannot access users list
  Expected: 403
  Received: 200   ← means staff CAN access it — that's a bug!
```

---

## Running tests again after you make changes

Every time you update your code and deploy to EasyPanel, just run:
```
npm test
```
in the same Command Prompt window. It takes about 10 seconds.
