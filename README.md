<!-- Akash Verma — Personal Portfolio -->

A modern, responsive personal portfolio website for **Akash Verma**, focused on AI/ML, Data, and Web Development.

The portfolio is designed to present professional information, technical skills, education, certifications, projects, developer profiles, gallery content, and contact information through a clean and premium user experience.

## ✨ Features

- Modern responsive portfolio UI
- Hero section with interactive visual preview
- Real-time code typing animation
- Cursor-follow 3D tilt interaction
- About section
- Skills section
- Education section
- Certifications section
- Projects section
- Ongoing projects
- Developer Presence section
- GitHub activity/contribution visualization
- Gallery
- Contact section with interactive map
- Premium responsive footer
- Back-to-top control
- Social/profile links
- Admin Portal / CMS
- Admin authentication
- CRUD management for portfolio content
- Centralized content management
- API-driven developer statistics where supported
- Loading and error states for dynamic data
- Responsive desktop, tablet, and mobile layouts

## 🛠️ Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

The frontend is intentionally lightweight and does not require a frontend framework such as React, Vue, Angular, or Next.js.

### Dynamic Data / Backend

The Admin Portal requires the project's existing backend/data layer for secure authentication and persistent CRUD operations.

Real-time developer statistics are kept separate from CMS-controlled portfolio content and are fetched from supported APIs where available.

## 📁 Main Portfolio Sections

### Hero
Introduces Akash Verma with an interactive developer-focused visual preview.

### About
Provides a concise professional introduction and background.

### Skills
Displays technical skills and areas of expertise.

### Education
Presents educational qualifications in the portfolio's existing card layout.

### Certifications
Displays certifications, issuing organizations, dates, verification links, and related information.

### Projects
Showcases completed projects, technologies, descriptions, and relevant project links.

### Ongoing Projects
Highlights projects currently under development.

### My Developer Presence
Connects professional and coding profiles such as GitHub, LeetCode, HackerRank, GeeksforGeeks, LinkedIn, and other supported platforms.

Where official/public APIs are available, genuine statistics can be displayed dynamically. When live data is unavailable, the UI should use an appropriately labeled fallback rather than presenting fabricated statistics as real-time data.

### Gallery
Displays portfolio images without unnecessarily exposing raw image filenames.

### Contact
Provides contact information, a contact form, and an interactive map/location.

### Footer
Contains portfolio navigation, social links, copyright information, and Admin access.

## 🧑‍💻 Hero Visual Preview

The Hero Visual Preview contains only the intended dynamic content:

1. Greeting
2. About Me
3. Two motivational quotes
4. Two funny developer quotes

Current profile information:

- **Name:** Akash Verma
- **Focus:** AI/ML · Data · Web
- **Location:** Based in India
- **Currently building:** MOODIX

The preview supports a live typing effect, blinking cursor, automatic content cycling, syntax highlighting, and cursor-based interaction.

## 🔐 Admin Portal

The Admin Portal acts as the central content-management system for the portfolio.

The administrator can manage editable portfolio content without manually modifying the public website source code.

### Admin capabilities

- Login/logout
- Dashboard
- View content
- Add content
- Edit content
- Delete content
- Reorder content where supported
- Enable/disable sections or items
- Manage images
- Manage project information
- Manage education
- Manage certifications
- Manage skills
- Manage gallery
- Manage contact information
- Manage footer content
- Manage Hero Visual Preview content

### Important CMS principle

The Admin Portal controls **content**, not the visual design.

The existing portfolio UI remains controlled by the HTML/CSS/JavaScript implementation.

This prevents content changes from accidentally changing:

- Card dimensions
- Colors
- Typography
- Layout
- Borders
- Shadows
- Animations
- Responsive breakpoints

## 🔄 Data Flow

CMS-controlled content follows:

```text
Admin Portal
     ↓
Persistent Data Source
     ↓
Main Portfolio
```

Real-time platform statistics follow:

```text
External Platform API
     ↓
Developer Presence
     ↓
Main Portfolio
```

The interactive map remains powered by its required map implementation/service.

## 🎨 Design Principles

The public website and Admin Portal follow the same visual identity.

The design emphasizes:

- Premium appearance
- Clean layouts
- Consistent spacing
- Responsive design
- Subtle interactions
- Clear typography
- Consistent cards and components
- Minimal unnecessary decoration

