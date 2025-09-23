Fliplet().then(function () {
  $(window).on('resize', Fliplet.Widget.autosize);
  
  // Initialize form with default values
  var data = Fliplet.Widget.getData() || {};
  
  // Set default values if not provided
  if (!data.title) {
    $('#widget-title').val('Publish Your App');
  }
  
  if (data.showIOS === undefined) {
    $('#show-ios').prop('checked', true);
  }
  
  if (data.showAndroid === undefined) {
    $('#show-android').prop('checked', true);
  }
  
  if (!data.region) {
    $('#api-region').val('eu');
  }
  
  if (!data.helpText) {
    $('#help-text').val('Choose the platform where you want to publish your app');
  }
  
  // Auto-resize the widget
  Fliplet.Widget.autosize();

  $('form').submit(function (event) {
    event.preventDefault();
    
    // Validate that at least one platform is enabled
    var showIOS = $('#show-ios').is(':checked');
    var showAndroid = $('#show-android').is(':checked');
    
    if (!showIOS && !showAndroid) {
      alert('Please enable at least one publishing platform (iOS or Android)');
      return;
    }

    Fliplet.Widget.save({
      title: $('#widget-title').val(),
      showIOS: showIOS,
      showAndroid: showAndroid,
      region: $('#api-region').val(),
      helpText: $('#help-text').val()
    }).then(function () {
      Fliplet.Widget.complete();
    });
  });
  
  // Handle checkbox changes for dynamic updates
  $('#show-ios, #show-android').on('change', function() {
    var showIOS = $('#show-ios').is(':checked');
    var showAndroid = $('#show-android').is(':checked');
    
    // Update UI to show/hide platform options
    if (!showIOS && !showAndroid) {
      $('.alert-warning').remove();
      $('<div class="alert alert-warning">Warning: At least one platform must be enabled for the widget to function.</div>').insertAfter('form');
    } else {
      $('.alert-warning').remove();
    }
  });
  
  // Handle region changes
  $('#api-region').on('change', function() {
    var region = $(this).val();
    var regions = {
      eu: 'Europe (EU)',
      us: 'United States (US)',
      ca: 'Canada (CA)'
    };
    
    // Show info about the selected region
    $('.region-info').remove();
    $('<small class="region-info help-block">Selected: ' + regions[region] + ' - Apps will use this region\'s API endpoints</small>').insertAfter('#api-region');
  });

  // Fired from Fliplet Studio when the external save button is clicked
  Fliplet.Widget.onSaveRequest(function () {
    $('form').submit();
  });
});
