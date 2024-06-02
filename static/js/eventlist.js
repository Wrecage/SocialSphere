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


document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.event-clicks-btn').forEach(button => {
        button.addEventListener('click', function () {
            const eventId = this.getAttribute('data-event-id');
            fetch(`/events/record_click/${eventId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    console.log('Click recorded');
                } else {
                    console.error('Failed to record click');
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function() {
        const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!csrfTokenElement) {
            console.error('CSRF token not found.');
            return;
        }
        const csrfToken = csrfTokenElement.value;
        fetch('/record_click/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log("Click recorded: ", data);
        })
        .catch((error) => {
            console.error("Error recording click: ", error);
        });
    });
});