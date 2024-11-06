function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const signInContainer = document.getElementById('signInContainer');
    const authForm = document.getElementById('authForm');
    const formTitle = document.getElementById('formTitle');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    
    // CSRF token from hidden input field
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    
    // Extract password reset URL from the data attribute
    const passwordResetUrl = signInContainer.getAttribute('data-password-reset-url');

    // Modal for email sent success
    const emailSentModal = document.getElementById('emailSentModal');
    const passwordResetSuccessModal = document.getElementById('passwordResetSuccessModal');

    // Check if modal should be shown based on data attribute (for when email is sent)
    const showModal = signInContainer.getAttribute('data-show-modal') === 'true';

    // modal for loading logging in 
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            // Show the loading spinner when the login form is submitted
            showLoading();
        });
    }

    
    if (showModal) {
        emailSentModal.style.display = 'block'; // Show modal if the email was successfully sent
        document.getElementById('closeEmailModal').addEventListener('click', function() {
            emailSentModal.style.display = 'none'; // Hide modal on close
            // Update URL to prevent modal from showing again on page refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    // Render Sign In form
    function renderSignInForm() {
        formTitle.textContent = "SIGN IN";
        authForm.innerHTML = `
            <form  action="" method="POST" id="loginForm">
                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                <input type="text" name="username" placeholder="Username" id="username" class="input-field" required><br>
                <input type="password" name="password" placeholder="Password" id="password" class="input-field" required><br>
                <button class="loginbutton" type="submit" value="Login">
                    <span class="shadow"></span>
                    <span class="edge"></span>
                    <span class="front text"> LOGIN </span>
                </button>
            </form>
            <div>
                <button id="forgotPasswordBtn" class="forgot-password-btn">Forgot your password?</button>
            </div>
        `;

        
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', function (event) {
            showLoading();  
        });

        document.getElementById('forgotPasswordBtn').addEventListener('click', renderForgotPasswordForm);
        
    }

  
    

    // Render Forgot Password form
    function renderForgotPasswordForm() {
        formTitle.textContent = "RESET PASSWORD";
        authForm.innerHTML = `
            <form id="resetPasswordForm" method="POST">
                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                <input type="text" name="username" placeholder="Username" id="reset_username" class="input-field" required><br>
                <input type="email" name="email" placeholder="Email" id="email" class="input-field" required><br>
                <button class="loginbutton" type="submit" value="Reset Password">
                    <span class="shadow"></span>
                    <span class="edge"></span>
                    <span class="front text"> RESET PASSWORD </span>
                </button>
            </form>
            <div>
                <button id="backToSignInBtn" class="forgot-password-btn">Back to Sign In</button>
            </div>
        `;

        



        document.getElementById('backToSignInBtn').addEventListener('click', renderSignInForm);

        const resetPasswordForm = document.getElementById('resetPasswordForm');
        resetPasswordForm.addEventListener('submit', function (e) {
            e.preventDefault();  // Prevent the form from submitting the traditional way
            showLoading(); 

            // Capture the form data
            const formData = new FormData(resetPasswordForm);

            // Send the form data via AJAX using fetch
            fetch(passwordResetUrl, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideLoading(); 
                if (data.success) {
                    // Show the success modal
                    emailSentModal.style.display = 'block';
                    document.getElementById('closeEmailModal').addEventListener('click', function() {
                        emailSentModal.style.display = 'none';
                    });
                } else {

                    let errorMessage = document.querySelector('.error-message');

                    // Display the error message if something goes wrong
                    if (!errorMessage) {
                        // Create a new error message if it doesn't exist
                        errorMessage = document.createElement('div');
                        errorMessage.className = 'error-message';
                        const resetButton = resetPasswordForm.querySelector('button[type="submit"]');
                        resetButton.parentNode.insertBefore(errorMessage, resetButton.nextSibling);
                    }

                   errorMessage.textContent = data.message;
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    // Initialize by binding the Forgot Password button to render the reset form
    forgotPasswordBtn.addEventListener('click', renderForgotPasswordForm);
});
