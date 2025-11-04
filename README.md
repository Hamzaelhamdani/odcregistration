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

### 2. Run Local Server

```bash
# Python 3
python -m http.server 8000

# Or PHP
php -S localhost:8000
```

Visit: `http://localhost:8000`

## 🚀 Deployment

### Manual Deployment

1. Upload all files to your hosting server
2. Make sure `env.js` is included
3. Access your site via your domain

## 🔐 Security

- ⚠️ **Never commit `.env` file** (already in .gitignore)
- ✅ `env.js` contains configuration and is committed for deployment
- ✅ For production, rotate keys regularly from Supabase dashboard

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