// Globar variables
const csrftoken = getCookie('csrftoken');
let user_goals;
let time_log_id;
const URL_BACKEND = 'http://127.0.0.1:8000/'

document.addEventListener('DOMContentLoaded', () => {
    let dom_goals = document.querySelector('.goals');

    // ------------------- Add goals to the dom ---------------------------------- //
    fetch(`${URL_BACKEND}/list_goals/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => response.json())
    .then(user_goals => {
        if (Array.isArray(user_goals)) {
            const goalsHTML = user_goals.map(goal => `
                <div class="goal p-1" data-id="${goal.id}" onclick="handleOpenSteps(event)">
                    ${goal.title}
                    <i class="fa-solid fa-gear" onclick="handleGoalSettings(event)"></i>
                </div>
                <div class="steps-to-goal pl-3">
                    <div class="step-input">
                        <input type="text" placeholder="Add a step" class="step-input-add">
                        <button class="btn btn-add-step ml-1" onclick="handleAddStep(event)">Add</button>
                    </div>
                </div>
                <hr>
            `).join(''); // Join the array of strings into one big HTML string

            dom_goals.innerHTML = goalsHTML;

            // ------------------- After goals are loaded, fetch steps ------------------- //
            fetch(`${URL_BACKEND}/list_steps/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                }
            })
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
            })
            .then(steps_data => {
                if (Array.isArray(steps_data)) {
                    steps_data.forEach(step => {
                        let goal_div = document.querySelector(`[data-id="${step.goal.id}"]`);
                        if (goal_div) {
                            let steps = goal_div.nextElementSibling;
                            steps.innerHTML += `
                                <div class="step mt-1" onclick="handleStepSelection(event)" data-id="${step.id}">
                                    <i class="fa-solid fa-angles-right pr-1"></i>
                                    ${step.step_title}
                                </div>`;
                        }
                    });
                }
            })
            .catch(error => console.error('Error fetching steps:', error));
        }
    })
    .catch(error => console.error('Error fetching goals:', error));
    // ------------------- /Add goals and steps to the dom ------------------------ //

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

let isProceeding = false;

function handleLeft() {

    // return if the some function is being called
    if (isProceeding) return;
    isProceeding = true;

    let bar = document.querySelector('.right-bar');
    let openingArrow = document.querySelector('.arrow-container-left')

    openingArrow.style.opacity = '0';
    openingArrow.style.pointerEvents = 'none';
    bar.style.width = '20rem';

    setTimeout(() => {
        isProceeding = false
    }, 300);
}

function handleRight() {

    if (isProceeding) return;
    isProceeding = true;


    let bar = document.querySelector('.right-bar');
    let openingArrow = document.querySelector('.arrow-container-left');

    openingArrow.style.opacity = '1';
    openingArrow.style.pointerEvents = 'auto';
    bar.style.width = '0';

    let steps = document.querySelectorAll('.steps-to-goal');
    steps.forEach(element => {
        if(element.style.display == 'block') {
            element.style.display = 'none';
        }
    })

    document.querySelector('.input-goal').classList.add('hidden');
    document.querySelector('.plus').classList.remove('hidden');

    setTimeout(() => {
        isProceeding = false
    }, 300);
}

let timeInterval;
let startTime;
let elapsedTime = 0;

