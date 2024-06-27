function closeEventDetail() {
  window.history.back();
}

function goHome() {
    window.location.href = '/';
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