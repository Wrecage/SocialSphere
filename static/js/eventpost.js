

    
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

    function initializeModal() {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeModalButton = document.querySelector('.close');
    
        // Function to open the modal
        function openModal(content) {
            if (modalBody) {
                modalBody.innerHTML = content;
                modal.style.display = 'block';
                document.body.classList.add('modal-open'); // Prevent background scrolling
            } else {
                console.error('Modal body not found.');
            }
        }
    
        // Function to close the modal
        function closeModal() {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open'); // Re-enable background scrolling
        }
    
        // Add event listener to all event detail links
        document.querySelectorAll('.event-detail-link').forEach(function(element) {
            element.addEventListener('click', function(event) {
                event.preventDefault();
                const url = this.href;
    
                // Fetch the detailed view content
                fetch(url)
                    .then(response => response.text())
                    .then(html => {
                        openModal(html);
                    });
            });
        });
    
        // Add event listener to close button
        closeModalButton.addEventListener('click', closeModal);
    
        // Close modal when clicking outside of the modal content
        window.onclick = function(event) {
            if (event.target == modal) {
                closeModal();
            }
        }
    }




    function updateMaxWordsValue() {
        const maxWordsSlider = document.getElementById('max-words-slider');
        const maxWordsValue = document.getElementById('max-words-value');
        
        // Update the displayed value of max words when the slider is moved
        maxWordsSlider.oninput = function() {
            maxWordsValue.textContent = this.value;
        };
    }

    function lengthMaxWords(){
        const lengthWordsSlider = document.getElementById('length-words-slider')
        const lengthWordsValue = document.getElementById('length-words-value')

        lengthWordsSlider.oninput = function(){
            lengthWordsValue.textContent = this.value;
        }
    }
    
    function handleCaptionGeneration() {
        const generateCaptionBtn = document.getElementById('generate-caption-btn');
        const generateImageDescriptionBtn = document.getElementById('generate-image-description-btn');
        const maxWordsSlider = document.getElementById('max-words-slider');
        const lengthWordsSlider = document.getElementById('length-words-slider');
        const generatedCaption = document.getElementById('generated-caption');
        const generatedImageDescription = document.getElementById('generated-image-description');
        const imageInput = document.getElementById('caption-image-input');
        const imagePreviewGroq = document.getElementById('image-preview-groq'); // Image preview element
        
        // Preview the uploaded image
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreviewGroq.src = e.target.result;
                    imagePreviewGroq.style.display = 'block'; // Show the image preview
                };
                reader.readAsDataURL(file); // Convert file to base64 URL for preview
            }
        });
    
        // Text caption generation
        generateCaptionBtn.addEventListener('click', function() {
            const eventDescription = document.getElementById('event-desc-input').value;
            const location = document.getElementById('location-input').value;
            const date = document.getElementById('date-input').value;
            const eventType = document.getElementById('event-type-select').value;
            const eventCategory = document.getElementById('event-category-select').value;
            const tone = document.getElementById('tone-select').value;
            const maxWords = maxWordsSlider.value;
    
            const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;
    
            fetch('/generate-caption/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                    event_description: eventDescription,
                    location: location,
                    date: date,
                    event_type: eventType,
                    event_category: eventCategory,
                    tone: tone,
                    max_words: maxWords
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.generated_caption) {
                    generatedCaption.value = data.generated_caption;
                } else {
                    alert('Error generating caption.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    
        // Image description generation
        generateImageDescriptionBtn.addEventListener('click', function() {
            const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;
            const maxWords = lengthWordsSlider.value;  

            if (imageInput.files.length > 0) {
                const reader = new FileReader();
                reader.readAsDataURL(imageInput.files[0]);
    
                reader.onload = function() {
                    const imageBase64 = reader.result.split(',')[1];  // Get base64 portion of DataURL
    
                    fetch('/generate-caption/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken,
                        },
                        body: JSON.stringify({
                            image_base64: imageBase64,
                            max_words: maxWords 
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.generated_image_description) {
                            generatedImageDescription.value = data.generated_image_description;
                        } else {
                            alert('Error generating image description.');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                };
            } else {
                alert('Please upload an image to generate a description.');
            }
        });
    }
    

    function adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';  
        textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';  
    }
    
    function initializeTextareaResize() {
        const textareas = document.querySelectorAll('textarea');
        
        textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                adjustTextareaHeight(textarea);
            });
    
            adjustTextareaHeight(textarea);
        });
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
            initializeModal();
            updateMaxWordsValue();
            lengthMaxWords();
            handleCaptionGeneration();
            initializeTextareaResize();


            const publishButton = document.querySelector('.publish-button');
            if (publishButton) {
                publishButton.addEventListener('click', handlePublishButtonClick);
            }
            
        });
    }
    function toggleText(eventId) {
        const captionText = document.getElementById('caption-text_' + eventId);
        const toggleBtn = document.getElementById('toggle-btn_' + eventId);
    
        // Retrieve full and truncated text from data attributes
        const fullText = captionText.getAttribute('data-fulltext');
        const truncatedText = captionText.getAttribute('data-truncated');
    
        // Log the current state for debugging
        console.log("Current Button Text:", toggleBtn.textContent);
        console.log("Full Text:", fullText);
        console.log("Truncated Text:", truncatedText);
    
        // Check the current button state and toggle text accordingly
        if (toggleBtn.textContent === 'See More') {
            captionText.innerHTML = fullText; // Show full text
            toggleBtn.textContent = 'See Less'; // Change button text
        } else {
            captionText.innerHTML = truncatedText; // Show truncated text
            toggleBtn.textContent = 'See More'; // Change button text
        }
    
        // Log after changing the text
        console.log("Updated Button Text:", toggleBtn.textContent);
        console.log("Updated Caption Text:", captionText.innerHTML);
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
    }
    
    initializeEventListeners();



