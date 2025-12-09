class Game {
  constructor(name) {
    this.name = name;
    this.$zone = $('.elements');
    this.elements = [];
    this.fruits = [Apple, Banana, Orange];

    this.counterForTimer = 0;
    this.points = 0;
    this.hp = 3;
    this.time = { m1: 0, m2: 0, s1: 0, s2: 0 };

    this.ended = true; // чтобы петля не стартовала до start()
    this.pause = false;

    // Ссылки на UI индикаторы способности
    this.$skillText = $('#skill');
    this.$skillBar = $('#skillBar');
    this.$skillFill = $('#skillFill');

    this.keyEvents();
  }

  start() {
    // Сброс UI при старте новой игры
    this.resetUI();

    this.player = new Player(this);
    this.elements.push(this.player);

    this.ended = false;
    this.loop();
  }

  resetUI() {
    this.points = 0;
    this.hp = 3;
    this.time = { m1: 0, m2: 0, s1: 0, s2: 0 };

    // Сброс трекбара и индикаторов
    this.$skillText.removeClass('active cooldown').addClass('ready').html('Готово');
    this.$skillBar.removeClass('active cooldown').addClass('ready');
    this.$skillFill.css('width', '0%');

    this.$zone.removeClass('paused floor-flash');
    $('#points').html(this.points);
    $('#hp').html(this.hp);
    $('#timer').html('00:00');
  }

  loop() {
    requestAnimationFrame(() => {
      if (!this.pause) {
        this.counterForTimer++;

        if (this.counterForTimer % 60 === 0) {
          this.timer();
          this.randomFruitGenerate();
        }

        if (this.hp <= 0 && !this.ended) {
          this.end();
        }

        $('.pause').css('display', 'none').hide();
        this.$zone.removeClass('paused');

        this.updateElements();
        this.setParams();
      } else {
        $('.pause').css('display', 'flex').show();
        this.$zone.addClass('paused');
      }

      if (!this.ended) {
        this.loop();
      }
    });
  }

  timer() {
    let time = this.time;
    time.s2++;
    if (time.s2 >= 10) { time.s2 = 0; time.s1++; }
    if (time.s1 >= 6)  { time.s1 = 0; time.m2++; }
    if (time.m2 >= 10) { time.m2 = 0; time.m1++; }

    let str = `${time.m1}${time.m2}:${time.s1}${time.s2}`;
    const $t = $("#timer");
    $t.html(str);
    $t.addClass('tick');
    setTimeout(() => $t.removeClass('tick'), 200);
  }

  keyEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === "Escape") {
        this.pause = !this.pause;
      }
    });
  }

  setParams() {
    $('#name').html(this.name);
    $('#points').html(this.points);
    $('#hp').html(this.hp);
  }

  updateElements() {
    // Удаляем неактивные элементы
    this.elements = this.elements.filter(element => {
      if (!element.active) {
        if (element.$element) element.$element.remove();
        return false;
      }
      return true;
    });

    // Обновляем оставшиеся элементы
    this.elements.forEach(e => {
      e.update();
      if (e.active) e.draw();
    });
  }

  randomFruitGenerate() {
    let ranFruit = random(0, 2);
    this.generate(this.fruits[ranFruit]);
  }

  generate(FruitClass) {
    const fruit = new FruitClass(this);

    // Новые фрукты тоже притягиваются, если способность активна
    if (this.player && this.player.skillActive && fruit instanceof Fruits) {
      fruit.magnet = true;
      fruit.magnetSpeed = 12;
      fruit.offsets.y = Math.max(fruit.offsets.y - 2, 1);
    }

    this.elements.push(fruit);
  }

  remove(el) {
    let idx = this.elements.indexOf(el);
    if (idx !== -1) {
      this.elements.splice(idx, 1);
      if (el.$element) el.$element.remove();
      el.active = false;
      return true;
    }
    return false;
  }

  stop() {
    this.ended = true;
    this.elements.forEach(e => {
      if (e.$element) e.$element.remove();
      e.active = false;
    });
    this.elements = [];
  }

  end() {
    this.ended = true;
    let time = this.time;

    if (time.s1 >= 1 || time.m2 >= 1 || time.m1 >= 1) {
      $('#playerName').html(`Поздравляем, ${this.name}!`);
      $('#endTime').html(`Ваше время: ${time.m1}${time.m2}:${time.s1}${time.s2}`);
      $('#collectedFruits').html(`Вы собрали ${this.points} фруктов`);
      $('#congratulation').html(`Вы выиграли!`);
    } else {
      $('#playerName').html(`Жаль, ${this.name}!`);
      $('#endTime').html(`Ваше время: ${time.m1}${time.m2}:${time.s1}${time.s2}`);
      $('#collectedFruits').html(`Вы собрали ${this.points} фруктов`);
      $('#congratulation').html(`Вы проиграли!`);
    }

    if (typeof go !== 'undefined') {
      go('end', 'panel d-flex justify-content-center align-items-center');
    }
  }
}

