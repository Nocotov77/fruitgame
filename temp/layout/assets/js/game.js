class Game {
    constructor(name) {
        this.name = name;
        this.$zone = $('.elements');
        this.elements = [];
        this.fruits = [Apple, Banana, Orange];
        this.counterForTimer = 0;
        this.isRunning = true;
        this.points = 0;
        this.hp = 3;
        this.time = {
            m1: 0,
            m2: 0,
            s1: 0,
            s2: 0
        };
        this.ended = false;
        this.pause = false;
        this.keyEvents();
    }
    
    start() {
        this.player = new Player(this);
        this.elements.push(this.player);
        this.loop();
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
                $('.pause').css('display', 'none').hide().fadeOut();
                this.updateElements();
                this.setParams();
            } else {
                $('.pause').css('display', 'flex').show().fadeIn();
            }
            
            if (!this.ended) {
                this.loop();
            }
        });
    }

    timer() {
        let time = this.time;
        time.s2++;
        if (time.s2 >= 10) {
            time.s2 = 0;
            time.s1++;
        }
        if (time.s1 >= 6) {
            time.s1 = 0;
            time.m2++;
        }
        if (time.m2 >= 10) {
            time.m2 = 0;
            time.m1++;
        }
        let str = `${time.m1}${time.m2}:${time.s1}${time.s2}`;
        $("#timer").html(str);
    }

    keyEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape") {
                this.pause = !this.pause;
            }
        });
    }
    
    setParams() {
        // Исправлено: обновляем все параметры
        $('#name').html(this.name);
        $('#points').html(this.points);
        $('#hp').html(this.hp);
    }
    
    updateElements() {
        // Фильтруем только активные элементы
        this.elements = this.elements.filter(element => {
            if (!element.active) {
                if (element.$element) {
                    element.$element.remove();
                }
                return false;
            }
            return true;
        });
        
        // Обновляем оставшиеся элементы
        this.elements.forEach(e => {
            e.update();
            if (e.active) {
                e.draw();
            }
        });
    }

    randomFruitGenerate() {
        let ranFruit = random(0, 2);
        this.generate(this.fruits[ranFruit]);
    }

    generate(FruitClass) {
        const fruit = new FruitClass(this);
        this.elements.push(fruit);
    }

    remove(el) {
        let idx = this.elements.indexOf(el);
        if (idx !== -1) {
            this.elements.splice(idx, 1);
            if (el.$element) {
                el.$element.remove();
            }
            return true;
        }
        return false;
    }

    stop() {
        this.ended = true;
        this.elements.forEach(e => {
            if (e.$element) {
                e.$element.remove();
            }
        });
        this.elements = [];
    }
    
    end() {
        this.ended = true;
        let time = this.time;
        
        // Исправлено: убрана лишняя скобка и опечатка в переменной
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
        
        // Используем глобальную функцию go
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
        this.offsets = {
            x: 0,
            y: 0
        };
        this.active = true;
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
        let a = {
            x1: this.x,
            x2: this.x + this.w,
            y1: this.y,
            y2: this.y + this.h,
        };

        let b = {
            x1: element.x,
            x2: element.x + element.w,
            y1: element.y,
            y2: element.y + element.h,
        };
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
        this.skillTimer = 0;
        this.couldTimer = 0;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };
        this.createElement();
        this.bindKeyEvents();
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
        // Исправлено: проверяем активность элементов перед изменением
        for (let i = 1; i < this.game.elements.length; i++) {
            let element = this.game.elements[i];
            if (element && element.active) {
                if (element.x < this.x + (this.w / 2)) {
                    element.x += 15;
                } else if (element.x > this.x + (this.w / 2)) {
                    element.x -= 15;
                }
            }
        }
    }
    
    update() {
        if (this.keys.ArrowLeft && this.x > 0) {
            this.offsets.x = -this.speedPerFrame;
        } else if (this.keys.ArrowRight && this.x < this.game.$zone.width() - this.w) {
            this.offsets.x = this.speedPerFrame;
        } else {
            this.offsets.x = 0;
        }
        
        if (this.keys.Space && this.couldTimer === 0) {
            this.skillTimer++;
            $('#skill').html(`осталось ${Math.ceil((240 - this.skillTimer) / 60)}`);
            this.applySkill();
        }
        
        if (this.skillTimer > 240 || (!this.keys.Space && this.skillTimer > 1)) {
            this.couldTimer++;
            $('#skill').html(`в откате ещё ${Math.ceil((300 - this.couldTimer) / 60)}`);
            this.keys.Space = false;
        }
        
        if (this.couldTimer > 300) {
            this.couldTimer = 0;
            this.skillTimer = 0;
            $('#skill').html('Готово');
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
        this.createElement();
    }

    update() {
        // Проверяем выход за нижнюю границу
        if (this.y > this.game.$zone.height()) {
            this.takeDamage();
            return;
        }

        // Проверяем коллизию с игроком
        if (this.active && this.game.player && this.isCollision(this.game.player)) {
            this.takePoint();
            return;
        }

        super.update();
    }

    takeDamage() {
        if (this.game.remove(this)) {
            this.game.hp--;
        }
    }

    takePoint() {
        if (this.game.remove(this)) {
            this.game.points++;
        }
    }
}

class Apple extends Fruits {
    constructor(game) {
        super(game);
        this.offsets.y = 5;
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
}