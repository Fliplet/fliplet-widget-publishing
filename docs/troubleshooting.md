# Troubleshooting Guide

This comprehensive guide covers common issues, their causes, and step-by-step solutions for the Publishing Widget.

## 🔍 Quick Diagnostics

### Widget Not Loading

**Symptoms:**
- Blank widget area
- JavaScript errors in console
- "Publishing service not found" errors

**Quick Checks:**
1. Verify widget.json includes publishing-service.js
2. Check browser console for JavaScript errors
3. Ensure Fliplet.Widget.instance is called correctly
4. Verify jQuery and Bootstrap dependencies

**Solution Steps:**
```javascript
// Check if dependencies are loaded
console.log('jQuery:', typeof $);
console.log('Fliplet:', typeof Fliplet);
console.log('PublishingService:', typeof PublishingService);

// Verify widget instance
console.log('Widget data:', Fliplet.Widget.getData());
```

### Platform Cards Not Responding

**Symptoms:**
- Clicking platform cards has no effect
- No visual feedback on selection
- Continue button remains disabled

**Debug Steps:**
```javascript
// Check event listeners
$('.platform-card').off('click').on('click', function() {
  console.log('Platform card clicked:', $(this).data('platform'));
});

// Verify CSS classes
console.log('Selected cards:', $('.platform-card.selected').length);
```

## 🍎 iOS-Specific Issues

### API Key Problems

#### Issue: "Invalid API key" Error

**Causes:**
- Incorrect key ID or issuer ID
- Private key format issues
- Expired or revoked API key
- Insufficient permissions

**Step-by-Step Solution:**

1. **Verify API Key Details in Apple Developer Portal:**
   ```
   - Go to https://developer.apple.com
   - Navigate to "Certificates, Identifiers & Profiles"
   - Select "Keys" from the sidebar
   - Find your API key and verify:
     * Key ID (10-character string)
     * Issuer ID (UUID format)
     * Key permissions include "App Store Connect API"
   ```

2. **Check Private Key Format:**
   ```
   -----BEGIN PRIVATE KEY-----
   [Base64 encoded key content]
   -----END PRIVATE KEY-----
   ```

3. **Test API Key Separately:**
   ```bash
   # Generate JWT token for testing
   curl -H "Authorization: Bearer [JWT_TOKEN]" \
        "https://api.appstoreconnect.apple.com/v1/apps"
   ```

4. **Common Fixes:**
   - Re-download private key from Apple Developer portal
   - Ensure no extra whitespace in key fields
   - Verify team membership and permissions
   - Check key expiration date

#### Issue: "No API Keys Found"

**Causes:**
- No API keys created in Apple Developer account
- Organization ID mismatch
- Network connectivity issues

**Solution:**
```javascript
// Debug organization ID
console.log('Organization ID:', service.organizationId);

// Test API endpoint directly
fetch(`${baseURL}v2/organizations/${orgId}/credentials/api-keys`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(response => response.json())
.then(data => console.log('API Keys response:', data));
```

### Certificate Issues

#### Issue: "Certificate validation failed"

**Symptoms:**
- Certificate check returns `isValid: false`
- Error messages about certificate expiration
- Unable to proceed to bundle ID selection

**Diagnostic Commands:**
```javascript
// Check certificate status
const certStatus = await service.checkCertificate(teamId);
console.log('Certificate status:', certStatus);

// Debug certificate details
console.log('Certificate expiry:', certStatus.certificate?.expiresAt);
console.log('Days until expiry:', 
  (new Date(certStatus.certificate?.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
);
```

**Solutions:**

1. **Certificate Expired:**
   ```javascript
   // Generate new certificate
   const newCert = await service.generateCertificate(teamId);
   console.log('New certificate:', newCert);
   ```

2. **Wrong Team ID:**
   ```javascript
   // Verify team ID from API key response
   const apiKeys = await service.getAPIKeys();
   console.log('Available teams:', apiKeys.apiKeys.map(key => key.teamId));
   ```

3. **Manual Certificate Upload:**
   ```javascript
   // Upload custom certificate
   const certData = {
     certificate: "-----BEGIN CERTIFICATE-----\n...",
     privateKey: "-----BEGIN PRIVATE KEY-----\n..."
   };
   await service.uploadCertificate(teamId, certData);
   ```

### Bundle ID Issues

