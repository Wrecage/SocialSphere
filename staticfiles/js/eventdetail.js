

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


  window.closeEventDetail = function () {
    const eventDetailModal = document.getElementById('event-detail-overlay');
    if (eventDetailModal) {
      eventDetailModal.style.display = 'none';
    }
  
    if (isNewTab) {
      console.log("Opened directly in a new tab. Redirecting to landing page.");
      const scrollY = window.scrollY;
      window.location.href = `/?scrollY=${scrollY}`; // Redirect with scroll position
    } else {
      // Navigate back to the previous page
      window.history.go(-1);
    }
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
    document.getElementById('confirmDeleteButton').addEventListener('click', function () {
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
            // Fetch and re-render comments after deletion
            const eventIdElement = document.getElementById('eventId');
            const eventId = eventIdElement ? eventIdElement.value : null;
  
            if (eventId) {
              fetchAndDisplayComments(eventId);
            } else {
              console.error('Invalid Event ID. Cannot refresh comments.');
            }
          } else {
            alert('Failed to delete comment.');
          }
          closeDeleteModal(); // Close the delete confirmation modal

          // Handle the scenario where the modal needs to close in a new tab
          if (isNewTab) {
            console.log("Deleting in a new tab. Redirecting to landing page.");
            window.location.href = '/';
          }
        })
        .catch(error => {
          console.error('Error:', error);
          closeDeleteModal();
        })
        .finally(() => {
          loadingIcon.style.display = 'none';
          confirmButton.style.display = 'inline-block';
        });
    });
  }

  // Restore scroll position when redirected to landing page
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const scrollY = urlParams.get('scrollY');

  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY, 10)); // Restore scroll position
  }
});


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
  const deleteModal = document.getElementById('deleteCommentModal');
  const confirmDeleteButton = document.getElementById('confirmDeleteButton');
 
  if (!textarea || !form || !enterIcon || !loadingIcon || !deleteModal || !confirmDeleteButton) {
    console.error('One or more elements were not found in the DOM');
    return;
  }

  function submitFormWithReCaptcha() {
    enterIcon.style.display = 'none';
    loadingIcon.style.display = 'inline';
  
    grecaptcha.ready(function () {
      grecaptcha.execute('6Ld_NFkqAAAAAH_Zq5GLRSBSVHme3y5md8nWd9zs', { action: 'submit' })
        .then(function (token) {
          const formData = new FormData(form);
          formData.append('recaptcha_token', token);
  
          // Check for a valid eventId before submitting
          const eventIdElement = document.getElementById('eventId');
          const eventId = eventIdElement ? eventIdElement.value : null;

          if (!eventId || eventId === 'undefined') {
            console.error('Cannot submit comment: Invalid Event ID');
            loadingIcon.style.display = 'none';
            enterIcon.style.display = 'inline';
            return;
          }
  
          submitForm(formData);
        });
    });
  }
  

  function submitForm(formData) {
    fetch(form.action, {
      method: 'POST',
      headers: {
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
      },
      body: formData,
    })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json(); // Parse the response as JSON
      } else {
        return response.text().then(text => {
          console.log("Full response text:", text);
          throw new Error(`Unexpected response: ${text}`);
        });
      }
    })
    .then(data => {
      if (data.status === 'success') {

        const eventIdElement = document.getElementById('eventId');
        const eventId = eventIdElement ? eventIdElement.value : null;



        if (eventId) {
          fetchAndDisplayComments(eventId);
        } else {
          console.error('Cannot fetch comments: Invalid Event ID.');
        }
        form.reset(); // Clear the comment form after successful submission

      } else if (data.status === 'failed' && data.remaining_time) {
        showRatelimitModal(data.message, data.remaining_time);
      } else if (data.status === 'failed' && data.message === 'Spam detected. Please refrain from spamming the comment section.') {
        showErrorModal('Suspicious activity detected. Please stop submitting automated comments.');
      } else if (data.message.includes("prohibited language")) {
        showErrorModal("Your comment contains prohibited language.");
      } else if (data.message.includes("links are not allowed")) {
        showErrorModal("Comments with links are not allowed.");
      } else if (data.message.includes("reCAPTCHA verification failed")) {
        showErrorModal("Bot-like activity detected. Please try again.");
      } else if (data.message.includes('Comment cannot be empty')){
        showEmptyCommentModal("Comment cannot be empty")
      } else {
        alert('Failed to add comment');
      }

      enterIcon.style.display = 'inline';
      loadingIcon.style.display = 'none';
    })
    .catch(error => {
      console.error('Error occurred:', error);
      alert('An error occurred while submitting your comment. Please check the console for more details.');
      loadingIcon.style.display = 'none';
      enterIcon.style.display = 'inline';
    });
  }

  // Function to format date into 'Oct. 5, 2024, 11:35 p.m.' format in Manila time zone using native JavaScript
  function formatCommentDate(dateString) {
    const dateObj = new Date(dateString);

    // Convert the date to the Manila timezone using toLocaleString
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Manila',
    });
  }

  // Function to dynamically insert a new comment and attach delete logic
  

  function updateCommentCount(change) {
    const commentCountElement = document.querySelector('.comment-count');

    if (commentCountElement) {
      const currentCount = parseInt(commentCountElement.textContent, 10) || 0;
      commentCountElement.textContent = `${currentCount + change} Comments`;
    }
  }

  textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitFormWithReCaptcha();
    }
  });

  enterIcon.addEventListener('click', function() {
    submitFormWithReCaptcha();
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitFormWithReCaptcha();
  });


}


