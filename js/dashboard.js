/**
 * Dashboard Step - Platform Selection and Status Overview
 * 
 * Handles:
 * - Platform status checking (iOS/Android)
 * - Platform selection
 * - Progress visualization
 * - Navigation to next step
 */

function DashboardStep(publishingService, $container) {
  var selectedPlatform = null;
  
  // Initialize dashboard
  function init() {
    setupEventHandlers();
    loadPlatformStatuses();
  }
  
  function setupEventHandlers() {
    // Platform card selection
    $container.on('click', '.platform-card', function() {
      var platform = $(this).data('platform');
      selectPlatform(platform);
    });
    
    // Continue button
    $container.on('click', '#continue-btn', function() {
      if (selectedPlatform) {
        continueToPlatform();
      }
    });
  }
  
  function selectPlatform(platform) {
    // Remove previous selection
    $container.find('.platform-card').removeClass('selected');
    
    // Add selection to clicked platform
    $container.find(`.platform-card[data-platform="${platform}"]`).addClass('selected');
    
    selectedPlatform = platform;
    
    // Update continue button
    var platformName = platform === 'ios' ? 'iOS' : 'Android';
    $container.find('#selected-platform-name').text(platformName);
    $container.find('#continue-btn').prop('disabled', false);
    
    // Show platform info if needed
    showPlatformInfo(platform);
  }
  
  function showPlatformInfo(platform) {
    var info = getPlatformInfo(platform);
    if (info) {
      $container.find('#platform-details').html(info);
      $container.find('#platform-info').removeClass('d-none');
    }
  }
  
  function getPlatformInfo(platform) {
    if (platform === 'ios') {
      return '<strong>iOS Requirements:</strong> Apple Developer account with API key access, valid distribution certificate, App Bundle ID from App Store Connect.';
    } else if (platform === 'android') {
      return '<strong>Android Requirements:</strong> Google Play Console account, signing keystore (optional), Google Services configuration for push notifications.';
    }
    return null;
  }
  
  function continueToPlatform() {
    // Trigger navigation to next step
    var nextStep = selectedPlatform === 'ios' ? 'ios-api-key' : 'android-bundle-keystore';
    
    // Emit event for main widget to handle navigation
    $container.trigger('dashboard:navigate', {
      platform: selectedPlatform,
      nextStep: nextStep
    });
  }
  
  // Platform Status Functions
  async function loadPlatformStatuses() {
    if (!publishingService) return;
    
    const platforms = ['ios', 'android'];
    
    for (const platform of platforms) {
      try {
        updatePlatformStatus(platform, 'checking', 'Checking status...');
        const submissionState = await publishingService.getSubmissionState(platform);
        updatePlatformDisplay(platform, submissionState);
      } catch (error) {
        console.error(`Failed to load ${platform} status:`, error);
        updatePlatformStatus(platform, 'not-started', 'Ready to start');
        updatePlatformProgress(platform, 'initialize', []);
      }
    }
  }
  
  function updatePlatformDisplay(platform, submissionState) {
    const { submission, currentStep } = submissionState;
    
    if (!submission || submissionState.needsNewSubmission) {
      updatePlatformStatus(platform, 'not-started', 'Ready to start');
      updatePlatformProgress(platform, 'initialize', []);
      return;
    }
    
    // Determine overall status
    let statusClass, statusText;
    if (submission.status === 'completed') {
      statusClass = 'completed';
      statusText = 'Published';
    } else if (submission.status === 'failed') {
      statusClass = 'failed';
      statusText = 'Failed';
    } else if (submission.status === 'started') {
      statusClass = 'in-progress';
      statusText = `In progress (${getStepDisplayName(currentStep)})`;
    } else {
      statusClass = 'not-started';
      statusText = 'Ready to start';
    }
    
    updatePlatformStatus(platform, statusClass, statusText);
    
    // Update progress steps
    const completedSteps = getCompletedSteps(submission, platform);
    updatePlatformProgress(platform, currentStep, completedSteps);
  }
  
  function updatePlatformStatus(platform, statusClass, statusText) {
    const indicator = $container.find(`#${platform}-status-indicator`);
    const text = $container.find(`#${platform}-status-text`);
    
    // Remove all status classes and add the current one
    indicator.removeClass('not-started checking in-progress completed failed')
             .addClass(statusClass);
    
    text.text(statusText);
  }
  
  function updatePlatformProgress(platform, currentStep, completedSteps) {
    const progressContainer = $container.find(`#${platform}-progress`);
    const stepItems = progressContainer.find('.step-item');
    
    stepItems.each(function() {
      const $stepItem = $(this);
      const stepName = $stepItem.data('step');
      
      // Remove all status classes
      $stepItem.removeClass('completed current pending');
      
      if (completedSteps.includes(stepName)) {
        $stepItem.addClass('completed');
      } else if (stepName === currentStep) {
        $stepItem.addClass('current');
      } else {
        $stepItem.addClass('pending');
      }
    });
  }
  
  function getCompletedSteps(submission, platform) {
    if (!submission || !submission.data) return [];
    
    const dataStatus = submission.data.status;
    
    // Map data statuses to completed steps
    const statusMap = {
      'STORE_CONFIG_SUBMITTED': platform === 'ios' ? ['api-key', 'bundle-cert'] : ['bundle-keystore'],
      'PUSH_NOTIFICATION_CONFIGURED': platform === 'ios' ? ['api-key', 'bundle-cert', 'push-config'] : ['bundle-keystore', 'push-config'],
      'METADATA_SUBMITTED': platform === 'ios' ? ['api-key', 'bundle-cert', 'push-config', 'app-store-listing'] : ['bundle-keystore', 'push-config', 'app-store-listing'],
      'BUILD_TRIGGERED': platform === 'ios' ? ['api-key', 'bundle-cert', 'push-config', 'app-store-listing', 'build'] : ['bundle-keystore', 'push-config', 'app-store-listing', 'build']
    };
    
    return statusMap[dataStatus] || [];
  }
  
  function getStepDisplayName(step) {
    const stepNames = {
      'initialize': 'Starting',
      'api-key': 'API Key',
      'bundle-cert': 'Bundle & Cert',
      'bundle-keystore': 'Bundle & Key',
      'push-config': 'Push Config',
      'app-store-listing': 'Store Listing',
      'build': 'Building'
    };
    
    return stepNames[step] || step;
  }
  
  // Public API
  return {
    init: init,
    getSelectedPlatform: function() { return selectedPlatform; },
    refreshStatuses: loadPlatformStatuses
  };
}