class Drawable {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.h = 0;
    this.w = 0;
    this.offsets = { x: 0, y: 0 };
    this.active = true;
    this.$element = null;
  }

  createElement() {
    this.$element = $(`<div class="element ${this.constructor.name.toLowerCase()}"></div>`);
    this.game.$zone.append(this.$element);
  }

  update() {
    this.x += this.offsets.x;
    this.y += this.offsets.y;
  }

  draw() {
    if (!this.active || !this.$element) return;
    this.$element.css({
      left: this.x + "px",
      top: this.y + "px",
      width: this.w + "px",
      height: this.h + "px"
    });
  }

  isCollision(element) {
    let a = { x1: this.x, x2: this.x + this.w, y1: this.y, y2: this.y + this.h };
    let b = { x1: element.x, x2: element.x + element.w, y1: element.y, y2: element.y + element.h };
    return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
  }

  removeElement() {
    if (this.$element) {
      this.$element.remove();
      this.$element = null;
    }
  }
}

class Player extends Drawable {
  constructor(game) {
    super(game);
    this.w = 244;
    this.h = 109;
    this.x = this.game.$zone.width() / 2 - this.w / 2;
    this.y = this.game.$zone.height() - this.h;
    this.speedPerFrame = 20;

    // Настройки способности (увеличенная длительность и уменьшенный откат)
    this.skillTimer = 0;         // накопление активности (frames)
    this.couldTimer = 0;         // накопление отката (frames)
    this.skillActive = false;

    this.skillActiveMax = 360;   // ~6 секунд при 60fps
    this.skillCooldownMax = 240; // ~4 секунды отката

    this.keys = { ArrowLeft: false, ArrowRight: false, Space: false };

    this.createElement();
    this.bindKeyEvents();
    this.resetSkillState();
  }

  resetSkillState() {
    this.skillTimer = 0;
    this.couldTimer = 0;
    this.skillActive = false;

    this.game.$skillText.removeClass('active cooldown').addClass('ready').html('Готово');
    this.game.$skillBar.removeClass('active cooldown').addClass('ready');
    this.game.$skillFill.css('width', '0%');
  }

