/**
 * iOS API Key Step - API Key Configuration and Management
 * 
 * Handles:
 * - API key selection from existing keys
 * - New API key creation
 * - API key validation
 * - Navigation to next step
 */

function IOSAPIKeyStep(publishingService, $container) {
  var selectedAPIKeyId = null;
  var submissionId = null;
  
  // Initialize iOS API Key step
  function init() {
    setupEventHandlers();
    loadAPIKeys();
  }
  
  function setupEventHandlers() {
    // Back button
    $container.on('click', '#back-btn', function() {
      navigateBack();
    });
    
    // Create new API key button
    $container.on('click', '#create-new-api-key', function() {
      toggleNewAPIKeyForm(true);
    });
    
    // API key selection
    $container.on('change', '#api-key-select', function() {
      selectedAPIKeyId = $(this).val();
      updateContinueButton();
    });
    
    // Validate API key button
    $container.on('click', '#validate-api-key', function() {
      validateSelectedAPIKey();
    });
    
    // Continue button
    $container.on('click', '#continue-api-key', function() {
      continueFromAPIKey();
    });
    
    // New API key form submission
    $container.on('click', '#save-new-api-key', function() {
      createNewAPIKey();
    });
  }
  
  function loadAPIKeys() {
    if (!publishingService) {
      showError('Publishing service not available');
      return;
    }
    
    publishingService.getAPIKeys().then(function(result) {
      var select = $container.find('#api-key-select');
      
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
    var form = $container.find('#new-api-key-form');
    var button = $container.find('#create-new-api-key');
    
    if (show) {
      form.removeClass('d-none');
      button.text('Cancel').removeClass('btn-secondary').addClass('btn-outline-secondary');
      
      // Add save button if not exists
      if ($container.find('#save-new-api-key').length === 0) {
        form.append('<button id="save-new-api-key" class="btn btn-primary mt-3">Save API Key</button>');
      }
    } else {
      form.addClass('d-none');
      button.text('Create New API Key').removeClass('btn-outline-secondary').addClass('btn-secondary');
      clearNewAPIKeyForm();
    }
  }
  
  function clearNewAPIKeyForm() {
    $container.find('#api-key-name').val('');
    $container.find('#api-key-id').val('');
    $container.find('#api-issuer-id').val('');
    $container.find('#api-private-key').val('');
  }
  
  function createNewAPIKey() {
    var name = $container.find('#api-key-name').val().trim();
    var keyId = $container.find('#api-key-id').val().trim();
    var issuerId = $container.find('#api-issuer-id').val().trim();
    var privateKeyFile = $container.find('#api-private-key')[0].files[0];
    
    // Validate required fields
    if (!name || !keyId || !issuerId || !privateKeyFile) {
      showError('All fields are required for creating a new API key');
      return;
    }
    
    showLoading($container.find('#save-new-api-key'), 'Creating...');
    
    // Read the private key file
    var reader = new FileReader();
    reader.onload = function(e) {
      var privateKeyContent = e.target.result;
      
      // Create API key
      publishingService.createAPIKey({
        name: name,
        keyId: keyId,
        issuerId: issuerId,
        privateKey: privateKeyContent
      }).then(function(result) {
        showSuccess('API key created successfully');
        toggleNewAPIKeyForm(false);
        loadAPIKeys(); // Reload the list
        
        // Auto-select the new key
        setTimeout(function() {
          $container.find('#api-key-select').val(result.apiKey.id);
          selectedAPIKeyId = result.apiKey.id;
          updateContinueButton();
        }, 500);
      }).catch(function(error) {
        showError('Failed to create API key: ' + error.message);
      }).finally(function() {
        hideLoading($container.find('#save-new-api-key'), 'Save API Key');
      });
    };
    
    reader.onerror = function() {
      showError('Failed to read private key file');
      hideLoading($container.find('#save-new-api-key'), 'Save API Key');
    };
    
    reader.readAsText(privateKeyFile);
  }
  
  function validateSelectedAPIKey() {
    if (!selectedAPIKeyId) {
      showError('Please select an API key first');
      return;
    }
    
    showLoading($container.find('#validate-api-key'), 'Validating...');
    
    publishingService.validateAPIKey(selectedAPIKeyId).then(function(result) {
      if (result.valid) {
        showSuccess('API key is valid and ready to use');
      } else {
        showError('API key validation failed: ' + (result.error || 'Unknown error'));
      }
    }).catch(function(error) {
      showError('Failed to validate API key: ' + error.message);
    }).finally(function() {
      hideLoading($container.find('#validate-api-key'), 'Validate Key');
    });
  }
  
  function continueFromAPIKey() {
    if (!selectedAPIKeyId) {
      showError('Please select an API key before continuing');
      return;
    }
    
    showLoading($container.find('#continue-api-key'), 'Proceeding...');
    
    Promise.resolve().then(function() {
      // Create submission if needed
      if (!submissionId) {
        return publishingService.createSubmission('ios', selectedAPIKeyId);
      }
    }).then(function(result) {
      if (result) {
        submissionId = result.submission.id;
      }
      
      // Navigate to next step
      $container.trigger('ios-api-key:navigate', {
        platform: 'ios',
        nextStep: 'ios-bundle-cert',
        submissionId: submissionId,
        apiKeyId: selectedAPIKeyId
      });
      
    }).catch(function(error) {
      showError('Failed to proceed: ' + error.message);
    }).finally(function() {
      hideLoading($container.find('#continue-api-key'), 'Continue');
    });
  }
  
  function navigateBack() {
    $container.trigger('ios-api-key:navigate', {
      platform: null,
      nextStep: 'dashboard'
    });
  }
  
  function updateContinueButton() {
    var continueBtn = $container.find('#continue-api-key');
    continueBtn.prop('disabled', !selectedAPIKeyId);
  }
  
  function showError(message) {
    clearMessages();
    var alertHtml = '<div class="alert alert-danger">' +
      '<strong>Error:</strong> ' + message +
      '</div>';
    $container.find('.publishing-card-body').prepend(alertHtml);
  }
  
  function showSuccess(message) {
    clearMessages();
    var alertHtml = '<div class="alert alert-success">' +
      '<strong>Success:</strong> ' + message +
      '</div>';
    $container.find('.publishing-card-body').prepend(alertHtml);
    
    // Auto-hide success messages
    setTimeout(clearMessages, 5000);
  }
  
  function clearMessages() {
    $container.find('.alert').remove();
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
  
  // Public API
  return {
    init: init,
    getSelectedAPIKeyId: function() { return selectedAPIKeyId; },
    getSubmissionId: function() { return submissionId; },
    setSubmissionId: function(id) { submissionId = id; },
    refreshAPIKeys: loadAPIKeys
  };
}