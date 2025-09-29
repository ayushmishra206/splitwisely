# SplitWisely - Expense Sharing Web App

A modern, responsive web application for splitting expenses with friends, family, and roommates. Built with vanilla JavaScript, this PWA (Progressive Web App) runs entirely in the browser with offline support and localStorage persistence.

## 🌟 Features

### Core Functionality
- **Group Management**: Create and manage expense groups
- **Smart Expense Tracking**: Add expenses with flexible split methods
- **Balance Calculations**: Automatic calculation of who owes whom
- **Settlement Optimization**: Minimize the number of transactions needed
- **Data Persistence**: All data stored locally in browser

### User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes
- **PWA Support**: Install as an app on mobile devices
- **Offline Capable**: Works without internet connection
- **Export/Import**: Backup and restore data as JSON

### Split Methods
- **Equal Split**: Divide expenses equally among members
- **Custom Split**: Specify exact amounts for each person
- **Flexible Members**: Add/remove people from specific expenses

## 📁 Project Structure

```
splitwisely/
├── index.html          # Main application HTML
├── styles.css          # Complete CSS with dark mode
├── script.js           # Full JavaScript application
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
└── README.md          # This documentation
```

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)
1. **Fork this repository** on GitHub
2. **Enable GitHub Pages** in repository settings
3. **Access your app** at `https://yourusername.github.io/splitwisely`

### Option 2: Local Development
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/splitwisely.git
   cd splitwisely
   ```

2. **Open in browser**: Double-click `index.html` or use a local server

3. **Live Server (VS Code)**:
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"
   - App opens at `http://localhost:5500`

### Option 3: Deploy to Other Platforms
- **Netlify**: Drag and drop the folder to Netlify
- **Vercel**: Import the GitHub repository
- **GitHub Codespaces**: Open directly in browser IDE

## 🎯 How to Use

### 1. Create Your First Group
- Click "Create Group" on the dashboard
- Add group name and description
- Add members (friends, roommates, etc.)
- Save the group

### 2. Add Expenses
- Click "Add Expense" button
- Enter description and amount
- Select who paid
- Choose split method (equal or custom)
- Save the expense

### 3. View Balances
- Go to "Balances" tab
- See who owes whom
- Click "Settle" to mark debts as paid
- Optimized settlements minimize transactions

### 4. Manage Data
- **Export**: Backup data as JSON file
- **Import**: Restore from backup
- **Dark Mode**: Toggle in header
- **Mobile**: Works perfectly on phones

## 🏗️ Technical Architecture

### Frontend Stack
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Modern layout with CSS Grid/Flexbox
- **Vanilla JavaScript**: No frameworks - fast and lightweight
- **localStorage**: Client-side data persistence
- **Service Worker**: Offline functionality and caching

### Key Features
- **Mobile-First**: Responsive design optimized for mobile
- **Dark Mode**: Automatic theme switching with persistence
- **PWA**: Installable with offline support
- **Performance**: Optimized for fast loading and smooth interactions
- **Accessibility**: WCAG compliant with keyboard navigation

## 💾 Data Management

### Storage
- All data stored in browser's localStorage
- No external database required
- Data persists across browser sessions
- Export/import for backup and migration

### Data Structure
```javascript
{
  groups: [
    {
      id: "unique-id",
      name: "Trip to Paris",
      description: "Summer vacation",
      members: ["Alice", "Bob", "Charlie"],
      createdAt: "2025-01-01T00:00:00.000Z"
    }
  ],
  expenses: [
    {
      id: "unique-id",
      description: "Hotel booking",
      amount: 300.00,
      groupId: "group-id",
      paidBy: "Alice",
      splits: {
        "Alice": 100.00,
        "Bob": 100.00,
        "Charlie": 100.00
      },
      date: "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## 🎨 Customization

### Theme Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #3b82f6;      /* Blue */
    --secondary-color: #10b981;    /* Green */
    --danger-color: #ef4444;       /* Red */
    --warning-color: #f59e0b;      /* Amber */
}
```

### Adding New Features
1. **New Views**: Add to navigation and create view HTML
2. **Data Fields**: Extend data models in JavaScript
3. **Calculations**: Modify balance calculation functions
4. **UI Components**: Create reusable components

## 🚀 Deployment

### GitHub Pages (Automatic)
1. **Push to main branch** - Deployment is automatic
2. **GitHub Actions** will build and deploy
3. **Access your app** at your GitHub Pages URL

### Manual Deployment
Works on any static hosting service:
- **Netlify**: Drag folder or connect Git
- **Vercel**: Import repository
- **Firebase Hosting**: `firebase deploy`
- **AWS S3**: Upload files to bucket
- **Any Web Server**: Upload files to public directory

### Environment Setup
No build process required! Just upload these files:
- `index.html`
- `styles.css`
- `script.js`
- `manifest.json`
- `sw.js`

## 🌐 Browser Support

- **Chrome**: Full support with PWA features
- **Firefox**: Full support
- **Safari**: Full support (iOS 14+ for PWA)
- **Edge**: Full support with PWA features
- **Mobile**: Optimized for all mobile browsers

## 📱 PWA Features

- **Installable**: Add to home screen on mobile
- **Offline Work**: Use without internet
- **App-like**: Runs in standalone mode
- **Fast Loading**: Cached resources for speed

## 🔒 Privacy & Security

- **No Data Collection**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **Secure**: HTTPS required for PWA features
- **Local Storage**: Data never leaves your browser

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Make** your changes
4. **Test** thoroughly on mobile and desktop
5. **Submit** a pull request

### Development Guidelines
- Keep code vanilla JavaScript (no frameworks)
- Maintain mobile-first responsive design
- Test in multiple browsers
- Follow existing code style
- Update documentation

## 📄 License

This project is open source under the [MIT License](LICENSE).

## 🔄 Roadmap

### Phase 1 ✅
- [x] Core expense splitting functionality
- [x] Group management
- [x] Balance calculations
- [x] Dark mode support
- [x] PWA features
- [x] Export/import data

### Phase 2 🚧
- [ ] Receipt photo uploads
- [ ] Expense categories
- [ ] Payment integrations
- [ ] Multi-currency support
- [ ] Email notifications
- [ ] Advanced reporting

### Phase 3 📋
- [ ] Real-time sync (WebRTC/Firebase)
- [ ] User accounts and authentication
- [ ] Mobile apps (React Native)
- [ ] API for third-party integrations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/splitwisely/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/splitwisely/discussions)
- **Email**: Create an issue for support

---

**Built with ❤️ using vanilla web technologies**

> A lightweight, fast, and privacy-focused alternative to expensive expense-sharing apps.