#### Issue: "Bundle ID not found" or Empty List

**Causes:**
- No bundle IDs created in App Store Connect
- Team ID mismatch
- Bundle ID not associated with team

**Debug Steps:**
```javascript
// Check team ID consistency
console.log('Using team ID:', teamId);

// Test bundle ID API directly
const bundleIds = await service.getBundleIDs(teamId);
console.log('Bundle IDs found:', bundleIds.bundleIds.length);

// Check specific bundle ID
if (bundleIds.bundleIds.length > 0) {
  const details = await service.getBundleIDDetails(bundleIds.bundleIds[0].id, teamId);
  console.log('Bundle details:', details);
}
```

**Solutions:**

1. **Create Bundle ID in App Store Connect:**
   - Go to App Store Connect
   - Navigate to "Certificates, Identifiers & Profiles"
   - Create new Bundle ID with format: com.yourcompany.appname

2. **Verify Team Association:**
   - Ensure bundle ID is created under correct team
   - Check team permissions in Apple Developer portal

## 🤖 Android-Specific Issues

### Bundle ID Generation Issues

**Symptoms:**
- Auto-generated bundle ID looks incorrect
- Bundle ID format validation errors

**Debug Steps:**
```javascript
// Check organization and app data
console.log('Organization:', service.organizationId);
console.log('App ID:', service.appId);

// Verify bundle ID generation logic
const orgName = "Your Org"; // Should come from API
const appName = "Your App"; // Should come from API
const bundleId = `com.${orgName.toLowerCase().replace(/\s+/g, '')}.${appName.toLowerCase().replace(/\s+/g, '')}`;
console.log('Generated bundle ID:', bundleId);
```

**Solutions:**
1. **Manual Override:** Allow users to edit auto-generated bundle ID
2. **Validation:** Ensure bundle ID follows reverse domain format
3. **Sanitization:** Remove special characters and spaces

### Keystore Upload Issues

**Symptoms:**
- Keystore file upload fails
- "Invalid keystore password" errors
- Build fails due to signing issues

**Debug Steps:**
```javascript
// Check file upload
const keystoreFile = document.getElementById('keystore-file').files[0];
console.log('Keystore file:', {
  name: keystoreFile?.name,
  size: keystoreFile?.size,
  type: keystoreFile?.type
});

// Validate password
const password = document.getElementById('keystore-password').value;
console.log('Password provided:', !!password);
```

**Solutions:**

1. **File Format Validation:**
   ```javascript
   function validateKeystoreFile(file) {
     const validExtensions = ['.jks', '.keystore', '.p12'];
     const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
     
     if (!validExtensions.includes(extension)) {
       throw new Error('Invalid keystore file format. Use .jks, .keystore, or .p12');
     }
     
     if (file.size > 10 * 1024 * 1024) { // 10MB limit
       throw new Error('Keystore file too large. Maximum size is 10MB');
     }
   }
   ```

2. **Password Validation:**
   ```javascript
   // Test keystore password before upload
   function validateKeystorePassword(file, password) {
     // This would require backend validation
     // Frontend can only check if password is provided
     if (!password || password.length < 6) {
       throw new Error('Keystore password must be at least 6 characters');
     }
   }
   ```

## 🔄 Common Workflow Issues

### Submission State Problems

#### Issue: Stuck on Loading Screen

**Symptoms:**
- Widget shows loading spinner indefinitely
- No progress after API calls
- Browser network tab shows pending requests

**Debug Steps:**
```javascript
// Check current submission state
const state = await service.getSubmissionState(platform);
console.log('Current state:', state);

// Verify API connectivity
try {
  const response = await fetch(`${baseURL}v1/apps/${appId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('API response status:', response.status);
} catch (error) {
  console.error('API connectivity issue:', error);
}
```

**Solutions:**

1. **Clear Browser Cache:**
   ```javascript
   // Clear local storage
   localStorage.clear();
   
   // Reload widget
   location.reload();
   ```

2. **Check Network:**
   ```javascript
   // Test different API endpoints
   const endpoints = [
     `${baseURL}v1/apps/${appId}`,
     `${baseURL}v2/apps/${appId}/submissions/latest?platform=${platform}`
   ];
   
   for (const endpoint of endpoints) {
     try {
       const response = await fetch(endpoint, { headers });
       console.log(`${endpoint}: ${response.status}`);
     } catch (error) {
       console.error(`${endpoint}: ${error.message}`);
     }
   }
   ```

#### Issue: "Cannot proceed to next step" Error

**Symptoms:**
- Step validation fails
- Navigation blocked
- "Previous steps must be completed" error

**Debug Steps:**
```javascript
// Check submission data status
const submission = await service.getSubmissionById(submissionId);
console.log('Submission data:', submission.data);