  bindKeyEvents() {
    document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true));
    document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false));
  }

  changeKeyStatus(code, value) {
    if (code in this.keys) {
      this.keys[code] = value;
    }
  }

  applySkill() {
    const $skill = this.game.$skillText;

    $skill.removeClass('ready cooldown').addClass('active').html(`Активно`);
    // Трекбар не показываем при активности
    this.game.$skillBar.removeClass('ready cooldown active').addClass('active');

    for (let i = 1; i < this.game.elements.length; i++) {
      const element = this.game.elements[i];
      if (!element || !element.active || !(element instanceof Fruits)) continue;

      element.magnet = true;
      element.magnetSpeed = 12; // усиленное притяжение
      element.offsets.y = Math.max(element.offsets.y - 2, 1); // тормозим падение
    }

    this.skillActive = true;
  }

  updateSkillTrackbarCooldown() {
    const p = Math.min(100, Math.floor(this.couldTimer / this.skillCooldownMax * 100));
    this.game.$skillFill.css('width', `${p}%`);
  }

  update() {
    // Движение игрока
    if (this.keys.ArrowLeft && this.x > 0) {
      this.offsets.x = -this.speedPerFrame;
    } else if (this.keys.ArrowRight && this.x < this.game.$zone.width() - this.w) {
      this.offsets.x = this.speedPerFrame;
    } else {
      this.offsets.x = 0;
    }

    const $skill = this.game.$skillText;
    const $bar = this.game.$skillBar;

    // Активация при удержании Space, если нет отката
    if (this.keys.Space && this.couldTimer === 0) {
      this.skillTimer++;

      if (this.skillTimer === 1) {
        this.applySkill();
      }

      const remain = Math.max(0, Math.ceil((this.skillActiveMax - this.skillTimer) / 60));
      $skill.removeClass('ready cooldown').addClass('active').html(`осталось ${remain}`);
    }

    // Завершение активности по времени или отпусканию
    if (this.skillTimer > this.skillActiveMax || (!this.keys.Space && this.skillTimer > 0)) {
      if (this.skillActive) {
        this.skillActive = false;

        // Снимаем магнит у фруктов
        for (let i = 1; i < this.game.elements.length; i++) {
          const element = this.game.elements[i];
          if (!element || !element.active || !(element instanceof Fruits)) continue;
          element.magnet = false;
        }
      }

      // Откат
      this.couldTimer++;
      const cdRemain = Math.max(0, Math.ceil((this.skillCooldownMax - this.couldTimer) / 60));
      $skill.removeClass('ready active').addClass('cooldown').html(`в откате ещё ${cdRemain}`);

      // Включаем трекбар только на откате
      $bar.removeClass('ready active').addClass('cooldown');
      this.updateSkillTrackbarCooldown();

      // Сбрасываем Space
      this.keys.Space = false;
    }

    // Конец отката
    if (this.couldTimer > this.skillCooldownMax) {
      this.couldTimer = 0;
      this.skillTimer = 0;
      $skill.removeClass('active cooldown').addClass('ready').html('Готово');
      $bar.removeClass('active cooldown').addClass('ready');
      this.game.$skillFill.css('width', '0%');
    }

    super.update();
  }
}

class Fruits extends Drawable {
  constructor(game) {
    super(game);
    this.w = 70;
    this.h = 70;
    this.x = random(0, this.game.$zone.width() - this.w);
    this.y = -this.h;
    this.offsets.y = 3;
    this.magnet = false;
    this.magnetSpeed = 0;

    this.createElement();
  }

  update() {
    // Притяжение к корзине
    if (this.magnet && this.game.player) {
      const targetX = this.game.player.x + this.game.player.w / 2 - this.w / 2;
      const targetY = this.game.player.y + this.game.player.h / 2 - this.h / 2;

      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));

      const ux = dx / dist;
      const uy = dy / dist;

      this.offsets.x = ux * this.magnetSpeed;
      this.offsets.y = uy * this.magnetSpeed;

      if (dist < 20) {
        this.takePoint(true);
        return;
      }
    } else {
      // Обычное падение
      this.offsets.x = 0;
    }

    // Выход за нижнюю границу
    if (this.y > this.game.$zone.height()) {
      this.takeDamage();
      return;
    }

    // Столкновение с игроком
    if (this.active && this.game.player && this.isCollision(this.game.player)) {
      this.takePoint(true);
      return;
    }

    super.update();
  }

  takeDamage() {
    if (!this.active) return;

    this.game.$zone.addClass('floor-flash');
    setTimeout(() => this.game.$zone.removeClass('floor-flash'), 250);

    if (this.$element) {
      this.$element.addClass('miss');
    }

    const $hp = $('#hp');
    $hp.addClass('flash');
    setTimeout(() => $hp.removeClass('flash'), 500);

    setTimeout(() => {
      if (this.game.remove(this)) {
        this.game.hp--;
      }
    }, 180);
  }

  takePoint(withVisual = false) {
    if (!this.active) return;

    if (withVisual && this.$element) {
      this.$element.addClass('catch');
      if (this.game.player && this.game.player.$element) {
        this.game.player.$element.addClass('shake');
        setTimeout(() => this.game.player.$element.removeClass('shake'), 180);
      }
    }

    const $points = $('#points');
    $points.addClass('pop');
    setTimeout(() => $points.removeClass('pop'), 300);

    setTimeout(() => {
      if (this.game.remove(this)) {
        this.game.points++;
      }
    }, withVisual ? 200 : 0);
  }
}

class Apple extends Fruits {
  constructor(game) {
    super(game);
  }
}
class Banana extends Fruits {
  constructor(game) {
    super(game);
    this.offsets.y = 4;
  }
}
class Orange extends Fruits {
  constructor(game) {
    super(game);
    this.offsets.y = 7;
  }
}

let random = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
