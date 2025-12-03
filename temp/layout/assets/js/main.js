let name = '';
let currentGame = null;
let panel = 'start';

let nav = () => {
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.closest('#startGame')) {
            e.preventDefault();
            if (currentGame) {
                currentGame.stop();
            }
            go('game', 'd-block');
            return;
        }
        
        if (target.closest('#restart')) {
            e.preventDefault();
            if (currentGame) {
                currentGame.stop();
            }
            go('game', 'd-block');
            $('.elements').remove();
            $("#game").append(`<div class="elements"></div>`);
            return;
        }
    });
}

let go = (page, attribute) => {
    let pages = ['start', 'game', 'end'];
    panel = page;
    
    $(`#${page}`).attr('class', attribute);
    pages.forEach(e => {
        if (page !== e) {
            $(`#${e}`).attr('class', 'd-none');
        }
    });
}

let checkStorage = () => {
    if(localStorage.getItem('userName') != null) {
        $(`#nameInput`).val(localStorage.getItem('userName'));
    }
}

let checkName = () => {
    name = $(`#nameInput`).val().trim();
    if(name !== ""){
        localStorage.setItem('userName', name);
        $(`#startGame`).prop('disabled', false);
    }
    else{
        $(`#startGame`).prop('disabled', true);
    }
}

let startLoop = () => {
    $(`#nameInput`).on('input', checkName);
    checkName();
}

window.onload = () => {
    checkStorage();
    nav();
    startLoop();
    
    setInterval(() => {
        if (panel === "game") {
            if (!currentGame) {
                currentGame = new Game(name);
                currentGame.start();
            }
            panel = "game process";
        }
        else if (panel !== "game process" && currentGame) {
            currentGame.stop();
            currentGame = null;
        }
    }, 500);
};