// Verify required fields
const requiredFields = {
  'INITIALIZED': ['teamId'], // iOS only
  'STORE_CONFIG_SUBMITTED': ['bundleId', 'version'],
  'PUSH_NOTIFICATION_CONFIGURED': [],
  'METADATA_SUBMITTED': ['appIconName']
};

const currentStatus = submission.data.status;
const required = requiredFields[currentStatus] || [];
const missing = required.filter(field => !submission.data[field]);

console.log('Missing required fields:', missing);
```

**Solutions:**
1. **Complete Previous Steps:** Ensure all required fields are submitted
2. **State Correction:** Manually update submission state if corrupted
3. **Reset Workflow:** Create new submission if state is unrecoverable

### Build Process Issues

#### Issue: Build Fails to Start

**Symptoms:**
- "Cannot trigger build" error
- Build button disabled
- Metadata validation errors

**Diagnostic Checklist:**
```javascript
// Verify build prerequisites
const checks = {
  metadataSubmitted: submission.data.status === 'METADATA_SUBMITTED',
  hasAppIcon: !!submission.data.appIconName,
  hasVersion: !!submission.data.version,
  hasBundleId: !!submission.data.bundleId
};

console.log('Build readiness checks:', checks);

// Check for blocking issues
const blockers = Object.entries(checks)
  .filter(([check, passed]) => !passed)
  .map(([check]) => check);

if (blockers.length > 0) {
  console.error('Build blockers:', blockers);
}
```

#### Issue: Build Hangs or Takes Too Long

**Symptoms:**
- Build status remains "BUILD_TRIGGERED" for extended time
- No progress updates
- Build appears stuck

**Monitoring Setup:**
```javascript
// Enhanced build monitoring
function monitorBuildWithTimeout(submissionId, timeout = 30 * 60 * 1000) { // 30 minutes
  let pollCount = 0;
  const maxPolls = timeout / 5000; // 5-second intervals
  
  const poll = async () => {
    pollCount++;
    console.log(`Build poll #${pollCount}/${maxPolls}`);
    
    try {
      const status = await service.getSubmissionById(submissionId);
      console.log('Build status:', status.data.status, status.status);
      
      if (status.status !== 'started' || status.data.status !== 'BUILD_TRIGGERED') {
        return status; // Build complete
      }
      
      if (pollCount >= maxPolls) {
        throw new Error('Build timeout - consider cancelling and retrying');
      }
      
      setTimeout(poll, 5000);
    } catch (error) {
      console.error('Build monitoring error:', error);
      throw error;
    }
  };
  
  return poll();
}
```

## 🌐 Network and Authentication Issues

### API Token Problems

**Symptoms:**
- 401 Unauthorized errors
- "Invalid token" messages
- All API calls failing

**Debug Steps:**
```javascript
// Verify token format and validity
const token = Fliplet.Env.get('apiToken');
console.log('Token present:', !!token);
console.log('Token format valid:', token?.startsWith('eu--') || token?.startsWith('us--'));

