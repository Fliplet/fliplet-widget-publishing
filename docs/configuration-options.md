# Widget Configuration Options

This document provides comprehensive details about all configuration options available for the Publishing Widget.

## 📋 Configuration Overview

The Publishing Widget supports both **Studio Configuration** (set by developers/admins) and **Runtime Configuration** (determined by the Fliplet environment).

### Configuration Hierarchy

```
Environment Variables (Fliplet.Env)
    ↓
Widget Data (Fliplet.Widget.getData)
    ↓
Default Values (hardcoded fallbacks)
```

## ⚙️ Studio Configuration Options

These options are configured in Fliplet Studio through the widget's interface panel.

### Basic Settings

#### `title` (String)
- **Default:** `"Publish Your App"`
- **Description:** Main heading displayed at the top of the widget
- **Example:**
```json
{
  "title": "Deploy to App Stores"
}
```

#### `helpText` (String)
- **Default:** `"Choose the platform where you want to publish your app"`
- **Description:** Instructional text shown below the title
- **Example:**
```json
{
  "helpText": "Select your target platform to begin the publishing process"
}
```

### Platform Enablement

#### `showIOS` (Boolean)
- **Default:** `true`
- **Description:** Enable/disable iOS publishing option
- **Impact:** 
  - When `false`: iOS platform card is hidden
  - When `true`: Shows iOS platform with requirements
- **Example:**
```json
{
  "showIOS": false
}
```

#### `showAndroid` (Boolean)
- **Default:** `true`
- **Description:** Enable/disable Android publishing option
- **Impact:**
  - When `false`: Android platform card is hidden
  - When `true`: Shows Android platform with requirements
- **Example:**
```json
{
  "showAndroid": true
}
```

**Validation:** At least one platform must be enabled (`showIOS` OR `showAndroid` must be `true`)

### Regional Settings

#### `region` (String)
- **Default:** `"eu"`
- **Options:** `"eu"`, `"us"`, `"ca"`
- **Description:** Determines which API region to use
- **Impact:**
  - API endpoint selection
  - Data residency compliance
  - Performance optimization
- **Example:**
```json
{
  "region": "us"
}
```

**Regional Endpoints:**
| Region | Studio API | Web API | Description |
|--------|------------|---------|-------------|
| `eu` | `https://api.fliplet.com/` | `https://apps.fliplet.com/` | Europe |
| `us` | `https://us.api.fliplet.com/` | `https://us-apps.fliplet.com/` | United States |
| `ca` | `https://ca.api.fliplet.com/` | `https://ca-apps.fliplet.com/` | Canada |

## 🔧 Runtime Configuration

These values are determined by the Fliplet environment and cannot be modified through the widget interface.

### Application Settings

#### `appId` (Number)
- **Source:** `Fliplet.Env.get('appId')`
- **Required:** Yes
- **Description:** Unique identifier for the Fliplet app
- **Usage:** All API calls use this to identify the target app

#### `apiToken` (String)
- **Source:** `Fliplet.Env.get('apiToken')`
- **Required:** Yes
- **Description:** Authentication token for API access
- **Format:** Region-prefixed token (e.g., `eu--session--...`)

#### `apiUrl` (String)
- **Source:** `Fliplet.Env.get('apiUrl')`
- **Required:** No
- **Description:** Override for API base URL
- **Usage:** Allows custom API endpoint configuration

#### `mode` (String)
- **Source:** `Fliplet.Env.get('mode')`
- **Options:** `"studio"`, `"view"`
- **Description:** Determines which API endpoints to use
- **Default:** `"studio"`

## 🎨 Advanced Configuration

### Custom Styling

#### CSS Variables Override
```css
.publishing-widget-container {
  --primary-color: #007bff;     /* Main brand color */
  --primary-hover: #0056b3;     /* Hover state color */
  --success-color: #28a745;     /* Success indicators */
  --danger-color: #dc3545;      /* Error indicators */
  --warning-color: #ffc107;     /* Warning indicators */
  --info-color: #17a2b8;        /* Info indicators */
  --border-radius: 4px;         /* Button/card roundness */
  --spacing-md: 1rem;           /* Standard spacing */
}
```

