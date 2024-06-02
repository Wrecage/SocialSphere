function loadJQuery(callback) {
  var script = document.createElement("script");
  script.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js";
  script.onload = callback;
  document.head.appendChild(script);
}

function handleEventActions() {
  $(document).ready(function(){
      $('.event-like-btn').click(function(){
          var eventId = $(this).data('event-id');
          sendAjaxRequest('/like_event/', eventId, {'csrfmiddlewaretoken': getCsrfToken()});
      });

      $('.event-comment-btn').click(function(){
          var eventId = $(this).data('event-id');
          var commentText = prompt("Enter your comment:");
          if(commentText) {
              sendAjaxRequest('/add_comment/', eventId, {'comment_text': commentText, 'csrfmiddlewaretoken': getCsrfToken()});
          }
      });
  });

  function sendAjaxRequest(url, eventId, data) {
      $.ajax({
          url: url + eventId + '/',
          method: 'POST',
          data: data,
          success: function(response){
              alert(response.message);
          }
      });
  }

  function getCsrfToken() {
      return $('meta[name="csrf-token"]').attr('content');
  }
}

// Load jQuery dynamically before executing handleEventActions
loadJQuery(handleEventActions);
