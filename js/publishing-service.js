/**
 * Fliplet App Publishing Service
 * 
 * A complete service layer for handling iOS and Android app publishing workflows.
 * Decoupled from UI - can be used with any frontend implementation.
 * 
 * Features:
 * - Complete submission state management
 * - Platform-specific workflow handling
 * - Error handling and validation
 * - Image upload management
 * - Progress tracking
 */

/**
 * Publishing Service Class
 * 
 * Manages all publishing workflows for iOS and Android apps.
 * Provides a unified interface for interacting with Fliplet's publishing APIs.
 * 
 * @class PublishingService
 * @example
 * const service = new PublishingService({
 *   appId: 123456,
 *   token: 'api-token',
 *   region: 'eu',
 *   ajax: Fliplet.API.request,
 *   getRegion: regionHelperFunction
 * });
 */
class PublishingService {
    /**
     * Initialize the Publishing Service
     * 
     * @param {Object} config - Configuration object
     * @param {number} config.appId - Fliplet app ID
     * @param {string} config.token - Authentication token
     * @param {string} config.region - API region (eu/us/ca)
     * @param {Function} config.ajax - HTTP request function
     * @param {Function} config.getRegion - Region URL builder function
     */
    constructor(config) {
        /** @type {number} - Fliplet application identifier */
        this.appId = config.appId;
        
        /** @type {string} - Authentication token for API requests */
        this.token = config.token;
        
        /** @type {string} - API region (eu/us/ca) */
        this.region = config.region;
        
        /** @type {string|null} - Organization ID (populated after initializeApp) */
        this.organizationId = null;
        
        /** @type {Object|null} - Current active submission */
        this.currentSubmission = null;
        
        /** @type {Function} - HTTP request handler */
        this.ajax = config.ajax;
        
        /** @type {Function} - Region URL builder */
        this.getRegion = config.getRegion;
        
        /**
         * Submission status constants
         * These represent the overall status of a submission
         * @readonly
         * @enum {string}
         */
        this.SUBMISSION_STATUS = {
            /** Submission is active and in progress */
            STARTED: 'started',
            /** Submission completed successfully */
            COMPLETED: 'completed',
            /** Submission failed due to errors */
            FAILED: 'failed',
            /** Submission was cancelled by user */
            CANCELLED: 'cancelled',
            /** Build process has been triggered */
            BUILD_TRIGGERED: 'BUILD_TRIGGERED'
        };
        
        /**
         * Data status constants for workflow steps
         * These represent the current step within an active submission
         * @readonly
         * @enum {string}
         */
        this.DATA_STATUS = {
            /** API key configured, ready for next step */
            INITIALIZED: 'INITIALIZED',
            /** Store configuration submitted */
            STORE_CONFIG_SUBMITTED: 'STORE_CONFIG_SUBMITTED',
            /** Push notifications configured */
            PUSH_NOTIFICATION_CONFIGURED: 'PUSH_NOTIFICATION_CONFIGURED',
            /** App metadata submitted */
            METADATA_SUBMITTED: 'METADATA_SUBMITTED',
            /** Build process triggered */
            BUILD_TRIGGERED: 'BUILD_TRIGGERED'
        };
        
        /**
         * Supported platform constants
         * @readonly
         * @enum {string}
         */
        this.PLATFORMS = {
            /** iOS platform identifier */
            IOS: 'ios',
            /** Android platform identifier */
            ANDROID: 'android'
        };
        
        /**
         * Terminal submission statuses that allow creating new submissions
         * @readonly
         * @type {string[]}
         */
        this.TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'];
    }

    // =====================================
    // UTILITY METHODS
    // =====================================

    /**
     * Construct full API URL with region base
     */
    buildURL(endpoint) {
        const baseURL = this.getRegion();
        return `${baseURL}${endpoint}`;
    }

    /**
     * Validate platform parameter
     */
    validatePlatform(platform) {
        if (!platform || !Object.values(this.PLATFORMS).includes(platform)) {
            throw new Error(`Invalid platform: ${platform}. Must be 'ios' or 'android'.`);
        }
    }

