function loadJQuery(callback) {
    var script = document.createElement("script");
    script.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js";
    script.onload = callback;
    document.head.appendChild(script);
}

function handleEventActions() {
    $(document).ready(function() {
        $('.event-like-btn').click(function() {
            var eventId = $(this).data('event-id');
            var $this = $(this);  // Cache this to use in the callback

            // Check current state
            var isLiked = $this.hasClass('highlighted');
            
            // Optimistically update the UI
            $this.toggleClass('highlighted', !isLiked);
            $this.find('span').text(!isLiked ? 'Liked' : 'Like');
            var icon = $this.find('i');
            icon.addClass('animate');
            setTimeout(() => {
                icon.removeClass('animate');
            }, 600); // Duration of the animation

            // Send the AJAX request
            $.ajax({
                url: '/like_event/' + eventId + '/',
                method: 'POST',
                data: {
                    'csrfmiddlewaretoken': getCsrfToken()
                },
                success: function(response) {
                    console.log(response);
                    if (response.status !== 'success') {
                        // Revert the UI changes if the request fails
                        $this.toggleClass('highlighted', isLiked);
                        $this.find('span').text(isLiked ? 'Liked' : 'Like');
                    }
                }
            });
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

function handleEventClicks() {
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
}

function handleGeneralClickRecording() {
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
}

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

function observeVisibleElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    });

    const hiddenElements = document.querySelectorAll('.event');
    hiddenElements.forEach((el) => observer.observe(el));
}

function initializeEventListeners() {
    document.addEventListener('DOMContentLoaded', (event) => {
        observeVisibleElements();
        handleEventClicks();
        handleGeneralClickRecording();
        handleModal();
    });
}

function handleModal() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.querySelector('.close');

    function openModal(content) {
        if (modalBody) {
            modalBody.innerHTML = content;
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
            if (window.history && window.history.pushState) {
                window.history.pushState('forward', null, './#eventDetail');
            }
        } else {
            console.error('Modal body not found.');
        }
    }

   function closeModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        if (window.history && window.history.state === 'forward') {
            window.history.back();
        }
    }

    document.querySelectorAll('.event-detail-link').forEach(function(element) {
        element.addEventListener('click', function(event) {
            event.preventDefault();
            const url = this.href;

            fetch(url)
                .then(response => response.text())
                .then(html => {
                    openModal(html);
                });
        });
    });

    closeModalButton.addEventListener('click', closeModal);

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    window.addEventListener('popstate', function() {
        if (modal.style.display === 'block') {
            closeModal();
        }
    });


}

document.addEventListener('DOMContentLoaded', handleModal);

// Load jQuery dynamically before executing handleEventActions
loadJQuery(handleEventActions);

// Initialize other event listeners
initializeEventListeners();


