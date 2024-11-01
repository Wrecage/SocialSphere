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
    const eventDetailModal = document.getElementById('event-detail-overlay');
    if (eventDetailModal) {
        eventDetailModal.style.display = 'none';
    }
    
    // Ensure a single "back" operation takes us to the event list page
    if (window.history && window.history.length > 1) {
        window.history.go(-1);  // Only one "back" operation needed
    } else {
        window.location.href = '/';  // Replace with your event list URL if history navigation fails
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
          // Remove the comment from the DOM without altering history
            document.querySelector(`button[data-id="${commentId}"]`).parentElement.remove();

            // Do NOT push any history states during comment deletion
            const deleteModal = document.getElementById('deleteCommentModal');
            if (deleteModal) {
                deleteModal.style.display = 'none';
            }
        } else {
            alert('Failed to delete comment');
        }
        closeDeleteModal();  // Close the delete confirmation modal
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
  const deleteModal = document.getElementById('deleteCommentModal');
  const confirmDeleteButton = document.getElementById('confirmDeleteButton');
  let currentDeleteCommentId = null;
  let currentDeleteUrl = null;

  if (!textarea || !form || !enterIcon || !loadingIcon || !deleteModal || !confirmDeleteButton) {
    console.error('One or more elements were not found in the DOM');
    return;
  }

  function submitFormWithReCaptcha() {
    enterIcon.style.display = 'none';
    loadingIcon.style.display = 'inline';

    // Call reCAPTCHA v3 and get the token before submitting the form
    grecaptcha.ready(function() {
      grecaptcha.execute('6Ld_NFkqAAAAAH_Zq5GLRSBSVHme3y5md8nWd9zs', { action: 'submit' }).then(function(token) {


        // Add the reCAPTCHA token to the form data
        const formData = new FormData(form);
        formData.append('recaptcha_token', token);

        // Submit the form data with the reCAPTCHA token
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
        insertNewComment(data);
        updateCommentCount(1);  // Increment comment count by 1
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
      } else {
        alert('Failed to add comment');
      }

      enterIcon.style.display = 'inline';
      loadingIcon.style.display = 'none';
    })
    .catch(error => {
      console.error('Error occurred:', error);
      alert('An error occurred while submitting your comment. Please check the console for more details.');
      enterIcon.style.display = 'inline';
      loadingIcon.style.display = 'none';
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
  function insertNewComment(data) {
    const commentsSection = document.querySelector('.comments-section');
  
    if (commentsSection) {
      const newComment = document.createElement('div');
      newComment.classList.add('comment');
      newComment.setAttribute('data-id', data.comment_id);
  
      const avatarUrl = `https://api.dicebear.com/9.x/${data.avatar_style}/svg?seed=${data.ip_address}`;
  
      // Construct the comment element structure
      const avatarWrapper = document.createElement('div');
      avatarWrapper.classList.add('avatar-wrapper');
      const avatarImg = document.createElement('img');
      avatarImg.src = avatarUrl;
      avatarImg.alt = "Avatar";
      avatarImg.classList.add('avatar');
      avatarWrapper.appendChild(avatarImg);
  
      const commentContent = document.createElement('div');
      commentContent.classList.add('comment-content');
      const commentText = document.createElement('div');
      commentText.classList.add('comment-text');
      commentText.textContent = data.comment_text;
  
      // Use the formatted date provided by the Django backend
      const commentDate = document.createElement('div');
      commentDate.classList.add('comment-date');
      commentDate.textContent = data.comment_date;  // Directly use the pre-formatted date from Django
  
      commentContent.appendChild(commentText);
      commentContent.appendChild(commentDate);
  
      // Create delete button for the comment
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('comment-delete-btn');
      deleteButton.setAttribute('data-id', data.comment_id);
      deleteButton.setAttribute('data-delete-url', `/delete_comment/${data.comment_id}/`);
      deleteButton.innerHTML = '<i class="material-icons" style="font-size: 28px;">&#xe872;</i>';
  
      // Append the constructed elements to the new comment
      newComment.appendChild(avatarWrapper);
      newComment.appendChild(commentContent);
      newComment.appendChild(deleteButton);
  
      // Insert the new comment directly below the <h3>Comments</h3> element
      const commentsHeader = commentsSection.querySelector('h3');
      if (commentsHeader) {
        commentsHeader.insertAdjacentElement('afterend', newComment);
      } else {
        commentsSection.appendChild(newComment);
      }
  
      // Attach delete functionality to the new delete button
      deleteButton.addEventListener('click', function() {
        showDeleteModal(data.comment_id, deleteButton.getAttribute('data-delete-url'));
      });
    }
  }

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