// Start the timer
function updateTime() {
    const currentTime = Date.now();
    const totalTime = elapsedTime + (currentTime - startTime); // Total elapsed time in milliseconds

    const totalSeconds = Math.floor(totalTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    document.querySelector('.time').innerText = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function handleStart(event) {
    const btnPause = document.querySelector('.btn-pause');
    const btnStop = document.querySelector('.btn-stop');

    btnPause.style.display = 'inline-block';
    btnStop.style.display = 'inline-block';
    event.target.style.display = 'none';

    // Record the start time
    if (!timeInterval) {
        startTime = Date.now(); // Record the current time
        timeInterval = setInterval(updateTime, 1000);
    }

    // Hit the endpoint in order to notify we have started
    const step_id = document.querySelector('.step-selected').dataset.id;

    fetch(`${URL_BACKEND}/start_time/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            'step_id': step_id
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        time_log_id = data.time_log_id;
    })
    .catch(error => console.log(error));
}

function handlePause(event){
    const pauseBtn = event.target;

    if (pauseBtn.innerText === 'Pause') {
        clearInterval(timeInterval);
        timeInterval = null;
        pauseBtn.innerText = 'Resume';
    }
    else if (pauseBtn.innerText == 'Resume') {
        pauseBtn.innerText = 'Pause';
        if (!timeInterval) {
            timeInterval = setInterval(updateTime, 1000);
        }
    }
}



function handleStop(event) {
    document.querySelector('.btn-start').style.display = 'inline-block';
    document.querySelector('.btn-pause').style.display = 'none';
    event.currentTarget.style.display = 'none';

    document.querySelector('.time').innerText = '00:00:00';

    const step_id = document.querySelector('.step-selected').dataset.id;

    fetch(`${URL_BACKEND}/stop_timer/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            'time_log_id': time_log_id // Only pass the time log ID
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));

    // Reset internal time variables
    hours = 0;
    minutes = 0;
    seconds = 0;
    elapsedTime = 0;
    clearInterval(timeInterval);
    timeInterval = null;

    get_percentage_step_bar(step_id);
}



function handleAddGoal() {
    const inputDiv = document.querySelector('.input-goal');
    document.querySelector('.plus').classList.add('hidden');

    inputDiv.classList.remove('hidden');
}

function handleGoalAdding() {
    const goal = document.querySelector('.input-add').value;

    if(!goal) {
        alert("Please, enter a valid goal!");
        return
    }

    // Make a request to add the goal to the database
    csrf = getCookie('csrftoken');
    let goal_id;
    fetch(`${URL_BACKEND}/save_goal/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf
        },
        body: JSON.stringify({
            'goal': goal
        })
    })
    .then(res => {
        if(res.ok){
            return res.json()
        }
        else {
            console.error('Error with the status code of the save goal')
        }
    })
    .then(data => {
        document.querySelector('.right-bar').innerHTML +=
            `<hr>
            <div class="goal p-1" onclick="handleOpenSteps(event)" data-id=${data.goal_id}>
                ${goal}
                <i class="fa-solid fa-gear" onclick="handleGoalSettings(event)"></i>
            </div>
            <div class="steps-to-goal pl-3">
                <div class="step-input">
                    <input type="text" placeholder="Add a step" class="step-input-add">
                    <button class="btn btn-add-step ml-1" onclick="handleAddStep(event)">Add</button>
                </div>
            </div>`;
    })
    .catch(error => console.log(error))

    // Remove the input and the button
    document.querySelector('.input-goal').innerHTML = '';
    document.querySelector('.plus').style.display = 'flex';

}

function handleOpenSteps(event) {
    const steps = event.currentTarget.nextElementSibling;

    //  Close the all the steps before opening this one
    let all_steps = document.querySelectorAll('.steps-to-goal');
    all_steps.forEach(element => {
        if (element.style.display === 'block') {
            element.style.display = 'none';
        }
    })

    if (steps.style.display == 'block') {
        console.log('I am inside')
        steps.style.display = 'none';
    }
    else {
        steps.style.display = 'block';
    }
}

function handleAddStep(event) {
    const step = event.target.previousElementSibling.value;

    let steps = event.target.parentElement;
    steps = steps.parentElement;
    let goal_id = steps.previousElementSibling.dataset.id;

    // --------------- Send step to save in the database -------------------- //
    fetch(`${URL_BACKEND}/save_step/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            'goal_id': goal_id,
            'step': step
        })
    })
    .then(response => {
        if(response.ok) {
            return response.json()
        }
        else {
            console.error("Smth is wrong with the status code of the add step");
        }
    })
    .then(data => {
        console.log(data);
        steps.innerHTML += `
                <div class="step mt-1" onclick="handleStepSelection(event)" data-id="${data.step_id}">
                    <i class="fa-solid fa-angles-right pr-1"></i>
                    ${step}
                </div>`;
    })
    .catch(error => console.error(error))

}

function handleStepSelection(event) {
    let step = event.currentTarget;

    // Make only the selected step background white and color black with step-selected class
    let steps = document.querySelectorAll('.step-selected');
    steps.forEach(step => {
        step.classList.remove('step-selected');
    });

    if (!step.classList.contains('step-selected')) {
        step.classList.add('step-selected');
    } else {
        step.classList.remove('step-selected');
    }

    // Change the texts so that main texts are about the step
    let goal_text = step.parentElement;
    goal_text = goal_text.previousElementSibling;
    document.querySelector('.main_h4').innerText = goal_text.innerText;
    document.querySelector('.motivation').innerText = step.innerText;
    document.querySelector('.btn-start').disabled = false;

    // Reflect the percentage change for the bar
    get_percentage_step_bar(step.dataset.id);

    // If the time and the button hidden, make then visible again
    document.querySelector('.time').classList.remove('hidden');
    document.querySelector('.buttons').classList.remove('hidden');
    document.querySelector('.settings').classList.add('hidden');

    // For making the percentage closer to the bar
    document.querySelector('.percentage').classList.remove('no-plan-text');

}