The Admin Portal should feel like a natural extension of the main website rather than a completely unrelated dashboard.

## 📱 Responsive Design

The website is designed for:

- Desktop
- Laptop
- Tablet
- Mobile
- Small mobile screens

Interactive effects such as cursor-based 3D interactions should be simplified or disabled on touch devices and should respect reduced-motion preferences.

## ⚙️ Setup

Because the portfolio uses HTML, CSS, and Vanilla JavaScript, the frontend can be served using a standard static web server.

Example:

```bash
git clone <repository-url>
cd <project-directory>
```

Then open the project through a local development server.

For example, using VS Code Live Server or another local HTTP server.

## 🌐 Central Cloud Persistence & Multi-Device Synchronization

To ensure that edits made in the Admin Portal persist to a central production data store and are reflected consistently across **every device and browser worldwide**, the backend supports multiple cloud database adapters with automatic failover:

| Provider | Supported Environment Variables | Description |
| :--- | :--- | :--- |
| **Vercel KV / Upstash Redis** *(Recommended)* | `KV_REST_API_URL`<br>`KV_REST_API_TOKEN` | 1-Click setup via Vercel Dashboard &rarr; Storage &rarr; Create KV Database. |
| **GitHub Gist Sync** *(Zero extra DB)* | `GITHUB_GIST_ID`<br>`GITHUB_TOKEN` | Automatically reads and writes `portfolio_data.json` directly to a GitHub Gist. |
| **Supabase REST** | `SUPABASE_URL`<br>`SUPABASE_SERVICE_ROLE_KEY` | Connects to a Supabase Postgres key-value table. |
| **JSONBin.io** | `JSONBIN_BIN_ID`<br>`JSONBIN_API_KEY` | Cloud JSON document store. |
| **Local Disk** | *(Automatic during local dev)* | Saves to `.data/portfolio_data.json` during `node server.js` testing. |

### How Multi-Device Consistency Works
1. When you save changes in the Admin Portal, a request is sent to `/api/data`.
2. The serverless API updates the configured central cloud database (Upstash Redis, Supabase, GitHub Gist, etc.).
3. When any device or browser loads or updates the portfolio, `PortfolioData.init()` fetches the latest state from `/api/data` with cache-busting headers (`no-store`), ensuring zero stale-cache lag and seamless global reflection.

## 🔑 Environment & Security

Never commit:

- Admin passwords
- API keys
- Access tokens
- Database credentials
- Private environment variables

Authentication credentials must be securely stored and passwords must be hashed when handled by a backend.

Frontend code must never expose private API credentials.

## 🧪 Testing Checklist

Before deployment, verify:

- [ ] Admin login works
- [ ] Unauthorized users cannot access protected admin functionality
- [ ] Admin logout works
- [ ] Create operation works
- [ ] Read operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Changes persist after refresh
- [ ] Admin changes appear on the main portfolio
- [ ] API-driven statistics continue working
- [ ] GitHub activity renders correctly
- [ ] Map works correctly
- [ ] Hero typing animation works
- [ ] Hero tilt interaction works
- [ ] Gallery works
- [ ] Contact section works
- [ ] Footer works
- [ ] No console errors
- [ ] No broken links
- [ ] No missing assets
- [ ] No horizontal overflow
- [ ] Mobile layout works correctly
- [ ] Reduced-motion behavior works correctly

## 🚀 Deployment

The frontend can be deployed on any platform capable of serving static HTML/CSS/JavaScript.

If the Admin Portal uses a backend/database, deploy the backend separately or through the same hosting platform according to the project's architecture.

Before production deployment:

1. Configure production environment variables.
2. Secure the Admin authentication system.
3. Verify database connectivity.
4. Verify API integrations.
5. Test all CRUD operations.
6. Test the public website after Admin updates.
7. Remove development/debugging credentials and logs.

## 📌 Project Goals

The portfolio is intended to:

- Showcase technical expertise
- Present projects and achievements
- Provide professional and coding profiles
- Demonstrate AI/ML, Data, and Web interests
- Provide an easy way to connect
- Provide a maintainable Admin CMS for portfolio updates

## 👤 Author

**Akash Verma**

AI/ML · Data · Web

Based in India

Currently building **MOODIX**.

## 📄 License

Add the project's preferred license here if the repository is intended to be publicly distributed.

---

Built with HTML, CSS, and Vanilla JavaScript.