// Test token with simple API call
try {
  const response = await fetch(`${baseURL}v1/apps/${appId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Token validation status:', response.status);
} catch (error) {
  console.error('Token validation failed:', error);
}
```

**Solutions:**
1. **Refresh Token:** Get new token from Fliplet environment
2. **Check Permissions:** Verify token has required scopes
3. **Region Mismatch:** Ensure token region matches API region

### CORS Issues

**Symptoms:**
- "Cross-origin request blocked" errors
- Network requests failing silently
- OPTIONS preflight failures

**Debug Steps:**
```javascript
// Check CORS headers
fetch(apiURL, {
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization'
  }
})
.then(response => {
  console.log('CORS preflight status:', response.status);
  console.log('CORS headers:', {
    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
  });
});
```

**Solutions:**
1. **Check Origin:** Ensure request origin is whitelisted
2. **Credentials:** Use `credentials: 'include'` for authenticated requests
3. **Headers:** Verify all required headers are allowed

## 🔧 Development and Testing Issues

### Local Development Setup

**Common Issues:**
- Widget not loading in development
- Mock data not working
- Service dependencies missing

**Development Checklist:**
```javascript
// Development environment setup
const isDevelopment = window.location.hostname === 'localhost';

if (isDevelopment) {
  // Use mock service
  window.PublishingService = MockPublishingService;
  
  // Override Fliplet environment
  window.Fliplet = {
    Env: {
      get: (key) => {
        const mockEnv = {
          appId: 123456,
          apiToken: 'mock-token',
          region: 'eu',
          apiUrl: 'https://api.fliplet.com/'
        };
        return mockEnv[key];
      }
    },
    Widget: {
      instance: (name, callback) => {
        // Mock widget instance
        callback.call(document.querySelector('.publishing-widget-container'), {});
      }
    }
  };
}
```

### Widget Testing

**Test Configuration:**
```javascript
// Test widget with different configurations
const testConfigs = [
  { showIOS: true, showAndroid: false, region: 'eu' },
  { showIOS: false, showAndroid: true, region: 'us' },
  { showIOS: true, showAndroid: true, region: 'ca' }
];

testConfigs.forEach((config, index) => {
  console.log(`Testing config ${index + 1}:`, config);
  // Initialize widget with test config
  // Verify expected behavior
});
```

## 📊 Performance Issues

### Slow Loading

**Symptoms:**
- Widget takes long time to initialize
- API calls timeout
- UI becomes unresponsive

**Performance Debugging:**
```javascript
// Measure API call performance
async function measureAPICall(apiCall, description) {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    console.log(`${description}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${description} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

// Example usage
const apiKeys = await measureAPICall(
  () => service.getAPIKeys(),
  'API Keys fetch'
);
```

**Optimization Strategies:**
1. **Parallel Requests:** Load independent data simultaneously
2. **Caching:** Store frequently accessed data
3. **Lazy Loading:** Load data only when needed
4. **Request Batching:** Combine multiple API calls

## 🆘 Emergency Recovery

### Complete Widget Reset

**When to Use:** Widget is completely broken or stuck

**Reset Procedure:**
```javascript
// Step 1: Clear all local data
localStorage.clear();
sessionStorage.clear();

// Step 2: Reset widget state
if (window.PublishingUI) {
  window.PublishingUI = {
    service: null,
    currentScreen: 'platform-selection',
    selectedPlatform: null,
    submissionId: null,
    organizationId: null
  };
}

// Step 3: Reload widget
location.reload();
```

### Data Recovery

**Recover Lost Submission:**
```javascript
// Find recent submissions
async function recoverSubmission(platform) {
  try {
    const submissions = await service.getSubmissions(platform, 'started');
    const recent = submissions.submissions
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    
    if (recent) {
      console.log('Found recoverable submission:', recent.id);
      return recent;
    }
  } catch (error) {
    console.error('Submission recovery failed:', error);
  }
  return null;
}
```

## 📞 Getting Help

### Collecting Debug Information

**Debug Info Collection:**
```javascript
function collectDebugInfo() {
  const info = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    widget: {
      version: '1.0.0',
      config: Fliplet.Widget.getData(),
      state: window.PublishingUI
    },
    environment: {
      appId: Fliplet.Env.get('appId'),
      region: Fliplet.Env.get('region'),
      mode: Fliplet.Env.get('mode')
    },
    errors: JSON.parse(localStorage.getItem('widget-errors') || '[]')
  };
  
  console.log('Debug info:', JSON.stringify(info, null, 2));
  return info;
}
```

### Support Channels

1. **GitHub Issues:** Report bugs with debug info
2. **Documentation:** Check docs/ folder for guides
3. **Community Forum:** Ask questions and share solutions
4. **Direct Support:** For urgent production issues

### Creating Effective Bug Reports

**Template:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Widget Version: 1.0.0
- Browser: Chrome 118
- Platform: iOS/Android
- Region: EU/US/CA

## Debug Info
[Paste output from collectDebugInfo()]

## Additional Context
Any other relevant information
```

This comprehensive troubleshooting guide should help users resolve most common issues with the Publishing Widget. For issues not covered here, the debug information collection process will help support teams provide targeted assistance.