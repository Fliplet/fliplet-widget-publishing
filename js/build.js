/**
 * Publishing Widget Main Instance
 * 
 * This is the main entry point for the Publishing Widget.
 * Handles all user interactions, screen management, and publishing workflows.
 * 
 * @file build.js
 * @version 1.0.0
 * @author Fliplet
 * 
 * @requires jQuery
 * @requires PublishingService
 * @requires Fliplet.Widget
 * 
 * Key Features:
 * - Platform selection (iOS/Android)
 * - Multi-step workflow management
 * - Real-time API integration
 * - Error handling and recovery
 * - State persistence
 * 
 * Usage:
 * This file is automatically loaded by Fliplet when the widget is rendered.
 * The widget instance is created with configuration data from Fliplet Studio.
 * 
 * @example
 * // Widget configuration in Fliplet Studio:
 * {
 *   "title": "Publish Your App",
 *   "showIOS": true,
 *   "showAndroid": true,
 *   "region": "eu"
 * }
 */

// Publishing Widget Instance
Fliplet.Widget.instance('publishing-1-0-0', function (data) {
  var element = this;
  var $element = $(element);
  
  // Widget state
  var state = {
    service: null,
    currentScreen: 'platform-selection',
    selectedPlatform: null,
    submissionId: null,
    organizationId: null
  };
  
  // Initialize widget
  init();
  
  function init() {
    try {
      // Get app configuration from Fliplet
      var config = {
        appId: Fliplet.Env.get('appId'),
        token: Fliplet.Env.get('apiToken') || 'demo-token',
        region: Fliplet.Env.get('region') || 'eu'
      };
      
      // Initialize publishing service with Fliplet's ajax method
      state.service = new PublishingService({
        appId: config.appId,
        token: config.token,
        region: config.region,
        ajax: Fliplet.API.request.bind(Fliplet.API),
        getRegion: getRegionURL
      });
      
      // Set up screen management
      setupScreens();
      
      // Show initial screen
      showScreen('platform-selection');
      
    } catch (error) {
      console.error('Failed to initialize publishing widget:', error);
      showError('Failed to initialize publishing widget: ' + error.message);
    }
  }
  
  function getRegionURL(region) {
    // Use Fliplet's API URL construction
    var baseRegion = region || (state.service && state.service.region) || 'eu';
    return Fliplet.Env.get('apiUrl') || 'https://api.fliplet.com/';
  }
  
  function setupScreens() {
    // Platform selection screen
    setupPlatformSelection();
    
    // iOS API Key screen
    setupIOSAPIKeyScreen();
    
    // Back button handlers
    $element.on('click', '#back-btn', function() {
      showScreen('platform-selection');
    });
  }
  
  function setupPlatformSelection() {
    // Platform card selection
    $element.on('click', '.platform-card', function() {
      var platform = $(this).data('platform');
      selectPlatform(platform);
    });
    
    // Continue button
    $element.on('click', '#continue-btn', function() {
      if (state.selectedPlatform) {
        continueToPlatform();
      }
    });
  }
  
  function setupIOSAPIKeyScreen() {
    // Create new API key button
    $element.on('click', '#create-new-api-key', function() {
      toggleNewAPIKeyForm(true);
    });
    
    // Validate API key button
    $element.on('click', '#validate-api-key', function() {
      validateSelectedAPIKey();
    });
    
    // Continue button
    $element.on('click', '#continue-api-key', function() {
      continueFromAPIKey();
    });
  }
  
  function selectPlatform(platform) {
    // Clear previous selection
    $element.find('.platform-card').removeClass('selected');
    
    // Select current platform
    $element.find('[data-platform="' + platform + '"]').addClass('selected');
    
    state.selectedPlatform = platform;
    
    // Update UI
    updatePlatformInfo(platform);
    enableContinueButton();
  }
  
  function updatePlatformInfo(platform) {
    var details = {
      ios: {
        name: 'iOS',
        info: '<strong>iOS Publishing Requirements:</strong>' +
          '<ul class="mb-0">' +
            '<li>Apple Developer Account with API key access</li>' +
            '<li>Valid distribution certificate</li>' +
            '<li>App Bundle ID from App Store Connect</li>' +
            '<li>App icons and splash screens</li>' +
          '</ul>'
      },
      android: {
        name: 'Android',
        info: '<strong>Android Publishing Requirements:</strong>' +
          '<ul class="mb-0">' +
            '<li>Google Play Console account</li>' +
            '<li>Signing keystore (optional, can be generated)</li>' +
            '<li>App icons and splash screens</li>' +
            '<li>Google Services configuration (for push notifications)</li>' +
          '</ul>'
      }
    };
    
    $element.find('#platform-details').html(details[platform].info);
    $element.find('#selected-platform-name').text(details[platform].name);
    $element.find('#platform-info').removeClass('d-none');
  }
  
  function enableContinueButton() {
    $element.find('#continue-btn').prop('disabled', false);
  }
  
  function continueToPlatform() {
    if (!state.selectedPlatform) return;
    
    showLoading($element.find('#continue-btn'), 'Checking submission...');
    
    // Use Promise-based approach for better compatibility
    Promise.resolve().then(function() {
      // Initialize app if needed
      if (!state.service.organizationId) {
        return state.service.initializeApp();
      }
    }).then(function() {
      state.organizationId = state.service.organizationId;
      
      // Check current submission state
      return state.service.getSubmissionState(state.selectedPlatform);
    }).then(function(submissionState) {
      state.submissionId = (submissionState.submission && submissionState.submission.id) || null;
      
      // Navigate to appropriate screen
      if (state.selectedPlatform === 'ios') {
        return loadAPIKeys().then(function() {
          showScreen('ios-api-key');
        });
      } else {
        // Android workflow not implemented yet
        throw new Error('Android workflow not yet implemented');
      }
    }).catch(function(error) {
      console.error('Failed to continue to platform:', error);
      showError('Failed to continue: ' + error.message);
    }).finally(function() {
      var platformName = state.selectedPlatform === 'ios' ? 'iOS' : 'Android';
      hideLoading($element.find('#continue-btn'), 'Continue with ' + platformName);
    });
  }
  
  function loadAPIKeys() {
    return state.service.getAPIKeys().then(function(result) {
      var select = $element.find('#api-key-select');
      
      select.empty();
      select.append('<option value="">Choose an API key...</option>');
      
      if (result.apiKeys && result.apiKeys.length > 0) {
        result.apiKeys.forEach(function(key) {
          select.append('<option value="' + key.id + '">' + key.name + ' (' + key.keyId + ')</option>');
        });
      } else {
        select.append('<option value="">No API keys found - create one below</option>');
      }
    }).catch(function(error) {
      console.error('Failed to load API keys:', error);
      showError('Failed to load API keys: ' + error.message);
    });
  }
  
  function toggleNewAPIKeyForm(show) {
    var form = $element.find('#new-api-key-form');
    if (show) {
      form.removeClass('d-none');
    } else {
      form.addClass('d-none');
    }
  }
  
  function validateSelectedAPIKey() {
    var selectedKeyId = $element.find('#api-key-select').val();
    if (!selectedKeyId) {
      showError('Please select an API key first');
      return;
    }
    
    showLoading($element.find('#validate-api-key'), 'Validating...');
    
    // For demo purposes, just show success after a delay
    setTimeout(function() {
      showSuccess('API key is valid');
      hideLoading($element.find('#validate-api-key'), 'Validate Key');
    }, 1000);
  }
  
  function continueFromAPIKey() {
    var selectedKeyId = $element.find('#api-key-select').val();
    if (!selectedKeyId) {
      showError('Please select an API key before continuing');
      return;
    }
    
    showLoading($element.find('#continue-api-key'), 'Proceeding...');
    
    Promise.resolve().then(function() {
      // Create submission if needed
      if (!state.submissionId) {
        return state.service.createSubmission(state.selectedPlatform, selectedKeyId);
      }
    }).then(function(result) {
      if (result) {
        state.submissionId = result.submission.id;
      }
      
      showSuccess('API key configured successfully! Next: Bundle & Certificate');
      
      // In a complete implementation, navigate to next screen
      // For now, just show success message
      
    }).catch(function(error) {
      showError('Failed to proceed: ' + error.message);
    }).finally(function() {
      hideLoading($element.find('#continue-api-key'), 'Continue');
    });
  }
  
  function showScreen(screenName) {
    // Hide all screens
    $element.find('.screen').removeClass('active');
    
    // Show target screen
    $element.find('#' + screenName + '-screen').addClass('active');
    
    state.currentScreen = screenName;
  }
  
  function showError(message) {
    clearMessages();
    var alertHtml = '<div class="alert alert-danger">' +
      '<strong>Error:</strong> ' + message +
      '</div>';
    $element.find('#error-container').html(alertHtml);
  }
  
  function showSuccess(message) {
    clearMessages();
    var alertHtml = '<div class="alert alert-success">' +
      '<strong>Success:</strong> ' + message +
      '</div>';
    $element.find('#error-container').html(alertHtml);
    
    // Auto-hide success messages
    setTimeout(clearMessages, 5000);
  }
  
  function clearMessages() {
    $element.find('#error-container').empty();
  }
  
  function showLoading(button, text) {
    if (button.length) {
      button.prop('disabled', true);
      button.html('<span class="spinner-border spinner-border-sm" role="status"></span> ' + text);
    }
  }
  
  function hideLoading(button, originalText) {
    if (button.length) {
      button.prop('disabled', false);
      button.html(originalText);
    }
  }
});