document.addEventListener('DOMContentLoaded', function() {
    const timeDiv = document.querySelector('.time');
    
    let seconds = 0;
    let minutes = 0;
    let hours = 0;

    function updateCounter() {
        seconds++;

        if(seconds >= 60) {
            seconds = 0;
            minutes++;
        }

        if(minutes >= 60) {
            minutes = 0;
            hours++;
        }

        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');

        timeDiv.innerHTML = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    }

    // setInterval(updateCounter, 1000);


});