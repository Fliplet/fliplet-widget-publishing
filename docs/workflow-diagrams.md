# Publishing Workflow Diagrams

This document provides detailed visual representations of the publishing workflows for both iOS and Android platforms.

## 🔄 iOS Publishing Workflow

### Complete iOS Flow

```mermaid
graph TD
    A[User Opens Widget] --> B[Platform Selection Screen]
    B --> C{Select iOS Platform}
    C --> D[Check Existing Submissions]
    D --> E{Has Active Submission?}
    
    E -->|No| F[Show iOS Requirements]
    E -->|Yes| G[Show Resume Option]
    
    F --> H[Continue to API Key Setup]
    G --> H
    
    H --> I[API Key Configuration]
    I --> J{Has API Keys?}
    J -->|No| K[Create New API Key Form]
    J -->|Yes| L[Select Existing Key]
    
    K --> M[Validate New Key]
    L --> N[Validate Selected Key]
    M --> O[Create Submission]
    N --> O
    
    O --> P[Bundle ID & Certificate]
    P --> Q[Check Certificate Status]
    Q --> R{Certificate Valid?}
    
    R -->|No| S[Generate/Upload Certificate]
    R -->|Yes| T[Fetch Bundle IDs]
    S --> T
    
    T --> U[Select Bundle ID]
    U --> V[Get Version Info]
    V --> W[Submit Store Config]
    
    W --> X[Push Notifications (Optional)]
    X --> Y{Configure Push?}
    Y -->|Yes| Z[Setup Push Config]
    Y -->|No| AA[Skip Push]
    Z --> BB[Submit Push Config]
    AA --> CC[App Store Listing]
    BB --> CC
    
    CC --> DD[Collect Metadata]
    DD --> EE{Upload Images?}
    EE -->|Yes| FF[Upload App Icon/Splash]
    EE -->|No| GG[Use Existing Images]
    FF --> HH[Submit Metadata]
    GG --> HH
    
    HH --> II[Ready to Build]
    II --> JJ[Trigger Build]
    JJ --> KK[Monitor Build Progress]
    KK --> LL{Build Complete?}
    
    LL -->|Success| MM[Show Success Message]
    LL -->|Failed| NN[Show Error & Retry]
    LL -->|In Progress| OO[Continue Monitoring]
    OO --> LL
```

### iOS State Machine

```mermaid
stateDiagram-v2
    [*] --> PlatformSelection
    PlatformSelection --> APIKeyConfig: Select iOS
    
    state APIKeyConfig {
        [*] --> LoadingKeys
        LoadingKeys --> SelectKey: Keys Found
        LoadingKeys --> CreateKey: No Keys
        SelectKey --> ValidateKey
        CreateKey --> ValidateKey
        ValidateKey --> KeyValid: Success
        ValidateKey --> KeyError: Failed
        KeyError --> SelectKey: Retry
        KeyValid --> [*]
    }
    
    APIKeyConfig --> CertificateManagement: Key Configured
    
    state CertificateManagement {
        [*] --> CheckCert
        CheckCert --> CertValid: Valid
        CheckCert --> CertInvalid: Invalid
        CertInvalid --> GenerateCert: Auto Generate
        CertInvalid --> UploadCert: Manual Upload
        GenerateCert --> CertValid
        UploadCert --> CertValid
        CertValid --> FetchBundles
        FetchBundles --> SelectBundle
        SelectBundle --> [*]
    }
    
    CertificateManagement --> StoreConfig: Bundle Selected
    StoreConfig --> PushConfig: Store Submitted
    
    state PushConfig {
        [*] --> CheckPushStatus
        CheckPushStatus --> PushConfigured: Already Set
        CheckPushStatus --> ConfigurePush: Not Set
        CheckPushStatus --> SkipPush: User Skip
        ConfigurePush --> PushConfigured
        PushConfigured --> [*]
        SkipPush --> [*]
    }
    
    PushConfig --> MetadataSubmission: Push Done
    
    state MetadataSubmission {
        [*] --> CollectMetadata
        CollectMetadata --> UploadImages: Has New Images
        CollectMetadata --> SubmitMetadata: No New Images
        UploadImages --> SubmitMetadata
        SubmitMetadata --> [*]
    }
    
    MetadataSubmission --> BuildProcess: Metadata Submitted
    
    state BuildProcess {
        [*] --> TriggerBuild
        TriggerBuild --> Monitoring
        Monitoring --> BuildSuccess: Success
        Monitoring --> BuildFailed: Failed
        Monitoring --> BuildCancelled: Cancelled
        BuildSuccess --> [*]
        BuildFailed --> [*]
        BuildCancelled --> [*]
    }
    
    BuildProcess --> [*]: Build Complete
```