function showRatelimitModal(message, remainingTime) {
  const modal = document.getElementById('rateLimitRatelimitModal');
  document.getElementById('ratelimitMessage').innerText = message;
  document.getElementById('ratelimitRemainingTimeMessage').innerText = `Please wait ${remainingTime} seconds before commenting again.`;
  modal.style.display = 'block';
}

function showErrorModal(message, modalId = 'errorModal-profanity') {
  const modal = document.getElementById(modalId);
  const modalMessage = modal.querySelector('p');
  const closeButton = modal.querySelector('.close-custom');

  modalMessage.textContent = message;
  modal.style.display = 'block';

  // Close the modal when the user clicks the close button
  closeButton.onclick = function() {
      modal.style.display = 'none';
  };

  // Close the modal when the user clicks outside the modal content
  window.onclick = function(event) {
      if (event.target === modal) {
          modal.style.display = 'none';
      }
  };
}

// Function to close the custom rate limit modal
function closeRateLimitRatelimitModal() {
  document.getElementById('rateLimitRatelimitModal').style.display = 'none';
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






// for settings
function initializeCustomAvatarDropdown() {
  const customDropdown = document.getElementById('customAvatarDropdown');
  const selectedAvatar = document.getElementById('selectedAvatar');
  const avatarOptions = document.querySelectorAll('.dropdown-option');
  const hiddenAvatarInput = document.getElementById('avatarStyle');
  const livePreview = document.getElementById('livePreview');
  const ipSeedElement = document.getElementById('clientIpAddress');

  // Ensure the IP seed element exists
  if (!ipSeedElement) {
    console.error('IP seed element not found.');
    return;
  }
  
  const ipSeed = ipSeedElement.value; // Get the IP seed for consistent avatar generation

  // Dynamically update the avatar URL for each dropdown option based on the IP seed
  avatarOptions.forEach(option => {
    const avatarStyle = option.getAttribute('data-style');
    const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${ipSeed}`;
    const avatarImage = option.querySelector('img');
    if (avatarImage) {
      avatarImage.src = avatarUrl;
    }
  });

  // Set initial selected avatar preview based on default selected style
  const initialStyle = hiddenAvatarInput.value;
  document.getElementById('selectedAvatarImage').src = `https://api.dicebear.com/9.x/${initialStyle}/svg?seed=${ipSeed}`;
  livePreview.src = `https://api.dicebear.com/9.x/${initialStyle}/svg?seed=${ipSeed}`;

  // Toggle dropdown on clicking the selected avatar
  selectedAvatar.addEventListener('click', function () {
    const options = document.getElementById('avatarOptions');
    options.style.display = options.style.display === 'block' ? 'none' : 'block';
  });

  // Update selected avatar and close dropdown on option click
  avatarOptions.forEach(option => {
    option.addEventListener('click', function () {
      const selectedStyle = this.getAttribute('data-style');
      const selectedImage = this.querySelector('img').src;
      const selectedText = this.querySelector('span').textContent;

      // Update hidden input value for form submission
      hiddenAvatarInput.value = selectedStyle;

      // Update the selected avatar display in the dropdown
      document.getElementById('selectedAvatarImage').src = selectedImage;
      document.querySelector('.avatar-style-text').textContent = selectedText;

      // Update live preview with the selected style and seed
      livePreview.src = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${ipSeed}`;

      // Hide dropdown after selection
      document.getElementById('avatarOptions').style.display = 'none';
    });
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', function (event) {
    if (!customDropdown.contains(event.target)) {
      document.getElementById('avatarOptions').style.display = 'none';
    }
  });
  
}

document.addEventListener('DOMContentLoaded', initializeCustomAvatarDropdown);


function toggleText(eventId) {
  const captionText = document.getElementById('caption-text_' + eventId);
  const toggleBtn = document.getElementById('toggle-btn_' + eventId);

  // Retrieve full and truncated text from data attributes
  const fullText = captionText.getAttribute('data-fulltext');
  const truncatedText = captionText.getAttribute('data-truncated');



  // Check the current button state and toggle text accordingly
  if (toggleBtn.textContent === 'See More') {
      captionText.innerHTML = fullText; // Show full text
      toggleBtn.textContent = 'See Less'; // Change button text
  } else {
      captionText.innerHTML = truncatedText; // Show truncated text
      toggleBtn.textContent = 'See More'; // Change button text
  }


}

window.onload = function() {
  const captions = document.querySelectorAll('.caption-text');

  captions.forEach(caption => {
      const fullText = caption.innerHTML.trim();
      const maxLength = 100;  // Maximum character length before truncating

      if (fullText.length > maxLength) {
          const truncatedText = fullText.substring(0, maxLength) + '...';

          // Store full and truncated text in custom attributes
          caption.setAttribute('data-fulltext', fullText);
          caption.setAttribute('data-truncated', truncatedText);

          // Set the initial truncated text
          caption.innerHTML = truncatedText; // Show truncated text initially
      } else {
          // If the text is short enough, just set it without truncation
          caption.setAttribute('data-fulltext', fullText);
          caption.setAttribute('data-truncated', fullText);
          // Optionally, you might want to hide the toggle button if not needed
          const toggleBtn = document.getElementById('toggle-btn_' + caption.id.split('_')[1]); // Assuming IDs like 'caption_1'
          if (toggleBtn) {
              toggleBtn.style.display = 'none'; // Hide if no truncation needed
          }
      }
  });
};


function showEmptyCommentModal(message) {
  const modal = document.getElementById('emptyCommentModal');
  const modalMessage = document.getElementById('emptyCommentModalMessage');
  const modalClose = document.getElementById('emptyCommentModalClose');

  // Set the message in the modal
  modalMessage.textContent = message;

  // Show the modal
  modal.style.display = 'flex';

  // Close modal when clicking the close button
  modalClose.addEventListener('click', () => {
      modal.style.display = 'none';
  });

  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
      if (event.target === modal) {
          modal.style.display = 'none';
      }
  });
}

function submitComment() {
  const textarea = document.getElementById('commentTextarea');
  const comment = textarea.value.trim();
  const loadingIcon = document.getElementById('loadingIcon');

  // Validate the input
  if (comment === "") {
      showEmptyCommentModal("Comment cannot be empty");
      textarea.focus(); // Focus back on the textarea for user convenience
      return;
  }

  // Show loading spinner
  loadingIcon.style.display = 'inline-block';

  // Simulate submission process
  setTimeout(() => {
      showEmptyCommentModal("Comment submitted successfully!");
      textarea.value = ""; // Clear textarea after submission
      loadingIcon.style.display = 'none';
  }, 1000);
}

// Add event listener to the enter icon
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('enterIcon').addEventListener('click', submitComment);

  const modalClose = document.getElementById('emptyCommentModalClose');
  if (modalClose) {
      modalClose.addEventListener('click', () => {
          document.getElementById('emptyCommentModal').style.display = 'none';
      });
  }
});



let displayedComments = new Set();

document.addEventListener('DOMContentLoaded', function () {
    const eventIdElement = document.getElementById('eventId');
    if (!eventIdElement) {
        console.error('Event ID element not found!');
        return;
    }
    const eventId = eventIdElement.value;
    console.log(`Event ID: ${eventId}`);

    // Start polling for comments
    setInterval(() => {
        fetchAndDisplayComments(eventId);
    }, 5000);
});

function fetchAndDisplayComments(eventId) {
  const loadingIcon = document.getElementById('loadingIcon');
  
  if (!eventId || eventId === 'undefined') {
    console.error('Invalid Event ID passed to fetchAndDisplayComments:', eventId);
    return;
  }

  loadingIcon.style.display = 'inline-block'

  fetch(`/fetch_comments/${eventId}/`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.status === 'success') {
        const commentsSection = document.querySelector('.comments-section');
        commentsSection.innerHTML = '<h3>Comments</h3>'; // Clear comments section before re-rendering
        const userIp = data.user_ip;
        const isStaff = data.is_staff;
        const isSuperuser = data.is_superuser;

        data.comments.forEach(comment => {
          renderComment(comment, commentsSection, userIp, isStaff, isSuperuser);
        });
      } else {
        console.error('Failed to fetch comments:', data.message);
      }
    })
    .catch((error) => console.error('Error:', error))
    .finally(() => {
      loadingIcon.style.display = 'none'; // Stop loading icon
    });
}


function renderComment(comment, commentsSection, userIp, isStaff, isSuperuser) {
  const newComment = document.createElement('div');
  newComment.classList.add('comment');
  newComment.setAttribute('data-id', comment.id);

  const avatarUrl = `https://api.dicebear.com/9.x/${comment.avatar_style}/svg?seed=${comment.ip_address}`;

  
  const canDelete = comment.ip_address === userIp || isStaff || isSuperuser;

  newComment.innerHTML = `
    <div class="avatar-wrapper">
      <img src="${avatarUrl}" alt="Avatar" class="avatar">
    </div>
    <div class="comment-content">
      <div class="comment-text">${comment.text}</div>
      <div class="comment-date">${comment.date}</div>
    </div>

    ${canDelete ? `
      <button class="comment-delete-btn" data-id="${comment.id}" data-delete-url="/delete_comment/${comment.id}/">
          <i class="material-icons" style="font-size: 28px;">&#xe872;</i>
      </button>` : ''}
  `;

  commentsSection.appendChild(newComment);

  // Attach delete functionality only if the button exists
  const deleteButton = newComment.querySelector('.comment-delete-btn');
  if (deleteButton) {
    deleteButton.addEventListener('click', function () {
      showDeleteModal(comment.id, `/delete_comment/${comment.id}/`);
    });
  }
}