#### Platform Card Customization
```json
{
  "platformCards": {
    "ios": {
      "icon": "📱",
      "title": "iOS App Store",
      "description": "Publish to Apple's App Store",
      "color": "#007AFF"
    },
    "android": {
      "icon": "🤖",
      "title": "Google Play Store", 
      "description": "Publish to Google Play Store",
      "color": "#3DDC84"
    }
  }
}
```

### Workflow Customization

#### Step Configuration
```json
{
  "workflow": {
    "ios": {
      "steps": [
        {
          "id": "api-key",
          "name": "API Key",
          "required": true,
          "icon": "🔑"
        },
        {
          "id": "bundle-cert",
          "name": "Bundle & Certificate",
          "required": true,
          "icon": "📜"
        },
        {
          "id": "push-config",
          "name": "Push Config",
          "required": false,
          "icon": "📲"
        },
        {
          "id": "metadata",
          "name": "App Store Listing",
          "required": true,
          "icon": "📝"
        },
        {
          "id": "build",
          "name": "Build",
          "required": true,
          "icon": "🔨"
        }
      ]
    }
  }
}
```

### Debug Configuration

#### `debug` (Boolean)
- **Default:** `false`
- **Description:** Enable detailed console logging
- **Example:**
```json
{
  "debug": true,
  "logLevel": "verbose"
}
```

#### `mockMode` (Boolean)
- **Default:** `false`
- **Description:** Use mock data instead of real API calls
- **Usage:** Development and testing
- **Example:**
```json
{
  "mockMode": true,
  "mockDelay": 1000
}
```

## 📊 Configuration Validation

### Required Configuration Check