## 🤖 Android Publishing Workflow

### Complete Android Flow

```mermaid
graph TD
    A[User Opens Widget] --> B[Platform Selection Screen]
    B --> C{Select Android Platform}
    C --> D[Check Existing Submissions]
    D --> E{Has Active Submission?}
    
    E -->|No| F[Show Android Requirements]
    E -->|Yes| G[Show Resume Option]
    
    F --> H[Continue to Bundle/Keystore]
    G --> H
    
    H --> I[Bundle ID & Keystore Setup]
    I --> J[Auto-generate Bundle ID]
    J --> K{Upload Keystore?}
    
    K -->|Yes| L[Upload Keystore File]
    K -->|No| M[Use Auto-generated Keystore]
    L --> N[Enter Keystore Password]
    N --> O[Submit Store Config]
    M --> O
    
    O --> P[Push Notifications (Optional)]
    P --> Q{Configure Push?}
    Q -->|Yes| R[Upload Google Services JSON]
    Q -->|No| S[Skip Push]
    R --> T[Setup Push Config]
    S --> U[App Store Listing]
    T --> U
    
    U --> V[Collect Metadata]
    V --> W{Upload Images?}
    W -->|Yes| X[Upload App Icon/Splash]
    W -->|No| Y[Use Existing Images]
    X --> Z[Submit Metadata]
    Y --> Z
    
    Z --> AA[Ready to Build]
    AA --> BB[Trigger Build]
    BB --> CC[Monitor Build Progress]
    CC --> DD{Build Complete?}
    
    DD -->|Success| EE[Show Success Message]
    DD -->|Failed| FF[Show Error & Retry]
    DD -->|In Progress| GG[Continue Monitoring]
    GG --> DD
```

### Android State Machine

```mermaid
stateDiagram-v2
    [*] --> PlatformSelection
    PlatformSelection --> BundleKeystoreConfig: Select Android
    
    state BundleKeystoreConfig {
        [*] --> GenerateBundleID
        GenerateBundleID --> KeystoreChoice
        KeystoreChoice --> UploadKeystore: User Upload
        KeystoreChoice --> AutoKeystore: Auto Generate
        UploadKeystore --> ValidateKeystore
        ValidateKeystore --> StoreConfigReady: Valid
        ValidateKeystore --> KeystoreError: Invalid
        KeystoreError --> KeystoreChoice: Retry
        AutoKeystore --> StoreConfigReady
        StoreConfigReady --> [*]
    }
    
    BundleKeystoreConfig --> PushConfig: Store Config Done
    
    state PushConfig {
        [*] --> CheckPushStatus
        CheckPushStatus --> UploadGoogleServices: Configure
        CheckPushStatus --> SkipPush: Skip
        UploadGoogleServices --> ValidateServices
        ValidateServices --> PushConfigured: Valid
        ValidateServices --> PushError: Invalid
        PushError --> UploadGoogleServices: Retry
        PushConfigured --> [*]
        SkipPush --> [*]
    }
    
    PushConfig --> MetadataSubmission: Push Done
    
    state MetadataSubmission {
        [*] --> CollectMetadata
        CollectMetadata --> UploadImages: Has New Images
        CollectMetadata --> SubmitMetadata: No New Images
        UploadImages --> ValidateImages
        ValidateImages --> SubmitMetadata: Valid
        ValidateImages --> ImageError: Invalid
        ImageError --> UploadImages: Retry
        SubmitMetadata --> [*]
    }
    
    MetadataSubmission --> BuildProcess: Metadata Submitted
    
    state BuildProcess {
        [*] --> TriggerBuild
        TriggerBuild --> Monitoring
        Monitoring --> BuildSuccess: Success
        Monitoring --> BuildFailed: Failed
        Monitoring --> BuildCancelled: Cancelled
        BuildSuccess --> [*]
        BuildFailed --> [*]
        BuildCancelled --> [*]
    }
    
    BuildProcess --> [*]: Build Complete
```

## 🔄 Cross-Platform Submission States

### Submission Lifecycle