    /**
     * Validate version format (n.n.n or n.n)
     */
    validateVersion(version) {
        const versionPattern = /^\d+\.\d+(\.\d+)?$/;
        if (!versionPattern.test(version)) {
            throw new Error(`Invalid version format: ${version}. Must be n.n.n or n.n format.`);
        }
    }

    /**
     * Check if submission needs to be created
     */
    needsNewSubmission(submission) {
        return !submission || 
               this.TERMINAL_STATUSES.includes(submission.status) ||
               (submission.data?.status === this.DATA_STATUS.BUILD_TRIGGERED && 
                this.TERMINAL_STATUSES.includes(submission.status));
    }

    /**
     * Validate step access based on submission state
     */
    validateStepAccess(requiredDataStatus, actualDataStatus) {
        const stepOrder = [
            this.DATA_STATUS.INITIALIZED,
            this.DATA_STATUS.STORE_CONFIG_SUBMITTED,
            this.DATA_STATUS.PUSH_NOTIFICATION_CONFIGURED,
            this.DATA_STATUS.METADATA_SUBMITTED,
            this.DATA_STATUS.BUILD_TRIGGERED
        ];
        
        const requiredIndex = stepOrder.indexOf(requiredDataStatus);
        const actualIndex = stepOrder.indexOf(actualDataStatus);
        
        if (actualIndex < requiredIndex - 1) {
            throw new Error(`Cannot access this step. Previous steps must be completed first.`);
        }
    }

    // =====================================
    // CORE WORKFLOW METHODS
    // =====================================

    /**
     * Initialize app for publishing (Step 0)
     */
    async initializeApp() {
        try {
            // Get app details
            const appURL = this.buildURL(`v1/apps/${this.appId}`);
            const appResponse = await this.ajax(appURL, 'GET');
            
            this.organizationId = appResponse.app.organizationId;
            
            // Check if app is published
            if (!appResponse.app.productionAppId) {
                const publishURL = this.buildURL(`v1/apps/${this.appId}/publish`);
                await this.ajax(publishURL, 'POST');
            }
            
            return {
                success: true,
                organizationId: this.organizationId,
                productionAppId: appResponse.app.productionAppId
            };
        } catch (error) {
            throw new Error(`Failed to initialize app: ${error.message}`);
        }
    }

    /**
     * Get latest submission and determine next step
     */
    async getSubmissionState(platform) {
        this.validatePlatform(platform);
        
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/latest?platform=${platform}`);
            const response = await this.ajax(url, 'GET');
            
            this.currentSubmission = response;
            
            return {
                submission: response,
                needsNewSubmission: this.needsNewSubmission(response),
                currentStep: this.determineCurrentStep(response, platform),
                canProceed: this.canProceedToStep(response, platform)
            };
        } catch (error) {
            // No submission exists
            return {
                submission: null,
                needsNewSubmission: true,
                currentStep: 'initialize',
                canProceed: true
            };
        }
    }

    /**
     * Determine current step based on submission state
     */
    determineCurrentStep(submission, platform) {
        if (!submission || this.needsNewSubmission(submission)) {
            return 'initialize';
        }
        
        if (submission.status !== this.SUBMISSION_STATUS.STARTED) {
            return 'initialize';
        }
        
        const dataStatus = submission.data?.status;
        
        switch (dataStatus) {
            case this.DATA_STATUS.INITIALIZED:
                return platform === this.PLATFORMS.IOS ? 'api-key' : 'bundle-keystore';
            case this.DATA_STATUS.STORE_CONFIG_SUBMITTED:
                return 'push-config';
            case this.DATA_STATUS.PUSH_NOTIFICATION_CONFIGURED:
                return 'app-store-listing';
            case this.DATA_STATUS.METADATA_SUBMITTED:
                return 'trigger-build';
            case this.DATA_STATUS.BUILD_TRIGGERED:
                return 'monitor-build';
            default:
                return 'initialize';
        }
    }

    /**
     * Check if user can proceed to next step
     */
    canProceedToStep(submission, platform) {
        if (!submission) return true;
        
        if (submission.status !== this.SUBMISSION_STATUS.STARTED) {
            return true; // Can create new submission
        }
        
        const dataStatus = submission.data?.status;
        
        // Special case: build is active
        if (dataStatus === this.DATA_STATUS.BUILD_TRIGGERED && 
            submission.status === this.SUBMISSION_STATUS.STARTED) {
            return false; // Cannot proceed until build completes
        }
        
        return true;
    }

    // =====================================
    // SUBMISSION MANAGEMENT
    // =====================================

    /**
     * Create new submission
     */
    async createSubmission(platform, teamId = null) {
        this.validatePlatform(platform);
        
        const payload = {
            platform: platform,
            type: 'appStore'
        };
        
        // iOS requires teamId
        if (platform === this.PLATFORMS.IOS) {
            if (!teamId) {
                throw new Error('teamId is required for iOS submissions');
            }
            payload.teamId = teamId;
        }
        
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/initialize`);
            const response = await this.ajax(url, 'POST', payload);
            
