# Fliplet Publishing Widget

A comprehensive widget for publishing Fliplet apps to iOS App Store and Google Play Store with guided workflows and automated submission management.

## 🚀 Overview

The Publishing Widget provides a complete end-to-end solution for app publishing, featuring:

- **Guided Workflows**: Step-by-step processes for iOS and Android publishing
- **Platform Selection**: Visual interface for choosing publishing targets
- **API Integration**: Full integration with Apple App Store Connect and Google Play Console
- **State Management**: Automatic progress tracking and resumable workflows
- **Error Handling**: Comprehensive error reporting and recovery options
- **Multi-Region Support**: EU, US, and Canada API endpoints

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Workflows](#workflows)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## 🚀 Quick Start

### 1. Add Widget to Your App

1. In Fliplet Studio, go to **Widgets** > **Add Widget**
2. Search for "Publishing" and select the Publishing Widget
3. Configure the widget settings (platforms, region, etc.)
4. Save and publish your app

### 2. Configure Publishing Settings

```javascript
// Widget configuration in Fliplet Studio
{
  "title": "Publish Your App",
  "showIOS": true,
  "showAndroid": true,
  "region": "eu",
  "helpText": "Choose the platform where you want to publish your app"
}
```

### 3. Set Up Prerequisites

**For iOS Publishing:**
- Apple Developer Account with API key access
- Valid distribution certificate
- App Bundle ID from App Store Connect
- App icons and splash screens

**For Android Publishing:**
- Google Play Console account
- Signing keystore (optional)
- App icons and splash screens
- Google Services configuration (for push notifications)

## 🔧 Installation

### Prerequisites

- Fliplet Studio access
- App with publishing requirements configured
- Proper API credentials for target platforms

### Widget Dependencies

The widget automatically includes:
- `jquery` - DOM manipulation and events
- `bootstrap` - UI components and styling
- `publishing-service.js` - Core publishing functionality
- `build.css` - Widget styling

## ⚙️ Configuration

### Widget Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `title` | String | "Publish Your App" | Main widget title |
| `showIOS` | Boolean | `true` | Enable iOS publishing |
| `showAndroid` | Boolean | `true` | Enable Android publishing |
| `region` | String | "eu" | API region (eu/us/ca) |
| `helpText` | String | Platform selection help | User guidance text |

### Environment Configuration

The widget reads from Fliplet environment:

```javascript
{
  appId: Fliplet.Env.get('appId'),        // Required: App identifier
  apiToken: Fliplet.Env.get('apiToken'), // Required: Authentication token
  region: Fliplet.Env.get('region'),     // Optional: API region override
  apiUrl: Fliplet.Env.get('apiUrl')      // Optional: Custom API base URL
}
```

## 🔄 Workflows

### iOS Publishing Workflow

The iOS publishing process follows these steps:

#### Step 1: Platform Selection
- User selects iOS platform
- Widget checks for existing submissions
- Displays platform requirements

#### Step 2: API Key Configuration
- Lists available API keys from organization
- Allows creation of new API keys
- Validates API key credentials
- Creates submission with selected team

#### Step 3: Bundle ID & Certificate Management
- Checks certificate validity
- Generates or uploads certificates
- Fetches available Bundle IDs
- Validates Bundle ID details and version

#### Step 4: Store Configuration
- Collects Bundle ID and version information
- Validates version format (n.n.n or n.n)
- Submits store configuration to API

#### Step 5: Push Notifications (Optional)
- Checks app-level push configuration
- Checks team-level push settings
- Configures push notifications if needed
- Submits push configuration

#### Step 6: App Store Listing
- Collects app metadata (name, description, etc.)
- Handles image uploads (app icon, splash screen)
- Validates required fields
- Submits metadata to submission

#### Step 7: Build Trigger
- Validates all previous steps completed
- Triggers app build process
- Monitors build progress
- Handles build completion or failure

### Android Publishing Workflow

#### Step 1: Platform Selection
- User selects Android platform
- Widget checks for existing submissions

#### Step 2: Bundle ID & Keystore
- Auto-generates Bundle ID from org + app name
- Optional keystore upload with password
- Submits store configuration with version code

#### Step 3: Push Notifications (Optional)
- App-specific Google Services configuration
- File upload for Google Services JSON
- Push notification setup

#### Step 4: App Store Listing
- Same as iOS: metadata and image handling
- Submits to Google Play Store format

#### Step 5: Build Trigger
- Same as iOS: build process management

## 📊 State Management

### Submission States

| State | Description | Next Action |
|-------|-------------|-------------|
| `null` | No submission exists | Create new submission |
| `started` + `INITIALIZED` | API key configured | Continue to certificates |
| `started` + `STORE_CONFIG_SUBMITTED` | Store config done | Continue to push config |
| `started` + `PUSH_NOTIFICATION_CONFIGURED` | Push config done | Continue to metadata |
| `started` + `METADATA_SUBMITTED` | Ready for build | Trigger build |
| `started` + `BUILD_TRIGGERED` | Build in progress | Monitor build |
| `completed` | Build successful | View results |
| `failed` | Build failed | Retry or debug |
| `cancelled` | Build cancelled | Create new submission |

### Data Persistence

The widget automatically:
- Saves form data during API errors
- Preserves submission state across sessions
- Tracks workflow progress
- Enables resumable publishing flows

## 🛠️ API Reference

### Core Service Methods

#### Initialization
```javascript
// Initialize app for publishing
await service.initializeApp()

// Get submission state
await service.getSubmissionState(platform)

// Create new submission
await service.createSubmission(platform, teamId)
```

#### iOS-Specific Methods
```javascript
// API Key management
await service.getAPIKeys()
await service.createAPIKey(keyData)
await service.validateAPIKey(keyData)

// Certificate management
await service.checkCertificate(teamId)
await service.generateCertificate(teamId)
await service.uploadCertificate(teamId, certData)

// Bundle ID management
await service.getBundleIDs(teamId)
await service.getBundleIDDetails(bundleId, teamId)
```

#### Common Methods
```javascript
// Store configuration
await service.submitStoreConfig(submissionId, storeData, platform)

// Push notifications
await service.getPushConfig()
await service.configurePushNotifications(config)

// Metadata and build
await service.uploadImages(imageFiles)
await service.submitMetadata(submissionId, metadata, hasNewSplash)
await service.triggerBuild(submissionId)
await service.cancelBuild(submissionId)
```

### Error Handling

The service provides structured error handling:

```javascript
try {
  await service.someMethod()
} catch (error) {
  if (error.message.includes('INVALID_API_KEY')) {
    // Handle invalid API key
  } else if (error.message.includes('certificate')) {
    // Handle certificate issues
  } else {
    // Generic error handling
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### API Key Problems
**Issue**: "Invalid API key" error
**Solution**: 
1. Verify API key credentials in Apple Developer portal
2. Check key permissions (App Store Connect access)
3. Ensure issuer ID is correct

#### Certificate Issues
**Issue**: Certificate validation fails
**Solution**:
1. Check certificate expiration
2. Verify team ID association
3. Try generating new certificate

#### Build Failures
**Issue**: Build process fails
**Solution**:
1. Check submission state consistency
2. Verify all required metadata submitted
3. Review build logs for specific errors

#### Network/API Issues
**Issue**: Connection timeouts or API errors
**Solution**:
1. Verify API region setting
2. Check authentication token validity
3. Retry with exponential backoff

### Debug Mode

Enable detailed logging:

```javascript
// Add to widget configuration
{
  "debug": true,
  "logLevel": "verbose"
}
```

### Support Logs

To get support logs:
1. Open browser developer tools
2. Go to Console tab
3. Look for "Publishing Widget" logs
4. Copy relevant error messages

## 🔧 Development

### File Structure

```
fliplet-widget-publishing/
├── README.md                    # This documentation
├── widget.json                  # Widget metadata
├── build.html                   # Main widget UI
├── interface.html               # Configuration UI
├── css/
│   └── build.css               # Widget styles
├── js/
│   ├── build.js                # Main widget logic
│   ├── interface.js            # Configuration logic
│   ├── publishing-service.js   # Core service
│   └── libs.js                 # Third-party libraries
├── img/
│   └── icon.png                # Widget icon
├── docs/                       # Additional documentation
│   ├── workflow-diagrams.md    # Visual workflow guides
│   ├── api-integration.md      # API integration details
│   └── troubleshooting.md      # Detailed troubleshooting
└── tests/
    └── index.js                # Widget tests
```

### Testing

```bash
# Run widget tests
npm test

# Test individual components
npm run test:service
npm run test:ui
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Documentation**: See `docs/` folder for detailed guides
- **Issues**: Report bugs via GitHub issues
- **Feature Requests**: Use GitHub discussions
- **Community**: Join Fliplet developer community

## 📄 License

This widget is part of the Fliplet platform and follows Fliplet's licensing terms.

---

**Version**: 1.0.0  
**Last Updated**: 2024-09-23  
**Compatibility**: Fliplet Studio 2024+