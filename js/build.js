Fliplet.Widget.instance('publishing', function(data) {
  var $container = $(this);
  var widgetId = Fliplet.Widget.getDefaultId() || data.id || 'publishing-' + Date.now();

  $container.html('<p>Publishing widget loaded</p>');

  return {
    widgetId: widgetId
  };
});