            this.currentSubmission = response.submission;
            
            return {
                success: true,
                submission: response.submission,
                message: 'Submission initialized successfully'
            };
        } catch (error) {
            throw new Error(`Failed to create submission: ${error.message}`);
        }
    }

    // =====================================
    // iOS-SPECIFIC METHODS
    // =====================================

    /**
     * Get list of API keys for organization
     */
    async getAPIKeys() {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/api-keys`);
            const response = await this.ajax(url, 'GET');
            
            return {
                success: true,
                apiKeys: response.data || []
            };
        } catch (error) {
            throw new Error(`Failed to get API keys: ${error.message}`);
        }
    }

    /**
     * Create new API key
     */
    async createAPIKey(keyData) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        // Validate required fields
        if (!keyData.name || !keyData.keyId || !keyData.issuerId || !keyData.privateKey) {
            throw new Error('Missing required API key fields: name, keyId, issuerId, privateKey');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/api-key`);
            const response = await this.ajax(url, 'POST', keyData);
            
            return {
                success: true,
                apiKey: response.data,
                message: 'API key created successfully'
            };
        } catch (error) {
            if (error.responseJSON?.status === 'INVALID_API_KEY') {
                throw new Error('Invalid API key data. Please check your credentials and try again.');
            }
            throw new Error(`Failed to create API key: ${error.message}`);
        }
    }

    /**
     * Validate API key
     */
    async validateAPIKey(keyData) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/api-key/validate`);
            const response = await this.ajax(url, 'POST', keyData);
            
            return {
                success: true,
                valid: response.valid,
                message: response.message
            };
        } catch (error) {
            throw new Error(`Failed to validate API key: ${error.message}`);
        }
    }

    /**
     * Check iOS certificate status
     */
    async checkCertificate(teamId) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        if (!teamId) {
            throw new Error('teamId is required for certificate check');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/ios/certificate/check`);
            const response = await this.ajax(url, 'POST', { teamId });
            
            return {
                success: true,
                isValid: response.isValid,
                certificate: response.certificate,
                message: response.message
            };
        } catch (error) {
            throw new Error(`Failed to check certificate: ${error.message}`);
        }
    }

    /**
     * Generate new iOS certificate
     */
    async generateCertificate(teamId) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/ios/certificate/generate`);
            const response = await this.ajax(url, 'POST', { teamId });
            
            return {
                success: true,
                certificate: response.certificate,
                message: 'Certificate generated successfully'
            };
        } catch (error) {
            throw new Error(`Failed to generate certificate: ${error.message}`);
        }
    }

    /**
     * Upload custom iOS certificate
     */
    async uploadCertificate(teamId, certificateData) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/ios/certificate/upload`);
            const payload = { teamId, ...certificateData };
            const response = await this.ajax(url, 'PUT', payload);
            
            return {
                success: true,
                certificate: response.certificate,
                message: 'Certificate uploaded successfully'
            };
        } catch (error) {
            throw new Error(`Failed to upload certificate: ${error.message}`);
        }
    }

    /**
     * Get list of bundle IDs
     */
    async getBundleIDs(teamId) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/apple/bundle-ids`);
            const response = await this.ajax(url, 'GET', { teamId });
            
            return {
                success: true,
                bundleIds: response.data || []
            };
        } catch (error) {
            throw new Error(`Failed to get bundle IDs: ${error.message}`);
        }
    }

    /**
     * Get bundle ID details
     */
    async getBundleIDDetails(bundleId, teamId) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/apple/bundle-ids/${bundleId}`);
            const response = await this.ajax(url, 'GET', { teamId });
            
            return {
                success: true,
                bundleDetails: response.data,
                version: response.data?.version
            };
        } catch (error) {
            throw new Error(`Failed to get bundle ID details: ${error.message}`);
        }
    }

    // =====================================
    // ANDROID-SPECIFIC METHODS
    // =====================================

    /**
     * Upload Android keystore
     */
    async uploadKeystore(submissionId, keystoreFile, password) {
        try {
            const formData = new FormData();
            formData.append('keystore', keystoreFile);
            formData.append('password', password);
            
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}/keystore`);
            const response = await this.ajax(url, 'POST', formData, true);
            
            return {
                success: true,
                message: 'Keystore uploaded successfully'
            };
        } catch (error) {
            throw new Error(`Failed to upload keystore: ${error.message}`);
        }
    }

    // =====================================
    // COMMON WORKFLOW METHODS
    // =====================================

    /**
     * Submit store configuration
     */
    async submitStoreConfig(submissionId, storeData, platform) {
        this.validatePlatform(platform);
        
        // Validate required data
        if (!storeData.bundleId) {
            throw new Error('Bundle ID is required');
        }
        
        if (storeData.version) {
            this.validateVersion(storeData.version);
        }
        
        const payload = { ...storeData };
        
        // Android-specific field
        if (platform === this.PLATFORMS.ANDROID) {
            if (!payload.data) payload.data = {};
            if (!payload.data['fl-store-versionCode']) {
                throw new Error('Version code (fl-store-versionCode) is required for Android');
            }
        }
        
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}/store`);
            const response = await this.ajax(url, 'PUT', payload);
            
            // Update current submission
            if (this.currentSubmission) {
                this.currentSubmission.data.status = this.DATA_STATUS.STORE_CONFIG_SUBMITTED;
            }
            
            return {
                success: true,
                message: 'Store configuration submitted successfully'
            };
        } catch (error) {
            throw new Error(`Failed to submit store configuration: ${error.message}`);
        }
    }

    /**
     * Get push configuration status
     */
    async getPushConfig() {
        try {
            const url = this.buildURL(`v1/widget-instances/com.fliplet.push-notifications/settings`);
            const response = await this.ajax(url, 'GET');
            
            return {
                success: true,
                configured: !!response.data,
                config: response.data
            };
        } catch (error) {
            return {
                success: true,
                configured: false,
                config: null
            };
        }
    }

    /**
     * Get team-specific push configuration (iOS only)
     */
    async getTeamPushConfig(teamId) {
        if (!this.organizationId) {
            throw new Error('Organization ID not set. Call initializeApp() first.');
        }
        
        try {
            const url = this.buildURL(`v2/organizations/${this.organizationId}/credentials/push/${teamId}`);
            const response = await this.ajax(url, 'GET');
            
            return {
                success: true,
                configured: !!response.data,
                config: response.data
            };
        } catch (error) {
            return {
                success: true,
                configured: false,
                config: null
            };
        }
    }

    /**
     * Configure push notifications
     */
    async configurePushNotifications(pushConfig) {
        try {
            const url = this.buildURL(`v1/widget-instances/com.fliplet.push-notifications/settings`);
            const response = await this.ajax(url, 'PUT', pushConfig);
            
            return {
                success: true,
                message: 'Push notifications configured successfully'
            };
        } catch (error) {
            throw new Error(`Failed to configure push notifications: ${error.message}`);
        }
    }

    /**
     * Submit push notification configuration to submission
     */
    async submitPushConfig(submissionId, configType = 'PUSH_CONFIG') {
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}/metadata`);
            const payload = { type: configType };
            const response = await this.ajax(url, 'PUT', payload);
            
            // Update current submission
            if (this.currentSubmission) {
                this.currentSubmission.data.status = this.DATA_STATUS.PUSH_NOTIFICATION_CONFIGURED;
            }
            
            return {
                success: true,
                message: 'Push configuration submitted to submission'
            };
        } catch (error) {
            throw new Error(`Failed to submit push configuration: ${error.message}`);
        }
    }

    /**
     * Upload image files to media endpoint
     */
    async uploadImages(imageFiles) {
        if (!imageFiles || imageFiles.length === 0) {
            return { success: true, urls: [] };
        }
        
        try {
            const formData = new FormData();
            imageFiles.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });
            
            const url = this.buildURL(`v1/media/files?appId=${this.appId}`);
            const response = await this.ajax(url, 'POST', formData, true);
            
            return {
                success: true,
                urls: response.files || [],
                firstUrl: response.files?.[0]
            };
        } catch (error) {
            throw new Error(`Failed to upload images: ${error.message}`);
        }
    }

    /**
     * Submit app metadata (App Store Listing)
     */
    async submitMetadata(submissionId, metadataPayload, hasNewSplashScreen = false) {
        // Add required encryption flag for new splash screens
        if (hasNewSplashScreen) {
            if (!metadataPayload.splashScreen) metadataPayload.splashScreen = {};
            metadataPayload.splashScreen.isEncrypted = true;
        }
        
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}/metadata`);
            const response = await this.ajax(url, 'PUT', metadataPayload);
            
            // Update current submission
            if (this.currentSubmission) {
                this.currentSubmission.data.status = this.DATA_STATUS.METADATA_SUBMITTED;
            }
            
            return {
                success: true,
                message: 'Metadata submitted successfully'
            };
        } catch (error) {
            throw new Error(`Failed to submit metadata: ${error.message}`);
        }
    }

    /**
     * Trigger build
     */
    async triggerBuild(submissionId) {
        // Validate that metadata is submitted
        if (this.currentSubmission?.data?.status !== this.DATA_STATUS.METADATA_SUBMITTED) {
            throw new Error('Cannot trigger build. Metadata must be submitted first.');
        }
        
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}/build`);
            const response = await this.ajax(url, 'POST');
            
            // Update current submission
            if (this.currentSubmission) {
                this.currentSubmission.data.status = this.DATA_STATUS.BUILD_TRIGGERED;
                this.currentSubmission.status = this.SUBMISSION_STATUS.BUILD_TRIGGERED;
            }
            
            return {
                success: true,
                message: 'Build triggered successfully',
                buildId: response.buildId
            };
        } catch (error) {
            throw new Error(`Failed to trigger build: ${error.message}`);
        }
    }

    /**
     * Cancel build
     */
    async cancelBuild(submissionId) {
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}/cancel`);
            const response = await this.ajax(url, 'POST');
            
            // Update current submission
            if (this.currentSubmission) {
                this.currentSubmission.status = this.SUBMISSION_STATUS.CANCELLED;
            }
            
            return {
                success: true,
                message: 'Build cancelled successfully'
            };
        } catch (error) {
            throw new Error(`Failed to cancel build: ${error.message}`);
        }
    }

    /**
     * Get submission status (for monitoring)
     */
    async getSubmissionById(submissionId) {
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions/${submissionId}`);
            const response = await this.ajax(url, 'GET');
            
            return {
                success: true,
                submission: response
            };
        } catch (error) {
            throw new Error(`Failed to get submission: ${error.message}`);
        }
    }

    /**
     * Get all submissions for platform
     */
    async getSubmissions(platform, status = null, type = 'appStore') {
        this.validatePlatform(platform);
        
        const params = { platform, type };
        if (status) params.status = status;
        
        try {
            const url = this.buildURL(`v2/apps/${this.appId}/submissions`);
            const response = await this.ajax(url, 'GET', params);
            
            return {
                success: true,
                submissions: response.data || []
            };
        } catch (error) {
            throw new Error(`Failed to get submissions: ${error.message}`);
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PublishingService;
} else if (typeof window !== 'undefined') {
    window.PublishingService = PublishingService;
}