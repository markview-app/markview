# Upgrade Guide: From Open-Source to Full Extension

This guide helps you migrate from the open-source edition to the full MarkView extension available on Chrome Web Store.

---

## Why Upgrade?

The full MarkView extension includes powerful productivity features not available in the open-source edition:

### 🚀 **Productivity Boost**

- **Auto-Refresh** - Live preview updates when files change (perfect for writing)
- **Folder Browser** - Navigate your entire markdown project structure
- **Folder Search** - Search content across all markdown files in a folder
- **Folder Bookmarks** - Quick access to frequently used directories
- **Recent Documents** - Instantly reopen your last 100 markdown files

### 🎨 **Enhanced Experience**

- **14 Syntax Highlighting Themes** - Customize code block appearance
- **Advanced TOC** - Collapsible headings up to H6 with scroll sync
- **Font Customization** - Choose from 9 beautiful font families
- **Resizable Sidebars** - Adjust sidebar widths to your preference
- **Image Viewer** - Professional lightbox with zoom, pan, and gallery navigation
- **Reading Progress Bar** - Visual indicator of your position in the document

### 📄 **Export & Presentation**

- **HTML Export** - Convert markdown to clean HTML
- **DOCX Export** - Convert to Microsoft Word format
- **Presentation Mode** - Turn markdown into slideshows

### 🌐 **Multi-Language Support**

- Interface available in **12 languages**: English, Vietnamese, German, Spanish, French, Indonesian, Japanese, Korean, Portuguese, Russian, Chinese (Simplified & Traditional)

### ⚡ **Convenience**

- **Automatic Updates** - Always get the latest features and bug fixes
- **One-Click Installation** - No build process required
- **Chrome Web Store Integration** - Trusted and verified by Google

---

## Installation Steps

### Step 1: Install from Chrome Web Store

Choose your browser:

#### **For Chrome / Chromium / Brave / Opera**

1. Visit [Chrome Web Store - MarkView](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)
2. Click **"Add to Chrome"**
3. Confirm by clicking **"Add extension"**

#### **For Microsoft Edge**

1. Visit [Edge Add-ons - MarkView](https://microsoftedge.microsoft.com/addons/detail/kpobglkjeapfinbaecjidahlnnohcaed)
2. Click **"Get"**
3. Confirm by clicking **"Add extension"**

### Step 2: Enable File URL Access

To view local markdown files, you must enable file access:

1. Navigate to `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Find **MarkView** in the extension list
3. Click **"Details"**
4. Scroll down to **"Allow access to file URLs"**
5. Toggle the switch to **ON**

### Step 3: Remove Open-Source Edition (Optional)

If you manually loaded the open-source edition:

1. Go to `chrome://extensions/`
2. Find the manually loaded "MarkView" extension
3. Click **"Remove"**
4. Confirm removal

**Note**: Removing the open-source edition will not affect the full extension.

---

## Configuration Migration

### ⚠️ **Important: Settings Are Not Migrated**

The open-source edition and full extension store settings separately. You'll need to reconfigure:

- Theme preference (Light/Dark/Auto)
- Custom CSS (if you added any)
- Plugin configuration (if you modified)

**Settings NOT affected**:

- Browser permissions (you'll need to re-grant file URL access)
- Recent documents (full extension starts with empty history)

---

## Getting Help

### Support Resources

- **FAQ & Documentation**: [getmarkview.com/support](https://getmarkview.com/support)
- **Bug Reports**: [GitHub Issues](https://github.com/markview-app/support/issues/new?template=bug_report.yml)
- **Feature Requests**: [GitHub Issues](https://github.com/markview-app/support/issues/new?template=feature_request.yml)
- **Questions**: [GitHub Discussions](https://github.com/markview-app/support/discussions)

### Before Contacting Support

1. Check if your issue is addressed in the [FAQ](https://getmarkview.com/support)
2. Search [existing GitHub issues](https://github.com/markview-app/support/issues)
3. Try disabling other extensions to rule out conflicts
4. Check browser console for errors (F12 → Console tab)

---

## Troubleshooting

### Extension Not Working After Installation

**Solution**:

1. Ensure "Allow access to file URLs" is enabled in extension settings
2. Refresh the markdown file tab (press F5)
3. Try opening a different markdown file
4. Check if the URL ends with `.md`, `.markdown`, or `.mdx`

### Features Missing After Upgrade

**Solution**:

1. Verify you installed the full extension (check version in popup)
2. Some features require PRO license (check License tab in popup)
3. Ensure you're viewing a markdown file (not HTML rendered version)

### Cannot Activate PRO License

**Solution**:

1. Verify you copied the complete license key from email
2. Check your internet connection (activation requires online access)
3. Try again in a few minutes (API rate limiting)
4. Contact support with your order number

---

## Stay Updated

### Subscribe to Updates

- **GitHub Releases**: [Watch releases](https://github.com/markview-app/support/releases)
- **Website**: [getmarkview.com/whats-new](https://getmarkview.com/whats-new)
- **Twitter**: Follow development updates (link on website)

### Changelog

See the [Chrome Web Store listing](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien) for the latest update notes.

---

## Feedback

We'd love to hear from you!

- ⭐ **Leave a review** on [Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)
- 💬 **Share feedback** in [GitHub Discussions](https://github.com/markview-app/support/discussions)
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/markview-app/support/issues)
- 📧 **Contact us** via the support email

---

**Ready to upgrade?** [Install MarkView from Chrome Web Store](https://chromewebstore.google.com/detail/cfopbpknalachedpcddhgbgjoigklien)

---

**Last Updated**: January 2026
