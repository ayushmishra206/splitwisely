# SplitWisely - Static Website

A modern, responsive static website for SplitWisely, a smart expense sharing application. This website showcases the features and benefits of the app with a clean, professional design.

## 🌟 Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern UI/UX**: Clean, contemporary design with smooth animations
- **Interactive Elements**: Mobile navigation, smooth scrolling, and hover effects
- **Performance Optimized**: Fast loading with optimized CSS and JavaScript
- **Accessibility**: Semantic HTML and keyboard navigation support
- **Cross-browser Compatible**: Works on all modern browsers

## 📁 Project Structure

```
splitwisely/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - this is a static website

### Running the Website

1. **Download or Clone**: Get the project files to your local machine
2. **Open in Browser**: Simply double-click `index.html` or right-click and "Open with" your preferred browser
3. **Live Server (Optional)**: For development, use a live server extension in your code editor

### Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. The website will open at `http://localhost:5500`

## 🎨 Design Features

### Color Scheme
- **Primary**: Blue (#3b82f6)
- **Secondary**: Green (#10b981)
- **Accent**: Amber (#f59e0b)
- **Text**: Dark gray (#1f2937)
- **Background**: White and light gray variants

### Typography
- **Font Family**: Inter (Google Fonts)
- **Responsive Text**: Fluid typography that scales with screen size
- **Hierarchy**: Clear heading structure for accessibility

### Sections
1. **Hero Section**: Eye-catching introduction with key statistics
2. **Features**: Six key features with icons and descriptions
3. **How It Works**: Three-step process explanation
4. **Pricing**: Three-tier pricing table
5. **Contact**: Contact form and information
6. **Footer**: Links and social media

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## ⚡ Performance Features

- **CSS Variables**: Consistent theming and easy customization
- **Optimized Images**: Placeholder for future image optimization
- **Debounced Scroll**: Performance-optimized scroll event handling
- **Lazy Loading**: Ready for image lazy loading implementation
- **Minification Ready**: Code structure ready for minification

## 🛠️ Customization

### Colors
Update CSS variables in `styles.css`:
```css
:root {
    --primary-color: #3b82f6;
    --secondary-color: #10b981;
    /* ... other variables */
}
```

### Content
Edit the content directly in `index.html`:
- Company name and branding
- Feature descriptions
- Pricing tiers
- Contact information

### Styling
Modify `styles.css` to change:
- Layout and spacing
- Typography
- Colors and themes
- Responsive breakpoints

## 📧 Contact Form

The contact form includes:
- **Client-side Validation**: Email format and required field validation
- **User Feedback**: Success/error notifications
- **Responsive Design**: Mobile-friendly form layout

**Note**: The form currently shows a success message but doesn't actually send emails. To make it functional, you'll need to:
1. Add a backend service (Node.js, PHP, etc.)
2. Integrate with an email service (SendGrid, Mailgun, etc.)
3. Or use a form service (Netlify Forms, Formspree, etc.)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or support:
- Email: support@splitwisely.com
- Create an issue in this repository
- Check the documentation in the code comments

## 🔄 Future Enhancements

- [ ] Add blog section
- [ ] Implement dark mode
- [ ] Add more animations
- [ ] Include testimonials section
- [ ] Add language localization
- [ ] Integrate with analytics
- [ ] Add more interactive elements

---

**Built with ❤️ for SplitWisely**