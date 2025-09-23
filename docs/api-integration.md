# API Integration Guide

This document provides comprehensive details about the API integration patterns, endpoints, and data structures used by the Publishing Widget.

## 🌐 API Architecture

### Base URL Construction

The widget supports multiple regions and environments:

```javascript
function getRegionURL(region) {
  const appsURL = {
    studio: {
      eu: 'https://api.fliplet.com/',
      us: 'https://us.api.fliplet.com/',
      ca: 'https://ca.api.fliplet.com/'
    },
    web: {
      eu: 'https://apps.fliplet.com/',
      us: 'https://us-apps.fliplet.com/',
      ca: 'https://ca-apps.fliplet.com/'
    }
  };
  
  // Determine mode from Fliplet environment
  const mode = Fliplet.Env.get('mode') || 'studio';
  const targetRegion = region || 'eu';
  
  return appsURL[mode][targetRegion];
}
```

### Authentication

All API calls use Bearer token authentication:

```javascript
headers: {
  'Authorization': `Bearer ${Fliplet.Env.get('apiToken')}`,
  'Content-Type': 'application/json'
}
```

## 📚 Core API Endpoints

### 1. App Initialization

#### Get App Details
```http
GET /v1/apps/{appId}
```

**Response:**
```json
{
  "app": {
    "id": 12345,
    "name": "My App",
    "organizationId": 67890,
    "productionAppId": 98765
  }
}
```

#### Publish App (if needed)
```http
POST /v1/apps/{appId}/publish
```

### 2. Submission Management

#### Get Latest Submission
```http
GET /v2/apps/{appId}/submissions/latest?platform={ios|android}
```

**Response:**
```json
{
  "id": "submission-uuid",
  "status": "started|completed|failed|cancelled",
  "platform": "ios",
  "data": {
    "status": "INITIALIZED|STORE_CONFIG_SUBMITTED|PUSH_NOTIFICATION_CONFIGURED|METADATA_SUBMITTED|BUILD_TRIGGERED",
    "teamId": "team-id",
    "bundleId": "com.example.app",
    "version": "1.0.0"
  },
  "createdAt": "2024-09-23T10:00:00Z",
  "updatedAt": "2024-09-23T11:00:00Z"
}
```

#### Initialize New Submission
```http
POST /v2/apps/{appId}/submissions/initialize
```

**iOS Payload:**
```json
{
  "platform": "ios",
  "type": "appStore",
  "teamId": "required-team-id"
}
```

**Android Payload:**
```json
{
  "platform": "android",
  "type": "appStore"
}
```

#### Get Submission by ID
```http
GET /v2/apps/{appId}/submissions/{submissionId}
```

#### Get All Submissions
```http
GET /v2/apps/{appId}/submissions?platform={platform}&status={status}&type=appStore
```

## 🍎 iOS-Specific Endpoints

### API Key Management

#### List API Keys
```http
GET /v2/organizations/{organizationId}/credentials/api-keys
```

**Response:**
```json
{
  "data": [
    {
      "id": "key-uuid",
      "name": "Production Key",
      "keyId": "ABC123DEF4",
      "issuerId": "issuer-uuid",
      "teamId": "team-id",
      "createdAt": "2024-09-23T10:00:00Z"
    }
  ]
}
```

#### Create API Key
```http
POST /v2/organizations/{organizationId}/credentials/api-key
```

