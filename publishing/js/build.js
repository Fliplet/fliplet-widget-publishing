// Include your namespaced libraries
var mySampleCoreLibrary = new Fliplet.Registry.get('publishing:1.0:core');

// This function will run for each instance found in the page
Fliplet.Widget.instance('publishing-1-0-0', function (data) {
  // The HTML element for each instance. You can use $(element) to use jQuery functions on it
  var element = this;

  // Sample implementation to initialise the widget
  var foo = new mySampleCoreLibrary(element, data);

  // Handle form submission to show alert
  $(element).find('.form-alert').on('submit', function(e) {
    e.preventDefault();

    var userInput = $(this).find('#userInput').val();

    if (userInput.trim()) {
      alert(userInput);
    } else {
      alert('Please enter some text!');
    }
  });
});