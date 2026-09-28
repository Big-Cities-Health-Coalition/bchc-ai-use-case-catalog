# Taking ownership of the AI Use Case Catalog: a step-by-step guide for BCHC

This guide is for the Big Cities Health Coalition staff taking ownership of the AI Use Case
Catalog. It assumes you have never used GitHub. You will not write code, install anything, or use
a command line. Everything here happens in a web browser, and your part takes about 30 minutes.

Your technical maintainer (GitHub username **`crypticpy`**) does the technical work and stays on to
look after the catalog. Your part is to create BCHC's home on GitHub, let the maintainer in, and
answer a few questions.

(The maintainer's own technical checklist for the same move is
[`transfer-runbook.md`](transfer-runbook.md). You do not need to read it.)

## What is happening, in plain English

- **GitHub** is the website where the catalog's files live. Every time those files change, GitHub
  rebuilds the public catalog site automatically.
- A **repository** (or "repo") is one project's folder on GitHub. The catalog is one repository.
- An **organization** is a shared GitHub account that belongs to BCHC rather than to one person.
  People join it with their own personal accounts.
- Today the catalog lives under the maintainer's personal account. We are **moving** it into a
  BCHC organization, so BCHC owns it outright. Nothing is lost in the move: every file, every past
  submission, and the full history come along.

**What changes for you:** the catalog's web address. It goes from
`crypticpy.github.io/bchc-ai-use-case-catalog` to an address with BCHC's organization name in it
(or to your own address, such as `catalog.bigcitieshealth.org`, if you choose one; see question 5
below). The old address will not forward, so any links you have already shared will need
updating.

**What does not change:** how the site looks, how people submit use cases, and who keeps it
running day to day.

## Part 1: Set up BCHC on GitHub (about 20 minutes)

One person at BCHC does steps 1 to 5. If a second BCHC person will also be an owner (recommended),
they do steps 1 and 2 on their own computer too.

### Step 1: Create your personal GitHub account

Skip this if you already have one.

1. Go to **github.com** and click **Sign up**.
2. Use your **BCHC work email**.
3. Pick a **username**. It is public and appears next to everything you do, so choose something
   professional, such as `jsmith-bchc`.
4. Follow the prompts to verify your email. If asked about a paid plan, choose **Free**.

### Step 2: Turn on two-step sign-in

GitHub requires this for anyone who manages a repository, and it protects BCHC's account.

1. Click your **profile picture** (top right) → **Settings**.
2. In the left menu, click **Password and authentication**.
3. Click **Enable two-factor authentication**.
4. Choose **Authenticator app** and scan the code with an app on your phone (Microsoft
   Authenticator, Google Authenticator, 1Password, or similar).
5. GitHub shows you **recovery codes**. Download them and keep them somewhere safe that is not
   your email, such as your organization's password manager. If you lose your phone, these codes
   are the only way back in.

### Step 3: Create the BCHC organization

**If BCHC already has a GitHub organization, skip this step, but still do Steps 4 and 5** in that
organization.

1. Click the **+** (top right, next to your picture) → **New organization**.
2. Choose the **Free** plan.
3. **Organization name:** this becomes part of the web address, so keep it short and clear, such
   as `bigcitieshealth`. Lowercase letters and hyphens work best.
4. **Contact email:** a BCHC address that will outlast any one person, if you have one.
5. **This organization belongs to:** choose **A business or institution** and enter
   **Big Cities Health Coalition**.
6. Accept the terms and click **Next**. If it offers to add members, click **Skip this step**. You
   will do that next.

### Step 4: Add a second BCHC owner (recommended)

If only one person can get into the organization and that person leaves or loses their phone,
BCHC could be locked out of its own account. A second owner prevents that.

1. On the organization's page, click the **People** tab.
2. Click **Invite member**, type the second person's GitHub username, and choose the role
   **Owner**.
3. Click **Send invitation**. They accept it from the email GitHub sends them.

### Step 5: Invite the technical maintainer

There are two ways to do this. **Option A is recommended** because it leaves BCHC almost nothing
technical to do.

**Option A (recommended): invite the maintainer as a temporary Owner**

1. Still on the **People** tab, click **Invite member**.
2. Type **`crypticpy`** and choose the role **Owner**.
3. Click **Send invitation**.

Owner lets the maintainer adjust the organization's settings and move the catalog in without
walking you through a list of technical screens. It is temporary: when the move is finished, the
maintainer tells you, and you lower the role to Member (Part 4, Step 4). The maintainer then keeps
full control of the catalog itself, but not of the rest of your organization.

