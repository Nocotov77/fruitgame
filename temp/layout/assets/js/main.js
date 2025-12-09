let name = '';
let currentGame = null;
let panel = 'start';

/**
 * Плавные переходы между экранами с классами screen/screen-active.
 */
let go = (page, attribute) => {
  let pages = ['start', 'game', 'end'];
  panel = page;

  // Поменять классы отображения
  $(`#${page}`).attr('class', attribute + ' screen');
  pages.forEach(e => {
    if (page !== e) {
      $(`#${e}`).attr('class', 'panel d-none screen');
    }
  });

  // Плавная активация прозрачности
  setTimeout(() => {
    $(`#${page}`).addClass('screen-active');
    pages.forEach(e => {
      if (page !== e) $(`#${e}`).removeClass('screen-active');
    });
  }, 0);
};

let checkStorage = () => {
  if(localStorage.getItem('userName') != null) {
    $(`#nameInput`).val(localStorage.getItem('userName'));
  }
};

let checkName = () => {
  name = $(`#nameInput`).val().trim();
  if(name !== ""){
    localStorage.setItem('userName', name);
    $(`#startGame`).prop('disabled', false);
  } else{
    $(`#startGame`).prop('disabled', true);
  }
};

let nav = () => {
  document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.closest('#startGame')) {
      e.preventDefault();
      if (currentGame) currentGame.stop();
      go('game', 'panel d-block');
      return;
    }

    if (target.closest('#restart')) {
      e.preventDefault();
      if (currentGame) currentGame.stop();
      go('game', 'panel d-block');
      // Полный сброс игровой зоны (включая классы паузы/подсветки)
      $('.elements').remove();
      $("#game").append(`<div class="elements"></div>`);
      return;
    }
  });
};

let startLoop = () => {
  $(`#nameInput`).on('input', checkName);
  checkName();
};

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
    } else if (panel !== "game process" && currentGame) {
      currentGame.stop();
      currentGame = null;
    }
  }, 500);
};