```mermaid
graph LR
    A[No Submission] --> B[Initialize]
    B --> C[API Key/Bundle Config]
    C --> D[Store Config Submitted]
    D --> E[Push Config]
    E --> F[Metadata Submitted]
    F --> G[Build Triggered]
    
    G --> H{Build Result}
    H -->|Success| I[Completed]
    H -->|Failed| J[Failed]
    H -->|Cancelled| K[Cancelled]
    
    I --> L[New Submission Available]
    J --> L
    K --> L
    L --> A
    
    style A fill:#f9f9f9
    style I fill:#d4edda
    style J fill:#f8d7da
    style K fill:#fff3cd
```

### Error Handling Flow

```mermaid
graph TD
    A[API Call] --> B{Success?}
    B -->|Yes| C[Update UI State]
    B -->|No| D[Check Error Type]
    
    D --> E{Retryable?}
    E -->|Yes| F[Show Retry Button]
    E -->|No| G[Show Error Message]
    
    F --> H{User Retries?}
    H -->|Yes| A
    H -->|No| I[Stay on Current Step]
    
    G --> J{User Action Required?}
    J -->|Yes| K[Show Instructions]
    J -->|No| L[Block Progress]
    
    K --> M[Wait for User Fix]
    M --> A
    
    style D fill:#fff3cd
    style G fill:#f8d7da
    style K fill:#d1ecf1
```

## 🎯 User Journey Maps

### First-Time iOS Publisher

```mermaid
journey
    title First-Time iOS Publisher Journey
    section Discovery
      Open Widget: 5: User
      See Platform Options: 4: User
      Read Requirements: 3: User
    section Setup
      Select iOS: 5: User
      Create API Key: 2: User
      Validate Credentials: 3: User
    section Configuration
      Generate Certificate: 3: User
      Select Bundle ID: 4: User
      Configure Push: 2: User
    section Publishing
      Upload Images: 4: User
      Submit Metadata: 5: User
      Trigger Build: 5: User
    section Completion
      Monitor Progress: 3: User
      Celebrate Success: 5: User
```

### Experienced Android Publisher

```mermaid
journey
    title Experienced Android Publisher Journey
    section Quick Start
      Open Widget: 5: User
      Select Android: 5: User
      Skip Keystore: 5: User
    section Fast Track
      Auto Bundle ID: 5: User
      Skip Push Config: 4: User
      Use Existing Images: 5: User
    section Publishing
      Submit Metadata: 5: User
      Trigger Build: 5: User
      Monitor Build: 4: User
```

## 📊 Performance Considerations

### API Call Optimization

```mermaid
graph TD
    A[User Action] --> B{Data Cached?}
    B -->|Yes| C[Use Cache]
    B -->|No| D[Make API Call]
    
    D --> E{Parallel Calls Possible?}
    E -->|Yes| F[Batch Requests]
    E -->|No| G[Sequential Calls]
    
    F --> H[Process Responses]
    G --> H
    C --> I[Update UI]
    H --> J[Cache Results]
    J --> I
    
    I --> K{More Steps?}
    K -->|Yes| A
    K -->|No| L[Complete Flow]
```

### State Persistence Strategy

```mermaid
graph LR
    A[User Input] --> B[Local Storage]
    B --> C[API Success]
    C --> D[Update Server State]
    D --> E[Clear Local Cache]
    
    F[API Error] --> G[Preserve Local Data]
    G --> H[Show Retry Option]
    H --> I{User Retries?}
    I -->|Yes| C
    I -->|No| J[Keep Form Data]
```

## 🔧 Implementation Notes

### Key Decision Points

1. **Platform Selection**: 
   - Check existing submissions first
   - Allow resuming interrupted workflows
   - Clear previous errors on platform switch

2. **API Key Management**:
   - Validate keys before proceeding
   - Cache team information
   - Handle expired credentials gracefully

3. **Certificate Handling**:
   - Auto-generate when possible
   - Provide manual upload fallback
   - Validate certificate-team associations

4. **Build Monitoring**:
   - Implement efficient polling
   - Provide real-time status updates
   - Handle build cancellation properly

5. **Error Recovery**:
   - Preserve user input during errors
   - Provide clear error messages
   - Offer actionable recovery steps

### Widget State Management

The widget maintains state at multiple levels:

- **Screen State**: Current visible screen and navigation
- **Form State**: User input data and validation
- **Service State**: API responses and submission status
- **Error State**: Current errors and retry options

This multi-level approach ensures that users never lose progress and can always resume their publishing workflow from where they left off.