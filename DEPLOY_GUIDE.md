# Beginner's Deployment Guide (Windows)

I see you are new to the command line! Don't worry, the "black screen" can be tricky. Here is the easiest way to get your app live on GitHub.

### 🌟 The Easy Way (Highly Recommended)
If you don't like typing commands, use **GitHub Desktop**. It has buttons for everything!
1. **Download & Install**: [desktop.github.com](https://desktop.github.com/)
2. **Open the Project**: 
   - Click **File** > **Add Local Repository**.
   - Paste this path: `c:\Users\Admin\Downloads\New folder (10)\sharp-study-mate-main`
3. **Save and Push**:
   - The app will show all the changes I made.
   - Type a message like "Integrated native mobile feel" in the summary box.
   - Click **Commit to main**, then click **Push origin**.

---

### 💻 The Professional Way (Command Line)
If you prefer to use the terminal (PowerShell), follow these exact steps:

#### Step 1: Install Git
Your computer currently doesn't know what "git" is.
1. Download here: [git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer and just click **Next** on every single screen until it finishes.

#### Step 2: Open your project in the terminal
You cannot just type the name of a folder; you must use the `cd` (Change Directory) command.
1. Open **PowerShell**.
2. Copy and paste this exact line and press **Enter**:
   ```powershell
   cd "c:\Users\Admin\Downloads\New folder (10)\sharp-study-mate-main"
   ```
   *(You should now see the folder path appear in the prompt!)*

### Step 2: Connect and Replace
Copy and paste these lines **one at a time** into PowerShell. Do NOT copy the words like "git" or the symbols, just the whole line.

**1. Copy and paste this first:**
git init

**2. Link your GitHub:**
git remote add origin https://github.com/Abbas99817/sharp-study-mate.git

**3. Prepare the files:**
git add .

**4. Save the changes:**
git commit -m "Updated with native mobile experience"

**5. Switch to main branch:**
git branch -M main

**6. Push to GitHub (This replaces the old code):**
git push -f origin main

---

### 🔑 Critical: Add your Supabase Keys to GitHub
Once your code is on GitHub, the website needs to know your Supabase information to work:
1. Go to your repository on **GitHub.com**.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add these two (find the values in your `.env` file):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 🌐 Enable the Website
1. On GitHub.com, go to **Settings** > **Pages**.
2. Under "Build and deployment", change the Source to **GitHub Actions**.
3. Your site will be live in a few minutes!

---

### 🚀 Using Vercel instead?
If you already use Vercel, it works the same way:
1. When you **Push** your code to GitHub, Vercel will build it automatically.
2. **Setup Keys**: Go to your **Vercel Dashboard** > **Settings** > **Environment Variables**.
3. Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` there.

By doing this, everything (GitHub and Vercel) will stay perfectly in sync! 🪄✨
