document.addEventListener('DOMContentLoaded', function() {
  window.showDeleteModal = function(commentId, deleteUrl) {
    const modal = document.getElementById('deleteCommentModal');
    const confirmButton = document.getElementById('confirmDeleteButton');
    
    confirmButton.setAttribute('data-comment-id', commentId);
    confirmButton.setAttribute('data-delete-url', deleteUrl);
    modal.style.display = 'block';
    if (window.history && window.history.pushState) {
      window.history.pushState('forward', null, './#deleteModal');
    }
  }

  window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteCommentModal');
    const confirmButton = document.getElementById('confirmDeleteButton');
    const loadingIcon = document.getElementById('deleteLoadingIcon');

    modal.style.display = 'none';
    confirmButton.style.display = 'inline-block';  // Make the confirm button visible again
    loadingIcon.style.display = 'none';  // Hide the loading icon if it was displayed
    if (window.history && window.history.state === 'forward') {
      window.history.back();
    }
  }



window.closeEventDetail = function() {
    window.history.back();
};

  window.goHome = function() {
    window.location.href = '/';
  }

  window.addEventListener('popstate', function() {
    const eventDetailModal = document.getElementById('event-detail-overlay');
    const deleteModal = document.getElementById('deleteCommentModal');
    if (eventDetailModal.style.display === 'block') {
      eventDetailModal.style.display = 'none';
    }
    if (deleteModal.style.display === 'block') {
      deleteModal.style.display = 'none';
    }
  });

  function handleDeleteButtonClick() {
    document.querySelectorAll('.comment-delete-btn').forEach(button => {
      button.addEventListener('click', function() {
        const commentId = this.getAttribute('data-id');
        const deleteUrl = this.getAttribute('data-delete-url');
        showDeleteModal(commentId, deleteUrl);
      });
    });
  }

  function handleConfirmDeleteButtonClick() {
    document.getElementById('confirmDeleteButton').addEventListener('click', function() {
      const commentId = this.getAttribute('data-comment-id');
      const deleteUrl = this.getAttribute('data-delete-url');
      const loadingIcon = document.getElementById('deleteLoadingIcon');
      const confirmButton = document.getElementById('confirmDeleteButton');
      
      loadingIcon.style.display = 'inline-block';
      confirmButton.style.display = 'none';
      
      fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          document.querySelector(`button[data-id="${commentId}"]`).parentElement.remove();
        } else {
          alert('Failed to delete comment');
        }
        closeDeleteModal();
      })
      .catch(error => {
        console.error('Error:', error);
        closeDeleteModal();
      });
    });
  }

  function initialize() {
    handleDeleteButtonClick();
    handleConfirmDeleteButtonClick();
    initializeCommentForm();
  }

  initialize();
});

function initializeCommentForm() {
  const textarea = document.getElementById('commentTextarea');
  const form = document.getElementById('commentForm');
  const enterIcon = document.getElementById('enterIcon');
  const loadingIcon = document.getElementById('loadingIcon');

  if (!textarea || !form || !enterIcon || !loadingIcon) {
      console.error('One or more elements were not found in the DOM');
      return;
  }

  function submitForm() {
      enterIcon.style.display = 'none';
      loadingIcon.style.display = 'inline';
      form.submit();
  }

  textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitForm();
      }
  });

  enterIcon.addEventListener('click', function () {
      submitForm();
  });

  form.addEventListener('submit', function () {
      enterIcon.style.display = 'none';
      loadingIcon.style.display = 'inline';
  });
}

window.onload = function() {
  const eventListURL = '/'; // Adjust this to match your event list or landing page URL
  const eventPostURL = 'events/posts/'
  
  if (document.referrer.includes(eventListURL)) {
    document.getElementById('close-button').style.display = 'flex';
  } else {
    document.getElementById('close-button').style.display = 'none';
  }

  if (document.referrer.includes(eventPostURL)) {
    document.getElementById('home-button').style.display = 'none';
  } else {
      document.getElementById('home-button').style.display = 'block'; // Show by default unless specified otherwise
  }
};
