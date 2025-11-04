# Orange Digital Center - Events & Training Platform

Dynamic web platform showcasing Orange Digital Center's training programs and events across Morocco.

## 🚀 Features

- Browse available training programs
- Discover upcoming events and workshops
- Interactive calendar navigation
- Admin back-office for content management
- Responsive design for all devices
- Real-time data from Supabase

## 🏗️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Supabase (PostgreSQL, Storage, Auth)
- **Hosting:** Netlify
- **Build:** Custom build scripts (bash/PowerShell)

## 📁 Project Structure

```
.
├── index.html              # Landing page
├── styles.css              # Main stylesheet
├── script-dynamic.js       # Dynamic content loader
├── script-calendar-fix.js  # Calendar functionality
├── logo.svg                # Orange Digital Center logo
├── admin/                  # Back-office administration
│   ├── index.html          # Admin dashboard
│   ├── login.html          # Admin login
│   ├── css/                # Admin styles
│   └── js/                 # Admin scripts
├── config/                 # Configuration files
│   ├── supabase.js         # Supabase API wrapper
│   └── init-supabase.js    # Supabase initialization
├── build.sh                # Build script (Linux/Mac)
├── build.ps1               # Build script (Windows)
├── env.js.template         # Environment variables template
└── .env.example            # Environment variables example
```

## 🔧 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Hamzaelhamdani/ODCtrainingsandevents.git
cd ODCtrainingsandevents
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find these values:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Settings → API
4. Copy the Project URL and "anon public" key

### 3. Generate `env.js`

**On Windows (PowerShell):**
```powershell
# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Run build
./build.ps1
```

**On Linux/Mac:**
```bash
export $(cat .env | xargs) && ./build.sh
```

### 4. Run Local Server

```bash
# Python 3
python -m http.server 8000

# Or PHP
php -S localhost:8000
```

Visit: `http://localhost:8000`

## 🚀 Deployment on Netlify

### 1. Push to GitHub

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### 2. Configure Netlify

1. Connect your GitHub repository to Netlify
2. Go to **Site settings → Environment variables**
3. Add these variables:
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_ANON_KEY` = Your Supabase anon key

### 3. Build Settings

- **Build command:** `chmod +x build.sh && ./build.sh`
- **Publish directory:** `.`

Netlify will automatically:
- Run the build script
- Inject environment variables
- Deploy your site

For detailed instructions, see [NETLIFY_CONFIG.md](NETLIFY_CONFIG.md)

## 📚 Documentation

- **[ENVIRONMENT.md](ENVIRONMENT.md)** - Environment variables setup guide
- **[NETLIFY_CONFIG.md](NETLIFY_CONFIG.md)** - Netlify deployment guide

## 🔐 Security

- ⚠️ **Never commit `.env` file or `env.js` with real keys**
- ✅ Use `.env.example` as a template
- ✅ Keep sensitive keys in Netlify environment variables
- ✅ The `env.js` file is gitignored and generated at build time

## 🏢 Orange Digital Centers

Visit our centers across Morocco:
- **ODC Rabat** - Technopolis Rabat-Shore
- **ODC Agadir** - Quartier Industriel
- **ODC Ben M'sik** - Casablanca Ben M'sik
- **ODC Sidi Maarouf** - Casablanca Sidi Maarouf

## 📝 License

© 2025 Orange Digital Center Morocco. All rights reserved.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, contact: contact@orangedigitalcenter.ma