```javascript
function validateConfiguration(config) {
  const errors = [];
  
  // Platform validation
  if (!config.showIOS && !config.showAndroid) {
    errors.push('At least one platform must be enabled');
  }
  
  // Region validation
  const validRegions = ['eu', 'us', 'ca'];
  if (config.region && !validRegions.includes(config.region)) {
    errors.push(`Invalid region: ${config.region}. Must be one of: ${validRegions.join(', ')}`);
  }
  
  // Title validation
  if (config.title && config.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

### Environment Validation

```javascript
function validateEnvironment() {
  const required = ['appId', 'apiToken'];
  const missing = required.filter(key => !Fliplet.Env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate app ID format
  const appId = Fliplet.Env.get('appId');
  if (isNaN(appId) || appId <= 0) {
    throw new Error('Invalid app ID format');
  }
  
  // Validate token format
  const token = Fliplet.Env.get('apiToken');
  if (!token || !token.includes('--')) {
    throw new Error('Invalid API token format');
  }
}
```

## 🔄 Dynamic Configuration

### Runtime Configuration Updates

```javascript
// Update configuration during widget lifecycle
function updateWidgetConfig(newConfig) {
  const currentConfig = Fliplet.Widget.getData();
  const mergedConfig = { ...currentConfig, ...newConfig };
  
  // Validate new configuration
  const validation = validateConfiguration(mergedConfig);
  if (!validation.valid) {
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Apply configuration
  return Fliplet.Widget.save(mergedConfig);
}
```

### Responsive Configuration

```javascript
// Adjust configuration based on screen size
function getResponsiveConfig() {
  const isMobile = window.innerWidth <= 768;
  
  return {
    platformCards: {
      layout: isMobile ? 'vertical' : 'horizontal',
      showDescriptions: !isMobile
    },
    steps: {
      showLabels: !isMobile,
      compactMode: isMobile
    }
  };
}
```

## 🎯 Configuration Scenarios

### Scenario 1: iOS-Only Organization

```json
{
  "title": "Publish to App Store",
  "showIOS": true,
  "showAndroid": false,
  "region": "us",
  "helpText": "Your app will be published to the iOS App Store",
  "workflow": {
    "skipPlatformSelection": true,
    "autoSelectPlatform": "ios"
  }
}
```

### Scenario 2: Enterprise Multi-Region

```json
{
  "title": "Enterprise App Deployment",
  "showIOS": true,
  "showAndroid": true,
  "region": "eu",
  "helpText": "Deploy your enterprise application",
  "advanced": {
    "enableBulkDeployment": true,
    "requireApproval": true,
    "customDomains": ["enterprise.company.com"]
  }
}
```

### Scenario 3: Development Environment

```json
{
  "title": "App Publishing (Development)",
  "showIOS": true,
  "showAndroid": true,
  "region": "eu",
  "debug": true,
  "mockMode": true,
  "helpText": "Development environment - using mock data",
  "development": {
    "showDebugInfo": true,
    "enableTestMode": true,
    "mockDelay": 500
  }
}
```

## 🔐 Security Configuration

### Access Control

```json
{
  "security": {
    "requireTwoFactor": true,
    "allowedDomains": ["company.com", "subsidiary.com"],
    "sessionTimeout": 3600,
    "auditLogging": true
  }
}
```

### API Security

```json
{
  "api": {
    "rateLimiting": {
      "enabled": true,
      "requestsPerMinute": 60
    },
    "encryption": {
      "enforceHTTPS": true,
      "validateCertificates": true
    }
  }
}
```

## 🧪 Testing Configuration

### Test Environment Setup

```json
{
  "testing": {
    "mockResponses": {
      "apiKeys": [
        {
          "id": "test-key-1",
          "name": "Test API Key",
          "keyId": "TEST123",
          "teamId": "test-team"
        }
      ],
      "bundleIds": [
        {
          "id": "test-bundle-1",
          "identifier": "com.test.app",
          "name": "Test App"
        }
      ]
    },
    "simulateErrors": {
      "apiKeyValidation": false,
      "certificateGeneration": false,
      "buildProcess": false
    }
  }
}
```

### Performance Testing

```json
{
  "performance": {
    "enableMetrics": true,
    "measureAPILatency": true,
    "trackUserInteractions": true,
    "reportingInterval": 30000
  }
}
```

## 📱 Platform-Specific Configuration

### iOS Configuration

```json
{
  "ios": {
    "certificates": {
      "autoGenerate": true,
      "allowCustomUpload": true,
      "validateExpiry": true
    },
    "bundleIds": {
      "filterByTeam": true,
      "showOnlyActiveApps": false
    },
    "buildOptions": {
      "enableBitcode": true,
      "optimizeForSize": false
    }
  }
}
```

### Android Configuration

```json
{
  "android": {
    "keystore": {
      "requireUpload": false,
      "autoGenerate": true,
      "validateSignature": true
    },
    "bundleId": {
      "autoGenerate": true,
      "enforceNaming": true,
      "pattern": "com.{org}.{app}"
    },
    "buildOptions": {
      "enableR8": true,
      "minifyCode": true
    }
  }
}
```

## 📈 Analytics Configuration

### Usage Tracking

```json
{
  "analytics": {
    "enabled": true,
    "trackSteps": true,
    "trackErrors": true,
    "trackPerformance": true,
    "reportingEndpoint": "/analytics/publishing-widget",
    "samplingRate": 1.0
  }
}
```

### Custom Events

```json
{
  "customEvents": {
    "platformSelected": {
      "enabled": true,
      "properties": ["platform", "timestamp", "userId"]
    },
    "buildCompleted": {
      "enabled": true,
      "properties": ["platform", "duration", "success"]
    }
  }
}
```

## 🔧 Migration and Versioning

### Configuration Schema Version

```json
{
  "schemaVersion": "1.0.0",
  "migration": {
    "from": "0.9.0",
    "changes": [
      "Added region configuration",
      "Renamed 'enableIOS' to 'showIOS'",
      "Added platform-specific settings"
    ]
  }
}
```

### Backward Compatibility

```javascript
function migrateConfiguration(config) {
  // Handle legacy configuration formats
  if (config.enableIOS !== undefined) {
    config.showIOS = config.enableIOS;
    delete config.enableIOS;
  }
  
  if (config.enableAndroid !== undefined) {
    config.showAndroid = config.enableAndroid;
    delete config.enableAndroid;
  }
  
  // Set schema version
  config.schemaVersion = "1.0.0";
  
  return config;
}
```

This comprehensive configuration guide provides all the details needed to properly configure the Publishing Widget for various use cases and environments.