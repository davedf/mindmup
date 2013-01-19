$(function () {
  var sendFeedbackForm=function () {
    $('#modalPageInfo').val(window.location.href);
    $('#modalBrowserInfo').val(navigator.userAgent);
    $('#modalActivityLog').val(JSON.stringify(_userActivityLog));
    $('#modalScreenInfo').val(JSON.stringify(window.screen) + ' resolution:' + $(window).width() + 'x' + $(window).height());
    $('#modalFeedback form').submit();
  }
  window.sendErrorReport = function (message) {
    logActivity('Error',message);
    $('#modalFeedback textarea').val(message);
    $('#modalFeedback [name=q1_name]').val('automated error report');
    sendFeedbackForm();
  }
  $('#modalFeedback').on('show', function () {
    logActivity('Feedback','Open');
    $('#modalFeedback textarea').val('');
  });
  $('#sendFeedBackBtn').click(function () {
    logActivity('Feedback','Send');
    sendFeedbackForm();
    $('#modalFeedback').modal('hide');
    showAlert('Thank you for your feedback!','We\'ll get back to you as soon as possible.')
  });
});
