

    
    function clearImagePreview(imagePreview, clearImageButton) {
        imagePreview.innerHTML = '';
        if (clearImageButton) {
            clearImageButton.style.display = 'none'; 
        }
    }



    function initializeFileInput() {
        const fileInput = document.getElementById('file-input');
        const imagePreview = document.getElementById('image-preview');

        fileInput.addEventListener('change', () => {
            handleFileInputChange(fileInput, imagePreview);
        });

        const clearImageButton = document.getElementById('clear-image-button');
        if (clearImageButton) {
            clearImageButton.addEventListener('click', () => {
                clearImagePreview(imagePreview, clearImageButton);
            });
        }
    }


    function displayClearImageButton(imagePreview) {
        let clearImageButton = document.getElementById('clear-image-button');
        if (!clearImageButton) {
            clearImageButton = document.createElement('button');
            clearImageButton.textContent = 'Clear Image';
            clearImageButton.id = 'clear-image-button';
            clearImageButton.addEventListener('click', () => {
                clearImagePreview(imagePreview, clearImageButton);
            });
            imagePreview.parentNode.appendChild(clearImageButton);
        } else {
            clearImageButton.style.display = 'block';
        }
    }
    

    function handleFileInputChange(fileInput, imagePreview) {
        imagePreview.innerHTML = '';
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const reader = new FileReader();
            reader.onload = () => {
                const img = document.createElement('img');
                img.src = reader.result;
                imagePreview.appendChild(img);
                displayClearImageButton(imagePreview);

            };
            reader.readAsDataURL(file);
        }
    }

    function initializeDeleteModal() {
        const deleteBtns = document.querySelectorAll('.event-delete-btn');
        const deleteModal = document.getElementById('deleteModal');
        const deleteSpan = document.getElementsByClassName('close')[0];
        const cancelBtn = document.getElementsByClassName('cancel-delete-btn')[0];
        const deleteForm = document.getElementById('deleteForm');
    
        deleteBtns.forEach(btn => {
            btn.onclick = function() {
                const deleteUrl = this.getAttribute('data-delete-url');
                deleteForm.action = deleteUrl;
                deleteModal.style.display = 'block';
            }
        });
    
        deleteSpan.onclick = function() {
            deleteModal.style.display = 'none';
        }
    
        cancelBtn.onclick = function() {
            deleteModal.style.display = 'none';
        }
    
        window.onclick = function(event) {
            if (event.target == deleteModal) {
                deleteModal.style.display = 'none';
            }
        }
    }



    
    
    function initializeFacebookModal() {
        const postToFacebookBtns = document.querySelectorAll('.post-to-facebook-btn');
        const facebookModal = document.getElementById('facebookModal');
        const facebookModalMessage = document.getElementById('facebookModalMessage');
        const loader = document.getElementById('loader');
        const facebookSpan = facebookModal.getElementsByClassName('close')[0];
    
        postToFacebookBtns.forEach(btn => {
            btn.onclick = async function() {
                loader.style.display = 'block'; 
                facebookModalMessage.textContent = '';
                facebookModal.style.display = 'block';
                const facebookUrl = this.getAttribute('data-facebook-url'); 
    
                try {
                    const response = await fetch(facebookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrf_token
                        },
                    });
    
                    if (response.ok) {
                        facebookModalMessage.textContent = 'Posted to Facebook Successfully!';
                    } else {
                        facebookModalMessage.textContent = 'Failed to post to Facebook.';
                    }
                } catch (error) {
                    facebookModalMessage.textContent = 'An error occurred.';
                } finally {
                    loader.style.display = 'none'; 
                }
            }
        });
    
        facebookSpan.onclick = function() {
            facebookModal.style.display = 'none';
        }
    
        window.onclick = function(event) {
            if (event.target == facebookModal) {
                facebookModal.style.display = 'none';
            }
        }
    }

    function initializeEditButtons() {
        const editButtons = document.querySelectorAll('.edit-btn');

        editButtons.forEach(button => {
            button.addEventListener('click', handleEditClick);
        });
    }

    function handleEditClick(event) {
        const button = event.target;
        const eventElement = button.closest('.event');
        const eventId = eventElement.getAttribute('data-id');
        const title = eventElement.querySelector('.event-title');
        const caption = eventElement.querySelector('.event-caption');
        const photo = eventElement.querySelector('.event-img');
        const deleteBtn = eventElement.querySelector('.event-delete-btn');

        const originalTitle = title.textContent;
        const originalCaption = caption.textContent;
        const originalPhoto = photo ? photo.innerHTML : '';

        title.innerHTML = `<input type="text" value="${title.textContent}" id="edit_title_${eventId}">`;
        caption.innerHTML = `<textarea id="edit_caption_${eventId}">${caption.textContent}</textarea>`;
        if (photo) {
            photo.innerHTML = `
                <input type="file" id="edit_photo_${eventId}" accept="image/*">
                
            `;
        }

        button.textContent = 'Save';
        deleteBtn.style.display = 'none';
        const cancelButton = createCancelButton();

        button.parentElement.appendChild(cancelButton);

        button.removeEventListener('click', handleEditClick);
        button.addEventListener('click', (e) => handleSaveClick(e, originalTitle, originalCaption, originalPhoto, deleteBtn));

        cancelButton.addEventListener('click', (e) => handleCancelClick(e, button, originalTitle, originalCaption, originalPhoto, deleteBtn));
    }

    function createCancelButton() {
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'cancel-btn';
        return cancelButton;
    }

    function handleSaveClick(event, originalTitle, originalCaption, originalPhoto, deleteBtn) {
        const button = event.target;
        const eventElement = button.closest('.event');
        const eventId = eventElement.getAttribute('data-id');
        const title = eventElement.querySelector('.event-title');
        const caption = eventElement.querySelector('.event-caption');
        const photo = eventElement.querySelector('.event-img');

        const editedTitle = document.getElementById(`edit_title_${eventId}`).value;
        const editedCaption = document.getElementById(`edit_caption_${eventId}`).value;
        const editedPhoto = document.getElementById(`edit_photo_${eventId}`).files[0];

        const formData = new FormData();
        formData.append('title', editedTitle);
        formData.append('caption', editedCaption);
        if (editedPhoto) {
            formData.append('photo', editedPhoto);
        }

          fetch(`/update_event/${eventId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrf_token
            }
        })
        .then(response => response.json())
        .then(data => {
            updateEventElement(data, title, caption, photo, eventId);

            resetButtonToEdit(button);
            removeCancelButton(button);
            deleteBtn.style.display = 'inline';

            button.removeEventListener('click', handleSaveClick);
            button.addEventListener('click', handleEditClick);

            if (photo) {
                initializeRemovePhotoButton(photo, eventId);
            }

            location.reload();
        })
        .catch(error => console.error('Error:', error));
    }

    function updateEventElement(data, title, caption, photo, eventId) {
        title.textContent = data.title;
        caption.textContent = data.caption;
        if (data.photo) {
            photo.innerHTML = `
                <img src="${data.photo}" alt="Event Image" style="max-width: 200px;">
            `;
        } else {
            photo.innerHTML = '';
        }
    }

    function resetButtonToEdit(button) {
        button.innerHTML = '&#9998;';
    }

    function removeCancelButton(button) {
        const cancelButton = button.parentElement.querySelector('.cancel-btn');
        if (cancelButton) {
            cancelButton.remove();
        }
    }

    function initializeRemovePhotoButton(photo, eventId) {
        const removePhotoButton = photo.querySelector(`.remove-photo-btn[data-id="${eventId}"]`);
        if (removePhotoButton) {
            removePhotoButton.addEventListener('click', () => handleRemovePhotoClick(eventId, photo));
        }
    }

    function handleRemovePhotoClick(eventId, photo) {
        fetch(`/remove_photo/${eventId}/`, {
            method: 'POST',
            headers: {
              'X-CSRFToken': csrf_token
          }
        })
        .then(response => response.json())
        .then(() => {
            photo.innerHTML = `
                <input type="file" id="edit_photo_${eventId}" accept="image/*">
                <button class="remove-photo-btn" data-id="${eventId}">Remove Photo</button>
            `;
        })
        .catch(error => console.error('Error:', error));
    }

    function handleCancelClick(event, button, originalTitle, originalCaption, originalPhoto, deleteBtn) {
        const title = button.closest('.event').querySelector('.event-title');
        const caption = button.closest('.event').querySelector('.event-caption');
        const photo = button.closest('.event').querySelector('.event-img');

        title.textContent = originalTitle;
        caption.textContent = originalCaption;
        if (photo) {
            photo.innerHTML = originalPhoto;
        }

        resetButtonToEdit(button);
        removeCancelButton(button);
        deleteBtn.style.display = 'inline';

        button.removeEventListener('click', handleSaveClick);
        button.addEventListener('click', handleEditClick);
    }


    function initializeAttachmentButtons() {
        document.getElementById('attach-image-button').addEventListener('click', function () {
            document.getElementById('file-input').click();
        });
    
     
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


    function handlePublishButtonClick(event) {
        const form = document.getElementById('event-form');
        if (form) {
            const checkbox = form.querySelector('input[name="post_to_facebook"]');
            if (checkbox && checkbox.checked) {
                event.preventDefault(); // Prevent the default form submission
                handlePostToFacebookAndPublish();
            }
        }
    }
    
    function handlePostToFacebookAndPublish() {
        const form = document.getElementById('event-form');
        if (form) {
            const facebookModal = document.getElementById('facebookModalmain');
            const loader = document.getElementById('loader');
            const facebookModalMessage = document.getElementById('facebookModalMessage');
            facebookModalMessage.textContent = 'Publishing and Posting to Facebook...';
            loader.style.display = 'block';
            facebookModal.style.display = 'block';


            form.submit(); 
        }
    }



    function handlePublishButtonClick(event) {
        const form = document.getElementById('event-form');
        if (form) {
            const checkbox = form.querySelector('input[name="post_to_facebook"]');
            if (checkbox && checkbox.checked) {
                event.preventDefault(); 
                handlePostToFacebookAndPublish(form);
            }
        }
    }
    
    
   

    function initializeFacebookModalMain() {
        const facebookModal = document.getElementById('facebookModalmain');
        const facebookModalMessage = document.getElementById('facebookModalMessage');
        const loader = document.getElementById('loader');
        const facebookSpan = facebookModal.getElementsByClassName('close')[0];
    
        function showModal(message) {
            facebookModalMessage.textContent = message;
            loader.style.display = 'block'; 
            facebookModal.style.display = 'block'; 
        }
    
       
        function hideModal() {
            facebookModalMessage.textContent = '';
            loader.style.display = 'none'; 
            facebookModal.style.display = 'none'; 
        }
    
        facebookSpan.onclick = function() {
            hideModal();
        }
    
        window.onclick = function(event) {
            if (event.target == facebookModal) {
                hideModal();
            }
        }
    }

    function initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', (event) => {
            initializeFileInput();
            initializeEditButtons();
            initializeDeleteModal();
            initializeFacebookModal();
            initializeAttachmentButtons();
            observeVisibleElements();
            initializeFacebookModalMain();

            const publishButton = document.querySelector('.publish-button');
            if (publishButton) {
                publishButton.addEventListener('click', handlePublishButtonClick);
            }
            
        });
    }

    initializeEventListeners();