function handleGoalSettings(event) {
    let goal = event.currentTarget.parentElement;

    document.querySelector('.main_h4').innerText = goal.innerText;
    document.querySelector('.motivation').innerText = 'Select the number of hours you want to spend on each of the steps per week (The bar on the right will show whether you accomplished or not)';

    document.querySelector('.time').classList.add('hidden');
    document.querySelector('.buttons').classList.add('hidden');

    let steps = goal.nextElementSibling.querySelectorAll('.step');
    let settings_div = document.querySelector('.settings');
    let stepsHTML = '';

    // Create an array for the fetch promises
    let fetchPromises = [];

    // ------------------- Add steps to the DOM ------------------------------------ //
    Array.from(steps).forEach(step => {
        const stepFetch = fetch(`${URL_BACKEND}/time_week/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                'step_id': step.dataset.id
            })
        })
        .then(response => response.json())
        .then(data => {
            let hour = data.duration;
            stepsHTML += `<div class='main-step p-2 display-5 d-flex justify-content-between' data-id='${step.dataset.id}'>
                ${step.innerText} <input type='number' value="${parseInt(hour)}">
                </div>`;
        })
        .catch(error => console.log(error));

        // Add the fetch promise to the array
        fetchPromises.push(stepFetch);
    });

    // ------------------ Show the percentage on the bar -------------------------- //
    const percentageFetch = fetch(`${URL_BACKEND}/get_percentage_week/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            'goal_id': goal.dataset.id
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (!data.week_planned) {
            let percentage = document.querySelector('.percentage');
            percentage.innerText = 'No plans';
            percentage.classList.add('no-plan-text');
        } else {
            document.querySelector('.percentage').innerText = `${data.percentage_week}%`;
            document.querySelector('.percentage').classList.remove('no-plan-text');
            document.querySelector('.circle').style.background = `conic-gradient(#4caf50 0% ${data.percentage_week}%, #ddd ${data.percentage_week}% 100%);`

            // Add time spent to stepsHTML
            stepsHTML += `
                <div class='mt-1 p-2 d-flex justify-content-between settings-info order-1'>
                    <span> Time spent today </span>
                    <span> ${data.time_spend_today} </span>
                </div>
                <div class='mt-1 p-2 d-flex justify-content-between settings-info order-1'>
                    <span> Time spent this week </span>
                    <span> ${data.time_spend_week} </span>
                </div>
                <div class='mt-1 p-2 d-flex justify-content-between settings-info order-1'>
                    <span> Total time spent </span>
                    <span> ${data.total_time} </span>
                </div>`;
        }
    })
    .catch(error => console.error(error));

    // Add the percentage fetch promise to the array
    fetchPromises.push(percentageFetch);

    // --------------------------------------------------------------------- //

    // Wait for all fetches to complete before updating the innerHTML
    Promise.all(fetchPromises).then(() => {
        stepsHTML += `<div class='d-flex justify-content-end pt-3 pr-2 order-1'>
                        <button class='btn btn-primary' onclick='handleSettingChange()'>Save Changes</button>
                    </div>`;
        settings_div.classList.remove('hidden');
        settings_div.innerHTML = stepsHTML;
    });

}


function handleSettingChange(){
    let steps = document.querySelectorAll('.main-step');
    steps.forEach(step => {
        fetch(`${URL_BACKEND}/save_hours/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                'step_id': step.dataset.id,
                'hours': step.querySelector('input').value
            })
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log(error))
    })


}

function get_percentage_step_bar(step_id){
    fetch(`${URL_BACKEND}/get_percentage_day/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            'step_id': step_id
        })
    })
    .then(response => response.json())
    .then(data => {
        let percentage = data.percentage
        document.querySelector('.percentage').innerText = `${percentage}%`
        document.querySelector('.circle').style.background = `conic-gradient(#4caf50 0% ${percentage}%, #ddd ${percentage}% 100%)`;
    })
    .catch(error => console.error(error))

}