**Payload:**
```json
{
  "name": "My API Key",
  "keyId": "ABC123DEF4",
  "issuerId": "issuer-uuid",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

**Response:**
```json
{
  "data": {
    "id": "key-uuid",
    "teamId": "team-id",
    "name": "My API Key"
  }
}
```

#### Validate API Key
```http
POST /v2/organizations/{organizationId}/credentials/api-key/validate
```

**Payload:**
```json
{
  "keyId": "ABC123DEF4",
  "issuerId": "issuer-uuid",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

### Certificate Management

#### Check Certificate Status
```http
POST /v2/organizations/{organizationId}/credentials/ios/certificate/check
```

**Payload:**
```json
{
  "teamId": "team-id"
}
```

**Response:**
```json
{
  "isValid": true,
  "certificate": {
    "id": "cert-id",
    "name": "Distribution Certificate",
    "expiresAt": "2025-09-23T10:00:00Z"
  },
  "message": "Certificate is valid"
}
```

#### Generate Certificate
```http
POST /v2/organizations/{organizationId}/credentials/ios/certificate/generate
```

**Payload:**
```json
{
  "teamId": "team-id"
}
```

#### Upload Custom Certificate
```http
PUT /v2/organizations/{organizationId}/credentials/ios/certificate/upload
```

**Payload:**
```json
{
  "teamId": "team-id",
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

### Bundle ID Management

#### List Bundle IDs
```http
GET /v2/organizations/{organizationId}/apple/bundle-ids?teamId={teamId}
```

**Response:**
```json
{
  "data": [
    {
      "id": "bundle-uuid",
      "identifier": "com.example.app",
      "name": "My App",
      "platform": "IOS"
    }
  ]
}
```

#### Get Bundle ID Details
```http
GET /v2/organizations/{organizationId}/apple/bundle-ids/{bundleId}?teamId={teamId}
```

**Response:**
```json
{
  "data": {
    "id": "bundle-uuid",
    "identifier": "com.example.app",
    "name": "My App",
    "version": "1.0.0",
    "platform": "IOS"
  }
}
```

## 🤖 Android-Specific Endpoints

### Keystore Management

#### Upload Keystore
```http
POST /v2/apps/{appId}/submissions/{submissionId}/keystore
```

**Form Data:**
```
keystore: [binary file]
password: "keystore-password"
```

## 🔄 Common Workflow Endpoints

### Store Configuration

#### Submit Store Config
```http
PUT /v2/apps/{appId}/submissions/{submissionId}/store
```

**iOS Payload:**
```json
{
  "bundleId": "com.example.app",
  "version": "1.0.0"
}
```

**Android Payload:**
```json
{
  "bundleId": "com.example.app",
  "version": "1.0.0",
  "data": {
    "fl-store-versionCode": 1
  }
}
```

### Push Notifications

#### Get App-Level Push Config
```http
GET /v1/widget-instances/com.fliplet.push-notifications/settings
```

#### Get Team-Level Push Config (iOS)
```http
GET /v2/organizations/{organizationId}/credentials/push/{teamId}
```

#### Configure Push Notifications
```http
PUT /v1/widget-instances/com.fliplet.push-notifications/settings
```

**iOS Payload:**
```json
{
  "provider": "apns",
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
  "production": true
}
```

**Android Payload:**
```json
{
  "provider": "fcm",
  "serverKey": "server-key",
  "senderId": "sender-id"
}
```

#### Submit Push Config to Submission
```http
PUT /v2/apps/{appId}/submissions/{submissionId}/metadata
```

**Payload:**
```json
{
  "type": "PUSH_CONFIG"
}
```

### Media Upload

#### Upload Images
```http
POST /v1/media/files?appId={appId}
```

**Form Data:**
```
file0: [image file]
file1: [image file]
```

**Response:**
```json
{
  "files": [
    "https://cdn.fliplet.com/path/to/image1.png",
    "https://cdn.fliplet.com/path/to/image2.png"
  ]
}
```

### Metadata Submission

#### Submit App Metadata
```http
PUT /v2/apps/{appId}/submissions/{submissionId}/metadata
```

**Payload:**
```json
{
  "appIconName": "My App",
  "appIcon": "https://cdn.fliplet.com/path/to/icon.png",
  "splashScreen": {
    "file": "https://cdn.fliplet.com/path/to/splash.png",
    "isEncrypted": true
  },
  "description": "App description",
  "keywords": "app,mobile,fliplet"
}
```

### Build Management

#### Trigger Build
```http
POST /v2/apps/{appId}/submissions/{submissionId}/build
```

**Response:**
```json
{
  "buildId": "build-uuid",
  "status": "triggered"
}
```

#### Cancel Build
```http
POST /v2/apps/{appId}/submissions/{submissionId}/cancel
```

## 📊 Data Models

### Submission Object

```typescript
interface Submission {
  id: string;
  appId: number;
  organizationId: number;
  platform: 'ios' | 'android';
  type: 'appStore';
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  data: {
    status: 'INITIALIZED' | 'STORE_CONFIG_SUBMITTED' | 'PUSH_NOTIFICATION_CONFIGURED' | 'METADATA_SUBMITTED' | 'BUILD_TRIGGERED';
    teamId?: string; // iOS only
    bundleId?: string;
    version?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}
```

### API Key Object

```typescript
interface APIKey {
  id: string;
  name: string;
  keyId: string;
  issuerId: string;
  teamId: string;
  createdAt: string;
}
```

### Certificate Object

```typescript
interface Certificate {
  id: string;
  name: string;
  teamId: string;
  expiresAt: string;
  isValid: boolean;
}
```

### Bundle ID Object

```typescript
interface BundleID {
  id: string;
  identifier: string;
  name: string;
  platform: 'IOS' | 'ANDROID';
  version?: string;
}
```

## 🔄 Error Handling Patterns

### Standard Error Response

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or expired",
    "details": {
      "field": "keyId",
      "value": "ABC123DEF4"
    }
  }
}
```

### Common Error Codes

| Code | Description | Recovery Action |
|------|-------------|-----------------|
| `INVALID_API_KEY` | API key is invalid | Re-enter credentials |
| `CERTIFICATE_EXPIRED` | Certificate has expired | Generate new certificate |
| `BUNDLE_ID_NOT_FOUND` | Bundle ID doesn't exist | Select different bundle ID |
| `SUBMISSION_LOCKED` | Build in progress | Wait for completion |
| `INSUFFICIENT_PERMISSIONS` | User lacks permissions | Contact admin |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `VALIDATION_ERROR` | Input validation failed | Fix input and retry |

### Error Handling Strategy

```javascript
async function handleAPICall(apiCall) {
  try {
    const response = await apiCall();
    return { success: true, data: response };
  } catch (error) {
    // Parse error response
    const errorCode = error.responseJSON?.error?.code;
    const errorMessage = error.responseJSON?.error?.message || error.message;
    
    // Determine if retryable
    const retryableCodes = ['RATE_LIMIT_EXCEEDED', 'NETWORK_ERROR', 'TIMEOUT'];
    const isRetryable = retryableCodes.includes(errorCode);
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        retryable: isRetryable
      }
    };
  }
}
```

## 🔒 Security Considerations

### API Key Security

- API keys are never stored in localStorage
- Private keys are transmitted only during creation/validation
- Team IDs are cached for session duration only

### CORS Configuration

All API endpoints support CORS with credentials:

```javascript
// Request configuration
{
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}
```

### Data Validation

All inputs are validated both client-side and server-side:

```javascript
// Version validation example
function validateVersion(version) {
  const pattern = /^\d+\.\d+(\.\d+)?$/;
  if (!pattern.test(version)) {
    throw new Error('Version must be in n.n.n or n.n format');
  }
}
```

## 📈 Performance Optimization

### Request Batching

Where possible, multiple API calls are batched:

```javascript
// Parallel API calls
const [apiKeys, certificates, bundleIds] = await Promise.all([
  service.getAPIKeys(),
  service.checkCertificate(teamId),
  service.getBundleIDs(teamId)
]);
```

### Caching Strategy

- Organization data: Cache for session
- API keys: Cache until refresh requested
- Bundle IDs: Cache with team association
- Submission state: Real-time, no caching

### Polling Optimization

Build monitoring uses exponential backoff:

```javascript
async function pollBuildStatus(submissionId, interval = 5000) {
  const maxInterval = 30000; // 30 seconds max
  
  const poll = async () => {
    const status = await getSubmissionById(submissionId);
    
    if (status.data.status === 'BUILD_TRIGGERED' && status.status === 'started') {
      // Continue polling with increased interval
      const nextInterval = Math.min(interval * 1.2, maxInterval);
      setTimeout(poll, nextInterval);
    } else {
      // Build complete
      return status;
    }
  };
  
  return poll();
}
```

## 🧪 Testing API Integration

### Mock Service for Development

```javascript
class MockPublishingService {
  async getAPIKeys() {
    // Return mock data for development
    return {
      success: true,
      apiKeys: [
        { id: '1', name: 'Test Key', keyId: 'TEST123', teamId: 'team1' }
      ]
    };
  }
  
  async createSubmission(platform, teamId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      submission: {
        id: 'mock-submission-id',
        platform,
        status: 'started',
        data: { status: 'INITIALIZED', teamId }
      }
    };
  }
}
```

### Integration Test Examples

```javascript
// Test API key validation
async function testAPIKeyValidation() {
  const service = new PublishingService(config);
  
  try {
    const result = await service.validateAPIKey({
      keyId: 'INVALID_KEY',
      issuerId: 'test-issuer',
      privateKey: 'invalid-key'
    });
    
    assert.equal(result.valid, false);
  } catch (error) {
    assert.equal(error.message.includes('INVALID_API_KEY'), true);
  }
}

// Test submission flow
async function testSubmissionFlow() {
  const service = new PublishingService(config);
  
  // Initialize app
  await service.initializeApp();
  assert.isNotNull(service.organizationId);
  
  // Create submission
  const submission = await service.createSubmission('ios', 'team-id');
  assert.equal(submission.success, true);
  
  // Check state
  const state = await service.getSubmissionState('ios');
  assert.equal(state.currentStep, 'api-key');
}
```

This comprehensive API integration guide provides all the technical details needed to understand and work with the Publishing Widget's backend integration.