**Option B: invite the maintainer as a Member, and change the settings yourself**

Choose this if BCHC would rather nobody outside BCHC is ever an Owner.

1. Still on the **People** tab, click **Invite member**.
2. Type **`crypticpy`** and choose the role **Member**.
3. Click **Send invitation**.
4. Work through the [organization settings checklist](#appendix-organization-settings-for-option-b)
   at the end of this guide (about 10 minutes). The maintainer can talk you through it on a call.

## Part 2: Send these answers to your maintainer

Copy this list into an email, fill it in, and send it. Anything you don't know yet can say
"not sure"; only questions 1 and 2 are needed on the day.

1. **Organization name**, exactly as it appears in the web address `github.com/________`:
2. **GitHub usernames of every BCHC owner:**
3. **Product owner:** the person who decides what belongs in the catalog and signs off on new
   entries. Their name and GitHub username:
4. **Backup person:** someone who can step in if the product owner is away (or "not yet"):
5. **Your own web address?** Would you like the catalog at an address on your own website, such
   as `catalog.bigcitieshealth.org`? (yes / no / not sure) This is recommended, because the address
   then never has to change again, even if the catalog moves in future.
6. **Who manages BCHC's website domain?** If you answered yes to question 5, the name and email
   of the person or vendor who can add a record to your domain settings (often IT or your web
   hosting company). The maintainer will send them the exact record to add.
7. **Only if BCHC already had an organization before today:** do you sign in to GitHub through a
   BCHC company login (your Microsoft or Google work sign-in) rather than a GitHub password?
   (yes / no) If yes, tell the maintainer before the meeting, as the plan changes.

## Part 3: The move, step by step

This is the whole move, in order. "You" means a BCHC Owner; "the maintainer" means `crypticpy`.
Plan for about an hour together on a call. The catalog site is **offline for a few minutes**
between steps 4 and 6.

1. **The maintainer accepts your invitation.** It arrives by email. You can see it worked when
   `crypticpy` appears on your organization's **People** tab without the word "Pending".
2. **The organization settings are checked.** With Option A, the maintainer does this. With
   Option B, you do it using the [appendix](#appendix-organization-settings-for-option-b), and the
   maintainer checks it with you.
3. **The maintainer makes a last check** that the catalog is healthy in its current home.
4. **The maintainer moves the catalog** into your organization. It takes a few seconds. You will
   see it on your organization's page under **Repositories**.
5. **The maintainer gets full access to the catalog.**
   - Option A: the maintainer does this.
   - Option B: you do it. Open the catalog repository → **Settings** (top right of the repository,
     the gear icon) → **Collaborators and teams** in the left menu → **Add people** → type
     `crypticpy` → choose the role **Admin** → **Add**. Admin (not Write or Maintain) is needed to
     manage the site's settings.
6. **The maintainer brings the site back up** at its new address and sends it to you. From here,
   the old `crypticpy.github.io` address stops working.
7. **The maintainer updates the catalog's own links** (in its pages and forms) to point at its new
   home.
8. **The maintainer reconnects automatic template updates.** This needs a new access token (a
   limited key that lets the catalog receive template updates). If your organization asks for
   token approval, you get an email about a pending request from `crypticpy`: open it and click
   **Approve**. (With Option A, the maintainer can approve it.)
9. **The maintainer checks everything else survived the move**: the site's settings, its
   protections, and its submission labels.
10. **You lower the maintainer's organization role** to Member (Option A only). See Part 4,
    Step 4. Wait until the maintainer says steps 1 to 9 are done.

**Later, not on the day:**

- **Your own web address** (if you chose one in question 5): the maintainer sends your domain
  contact one record to add, then switches the catalog to that address.
- **Name the people.** The product owner and backup person are added to the catalog's list of
  maintainers once each has a GitHub account and has agreed.
- **Require a second pair of eyes.** Once there are two people who can approve changes, the
  maintainer switches on a rule that every change needs one approval before it goes live.
- **Practice runs.** Before the handoff is called done, the backup person rehearses a few routine
  tasks (taking an entry down, undoing a change) with the maintainer's written instructions.

## Part 4: Your first look around (about 15 minutes, after the move)

### Step 1: Visit the site and the repository

- The **site** is what the public sees. The maintainer will send you its new address.
- The **repository** is the behind-the-scenes view, at
  `github.com/<your organization name>/use-case-catalog`. Bookmark it.

### Step 2: Learn the three tabs you will use

Along the top of the repository page:

| Tab | What it is | What you do there |
|---|---|---|
| **Issues** | The inbox. Every new use-case submission arrives here as an "issue". | Read new submissions. |
| **Pull requests** | Proposed changes to the site, waiting for a yes. The automation turns each submission into one of these. | Review and approve entries. The maintainer will show you how the first few times. |
| **Actions** | The robot that builds the site and runs checks. | Nothing, usually. A green check means all is well. A red X means something failed: send the maintainer the link. |

You do not need the **Code** tab. That is where the files live, and the maintainer looks after it.

### Step 3: Get emails when something arrives

1. On the repository page, click **Watch** (top right).
2. Choose **Custom**, tick **Issues** and **Pull requests**, and click **Apply**.

You will now get an email for each new submission and each entry waiting for review.

### Step 4: Lower the maintainer's organization role (Option A only)

**Only when the maintainer tells you the move is finished.** By then the maintainer will have
full access to the catalog itself, so this does not take anything away that is needed.

1. Go to your organization's **People** tab.
2. Find **`crypticpy`**, click the **⋯** menu next to the name, and choose **Change role**.
3. Choose **Member** and confirm.

### Step 5 (optional): Try a practice submission

With the maintainer on the call:

1. On the catalog site, click **Submit** and fill in a made-up entry. Put **TEST** in the title.
2. Watch it appear under **Issues**, and a minute or two later under **Pull requests**.
3. The maintainer shows you what the review looks like, then closes the test without publishing
   it.

This is exactly what happens every time a real health department submits a use case.

## Common questions

**Should we make our own copy of the catalog first, to get to know it?**
No. A copy would be a separate, disconnected catalog, and it would take the name the real one
needs, which blocks the move. The catalog is public today, so you can look around the current site
and repository before the move, and after the move you learn it hands-on with the real thing and
with the maintainer's help.

**Can we break something?**
Very hard to. Nothing reaches the public site until someone approves a change, every change is
recorded and can be undone, and automatic checks stop most mistakes before they get that far. If
something looks wrong, send the maintainer the link and leave it.

**What does this cost?**
Nothing. The catalog runs entirely on GitHub's free plan for public projects.

**Who can see what?**
The catalog and its repository are public, as they are today: anyone can read them and submit a
use case. Only people you give access to can approve changes or change settings.

**What if we change our minds?**
The move can be reversed. The maintainer can move the catalog back.

## Appendix: organization settings for Option B

Only needed if you chose Option B in Part 1, Step 5. With Option A, the maintainer does all of
this. GitHub occasionally renames things on these screens; if something doesn't match, ask the
maintainer.

To get there: go to your organization's page, then click **Settings** (the gear icon in the row of
tabs). Each item below starts from that Settings page. Click **Save** at the bottom of any section
you change.

**Membership** (left menu: **Member privileges**)

1. **Base permissions:** choose **Read**.
2. **Repository creation:** tick **Public**. This is what lets the maintainer move the catalog in.
3. **Pages creation:** tick **Public**. This lets the catalog publish its website.
4. **Repository deletion and transfer:** leave as it is, but tell the maintainer whether it is
   ticked. It affects who could move the catalog back out later.

**Automation** (left menu: **Actions** → **General**)

5. **Policies:** choose **Allow all actions and reusable workflows**. The catalog applies its own
   stricter rules on top.
6. **Workflow permissions:** leave **Read repository contents and packages permissions** selected,
   and **tick "Allow GitHub Actions to create and approve pull requests"**. This one matters: without
   it, submissions never turn into entries.

**Access tokens** (left menu: **Personal access tokens** → **Settings**)

7. **Fine-grained personal access tokens:** choose **Allow access via fine-grained personal access
   tokens**. Requiring administrator approval is fine; it just means you approve one request in
   Part 3, step 8.

**Security** (left menu: **Code security**)

8. **Do not** apply a security configuration that turns on **CodeQL "default setup"** for the
   catalog. The catalog runs its own version of that check, and the two conflict. Everything else
   there (secret scanning, Dependabot alerts) is welcome.

**Sign-in security** (left menu: **Authentication security**)

9. If **Require two-factor authentication** is ticked, that's fine. The maintainer already uses
   it.

When you're done, tell the maintainer. They can check most of it from their side.
