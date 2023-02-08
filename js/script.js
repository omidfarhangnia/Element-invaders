// register change page effect
gsap.registerEffect({
    name: "changePage",
    effect: (targets) => {
        return gsap.timeline().fromTo(".meteorite__image__container", {
            left: "110%"
        },{
            left: "-110%",
            duration: 4,
            ease: "linear",
            delay: 1
        }).fromTo(targets, {
            left: "100%"
        },{
            left: "0",
            duration: 2,
            ease: "linear",
        }, "-=3.5")
    },
    extendTimeline: true
})
gsap.registerEffect({
    name: "showText",
    effect: (targets, config) => {
        return gsap.fromTo(targets, {
            y: 50,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: config.duration,
            onComplete: config.onComplete,
            onStart: config.onStart,
            ease: "expo.out",
        })
    },
    extendTimeline: true
})
gsap.registerEffect({
    name: "orderAnime",
    effect: (target, config) => {
        return gsap.to(target,{
            opacity: 0,
            duration: .5,
            repeat: -1,
            yoyo: true,
            id: config.id
        })
    },
    extendTimeline: true
});
gsap.registerEffect({
    name: "hidePrevTexts",
    effect: (target, config) => {
        return gsap.to(target,{
            y: 50,
            opacity: 0,
            stagger: config.stagger,
            ease: "linear",
            onStart: config.onStart,
            onComplete: config.onComplete,
        })
    },
    extendTimeline: true
});

const gameContainer = $("#game__container")
const mainShip = $(".main__ship")
const mainShipBulletContainer = $(".main__ship--bullet__container");
const mainShipBlasterContainer = $(".main__ship--blaster__container");
const fuelContainer = $("#main__ship__fuelData div.current__fuel__level");
const pageTutorial = $(".page__tutorial")

var blaster__num = 0,
    rifle__num = 0,  
    RightClickTimeOut = 0,
    RightClickSetInterval = 0,
    blasterCountingSituation = false,
    isFuelEndless = true,
    isCountingActive = false,
    recoverFuelContainer, reloading,
    checkRiflePosStepByStep = null,
    checkBlasterPosStepByStep = null,
    CurrentEnemiesData = [],
    isShipDamageActive = false,
    currentHeartNumber = 4,
    isShipInImmortalMode = false;

$('#go__tutorial, #tutorial').click(goToTutorial)

const mainShipSize = {
    width: 100, 
    halfOfWidth: (100 / 2),
    height: 100,
    halfOfHeight: (100 / 2),
};

function idMaker(num) {
    let idLength = `${num}`.length,
    numContainer = num;
    for(var i = 0; i < (9 - idLength); i++){
        numContainer = "0" + numContainer
    }
    return numContainer;
}

let xPos = gsap.quickTo(mainShip, "x", {duration: .3, ease: "power4.out"}),
    yPos = gsap.quickTo(mainShip, "y", {duration: .3, ease: "power4.out"});

let TutorialAnime = gsap.timeline();
const pauseTutorialAnime = () => {
    TutorialAnime.pause();
}

const resumeTutorialAnime = () => {
    TutorialAnime.resume();
}

const pauseOrderAnime = (id) => {
    gsap.getById(`prag__${id}__order`).seek(0).kill();
}

class mainShipRifle {
    constructor (level, isFuelEndless, endFunction) {
        this.level = level;
        this.isFuelEndless = isFuelEndless;
        this.endFunction = endFunction;
    }
    fireRifle() {
        let fuelContainerHeight = 262.5;
        let currentBulletsId = idMaker(rifle__num);

        if(this.isFuelEndless === false){
            let currentFuelLevel = fuelContainer.height();
            let newFuelLevel = currentFuelLevel + (fuelContainerHeight / 100 * 4);
            let newPercent = currentFuelLevel / fuelContainerHeight * 100;
            clearTimeout(recoverFuelContainer)
            clearTimeout(reloading)
            recoverFuelContainer = setTimeout(() => {
                reloading = setInterval(() => {
                    if(newFuelLevel <= 0) {
                        clearInterval(reloading)
                    }
                    newFuelLevel = newFuelLevel - (fuelContainerHeight / 100 * 1);
                    fuelContainer.css("height", `${newFuelLevel}px`);
                }, 50);
            }, 1000);
            if(newPercent >= 25){
                fuelContainer.css("background", `#ffe436`);
                if(newPercent >= 50){
                    fuelContainer.css("background", `#ff721b`);
                    if(newPercent >= 75){
                        fuelContainer.css("background", `#ff4c12`);
                        if(newPercent >= 100){
                            fuelContainer.css({"background": `#FF0000`});
                            return;
                        }
                    }
                }
            }else{
                fuelContainer.css("background", `#23FF00`);
            }
            fuelContainer.css("height", `${newFuelLevel}px`);
        }

        if(this.level >= 1){
            let $bullet1 = $(`<div class="mainShip__bullet mainShip__bullet--num--1"></div>`);
            mainShipBulletContainer.append($bullet1)
            
            if(this.level >= 2){
                let $bullet2 = $(`<div class="mainShip__bullet mainShip__bullet--num--2"></div>`);
                mainShipBulletContainer.append($bullet2)
                
                if(this.level === 3){
                    let $bullet3 = $(`<div class="mainShip__bullet mainShip__bullet--num--3"></div>`);
                    mainShipBulletContainer.append($bullet3)
                }
            }
        }

        let mainShipBulletContainerClone = mainShipBulletContainer.clone();
        mainShipBulletContainerClone.attr("id", `${currentBulletsId}-rifleBullet`)
        
        mainShipBulletContainerClone.appendTo(gameContainer);

        gsap.set(mainShipBulletContainerClone, {
            top: mainShip.position().top,
            left: mainShip.position().left,
            zIndex: 1,
            rotate: -90
        })

        gsap.to(mainShipBulletContainerClone, {
            top: "-=1000",
            duration: .75,
        })
    }
    calcDamage() {
        let currentBulletsId = idMaker(rifle__num);
        let rifleBulletContainer = $(`#${currentBulletsId}-rifleBullet`);

        checkRiflePosStepByStep = setInterval(() => {
            for(var i = 0; i < CurrentEnemiesData.length; i++){
                if(rifleBulletContainer.position().left <= CurrentEnemiesData[i].enemyPos.left + 60 &&
                   rifleBulletContainer.position().left >= CurrentEnemiesData[i].enemyPos.left - 60){
                    if(rifleBulletContainer.position().top <= CurrentEnemiesData[i].enemyPos.top + 350 &&
                       rifleBulletContainer.position().top >= CurrentEnemiesData[i].enemyPos.top){    
                        if(CurrentEnemiesData[i].isEnemyAlive === true){
                            let newHealth = CurrentEnemiesData[i].enemyHealth.current - this.level;
                            let mainFirstHealth = CurrentEnemiesData[i].enemyHealth.first;

                            $(`.enemy__num__${CurrentEnemiesData[i].enemyNum} .current__health`).css(
                                "height", `${(newHealth * 100 / mainFirstHealth)}%`)
                            
                            CurrentEnemiesData[i].enemyHealth.current = newHealth;
                            rifleBulletContainer.remove();

                            if(CurrentEnemiesData[i].enemyHealth.current <= 0){
                                $(`.enemy__num__${CurrentEnemiesData[i].enemyNum}`).addClass("destroyed__ship");
                                CurrentEnemiesData[i].isEnemyAlive = false;
                            }
                            isGameEnded(this.endFunction);
                            clearInterval(checkRiflePosStepByStep);
                        }
                    }
                }
            }
        }, 10);
        
        setTimeout(() => {
            rifleBulletContainer.remove();
            clearInterval(checkRiflePosStepByStep);
        }, 750);

        rifle__num++;
    }
}

class mainShipBlaster {
    constructor(isBlasterReady, blastersId, isCountingActive, allowableBlasterNumber, endFunction) {
        this.isBlasterReady = isBlasterReady;
        this.blastersId = blastersId;
        this.isCountingActive = isCountingActive;
        this.allowableBlasterNumber = allowableBlasterNumber;
        this.endFunction = endFunction;
    }
    fireBlaster() {
        if(this.isBlasterReady !== true) return;

        if(this.isCountingActive === true){
            blaster__num++;
            if(this.allowableBlasterNumber <= this.blastersId){
                $("#main__ship__blasterData").addClass("blasterAlarm")
                return;
            }else{
                $(".blaster__num .num").text(`${this.allowableBlasterNumber - 1 - this.blastersId}`);
                // this one is here because we are decreasing the number but not the number that is available here
                // the outer number is changing and we need a change for this number
            }
        }


        let mainShipBlasterContainerClone = mainShipBlasterContainer.clone();
        let currentBlastersId = idMaker(this.blastersId);
        let $blaster1 = $(`<div class="mainShip__blaster mainShip__blaster--num--1"></div>`).attr("id", currentBlastersId);
        let $blaster2 = $(`<div class="mainShip__blaster mainShip__blaster--num--2"></div>`).attr("id", currentBlastersId);
        mainShipBlasterContainerClone.append([$blaster1, $blaster2]);

        mainShipBlasterContainerClone.attr("id", `${currentBlastersId}-blasterBullet`)

        mainShipBlasterContainerClone.appendTo(gameContainer);


        gsap.set(mainShipBlasterContainerClone, {
            top: mainShip.position().top,
            left: mainShip.position().left,
            zIndex: 1,
            rotate: -90
        })

        gsap.to(mainShipBlasterContainerClone, {
            top: "-=1000",
            duration: 1.2 ,
        }) 
    }
    calcDamage() {
        let currentBlastersId = idMaker(this.blastersId);
        let blasterDamage = 10;
        let blasterBulletContainer = $(`#${currentBlastersId}-blasterBullet`);

        checkBlasterPosStepByStep = setInterval(() => {
            for(var i = 0; i < CurrentEnemiesData.length; i++){
                if(blasterBulletContainer.position().left <= CurrentEnemiesData[i].enemyPos.left + 60 &&
                   blasterBulletContainer.position().left >= CurrentEnemiesData[i].enemyPos.left - 60){
                    if(blasterBulletContainer.position().top <= CurrentEnemiesData[i].enemyPos.top + 350 &&
                       blasterBulletContainer.position().top >= CurrentEnemiesData[i].enemyPos.top){
                        if(CurrentEnemiesData[i].isEnemyAlive === true){
                            let newHealth = CurrentEnemiesData[i].enemyHealth.current - blasterDamage;
                            let mainFirstHealth = CurrentEnemiesData[i].enemyHealth.first;

                            $(`.enemy__num__${CurrentEnemiesData[i].enemyNum} .current__health`).css(
                                "height", `${(newHealth * 100 / mainFirstHealth)}%`)
                            
                            CurrentEnemiesData[i].enemyHealth.current = newHealth;
                            blasterBulletContainer.remove();

                            if(CurrentEnemiesData[i].enemyHealth.current <= 0){
                                $(`.enemy__num__${CurrentEnemiesData[i].enemyNum}`).addClass("destroyed__ship");
                                CurrentEnemiesData[i].isEnemyAlive = false;
                                // explosion animation and the element
                                let blasterExplosion = $(`<div class='blasterExplosion'></div>`);
                                blasterExplosion.appendTo(gameContainer);
                                
                                blasterExplosion.css({
                                    "animation": "explosionAnimation 2s ease-in-out both",
                                    "top": (CurrentEnemiesData[i].enemyPos.top * -1) - 60,
                                    // the top value that i give is negative and i should make in positive
                                    "left": CurrentEnemiesData[i].enemyPos.left
                                });

                                setTimeout(() => {
                                    blasterExplosion.remove();
                                }, 2000);
                            }
                            clearInterval(checkBlasterPosStepByStep);
                        }
                    }
                }
            }
        }, 20);

        setTimeout(() => {
            clearInterval(checkBlasterPosStepByStep);
            blasterBulletContainer.remove();
        }, 750);
        setTimeout(() => {
            isGameEnded(this.endFunction); 
        }, 2000);
    }
}

goToTutorial()
function goToTutorial() {
    let groupOneTexts = [
        ".tutorial__prag__num9",
        ".tutorial__prag__num8",
        ".tutorial__prag__num7",
        ".tutorial__prag__num6",
        ".tutorial__prag__num5",
        ".tutorial__prag__num4",
        ".tutorial__prag__num3",
        ".tutorial__prag__num2",
        ".tutorial__prag__num1"
    ];

    let groupTwoTexts = [
        ".tutorial__prag__num14",
        ".tutorial__prag__num13",
        ".tutorial__prag__num12",
        ".tutorial__prag__num11",
        ".tutorial__prag__num10",
        ".tutorial__headers",
    ];

    TutorialAnime
    .changePage(pageTutorial)
    .showText(".tutorial__headers", {duration: .5}, "+=1")
    .showText(".tutorial__prag__num1", {duration: .5}, "+=2")
    .to(".tutorial__prag__num1", {
        x: -50,
        duration: 1,
        opacity: 0
    }, "+=2")
    // i want to hide my wish
    .showText(".tutorial__prag__num2", {duration: .5}, "+=1")
    .showText(".tutorial__prag__num3", {duration: .5}, "+=2.5")
    .fromTo(mainShip, {
        y: window.innerHeight,
        x: (window.innerWidth / 2) - mainShipSize.halfOfWidth
    },{
        duration: 1.3,
        y: "-=500",
        ease: "back.out(.6)"
    })
    .showText(".tutorial__prag__num4", {duration: .5}, "+=1")
    .showText(".tutorial__prag__num5", {duration: .5}, "+=2.5")
    .showText(".tutorial__prag__num6", {duration: .5, onComplete: function() {
        shipMovement()
        pauseTutorialAnime();
        gsap.effects.orderAnime(".tutorial__prag__num6 .order", {id: "prag__6__order"})
    }}, "+=2.5")
    .showText(".tutorial__prag__num7", {duration: .5, onStart: function() {pauseOrderAnime(6)}}, "+=2")
    .showText(".tutorial__prag__num8", {duration: .5, onComplete: function() {
        makeRifleReady();
        pauseTutorialAnime();
        gsap.effects.orderAnime(".tutorial__prag__num8 .order", {id: "prag__8__order"})
    }}, "+=2.5")
    .showText(".tutorial__prag__num9", {duration: .5, onComplete: function() {
        makeBlasterReady();
        pauseTutorialAnime();
        gsap.effects.orderAnime(".tutorial__prag__num9 .order", {id: "prag__9__order"})
    }, onStart: function() {pauseOrderAnime(8)}}, "+=3")
    .hidePrevTexts(groupOneTexts, {stagger: .5, onComplete: function() {
        $.each(groupOneTexts, function(index, element) {
            $(`${element}`).remove();
        }) 
    }}, "+=3")
    .showText(".tutorial__prag__num10", {duration: .5, onStart: function(){pauseOrderAnime(9)}}, "+=3")
    .showText(".tutorial__prag__num11", {duration: .5}, "fuelContainerAnime+=3")
    .to("#main__ship__blasterData", {
        left: "0",
        duration: .5,
        ease: "power4.out",
        onStart: blasterCounterIsReady,
    }, "fuelContainerAnime+=3")
    .showText(".tutorial__prag__num12", {duration: .5}, "blasterContainerAnime+=3")
    .to("#main__ship__fuelData", {
        right: "0",
        duration: .5,
        ease: "power4.out",
        onStart: fuelContainerIsReady,
    }, "blasterContainerAnime+=3")
    .showText(".tutorial__prag__num13", {duration: .5}, "healthContainerAnime+=3")
    .to("#main__ship__healthData", {
        right: "0",
        duration: .5,
        ease: "power4.out",
        onStart: healthContainerIsReady,
    }, "healthContainerAnime+=3")
    .showText(".tutorial__prag__num14", {duration: .5, onComplete: function(){
        pressToContinue()
        pauseTutorialAnime();
        gsap.effects.orderAnime(".tutorial__prag__num14 .order", {id: "prag__13__order"})
    }}, "+=5")
    .hidePrevTexts(groupTwoTexts, {stagger: .2, onComplete: makeEnemyReady, onstart: function() {pauseOrderAnime(13)}}, "+=3")
    .fromTo(".enemy__container > div", 
    {
        y: -300,
    },{
        y: 0,
        duration: .5,
        stagger: .2,
        onComplete: pauseTutorialAnime
    }, "+=1")
    .showText(".tutorial__over__message", {duration: .75})
    .showText(".tutorial__over__btn", {duration: .75, onComplete: pressToContinue})
    .hidePrevTexts(".tutorial__over__message, .tutorial__over__btn", {stagger: .4, onComplete: controllersAnime})

    TutorialAnime.timeScale(3);
    // TutorialAnime.progress(.93);
}

function makeRifleReady() {
    $("body").on({
        "click": function() {
            rifle = new mainShipRifle(3, isFuelEndless, resumeTutorialAnime);
            rifle.fireRifle();
            rifle.calcDamage();
        },
        "mousedown" : function() {
            timeOutId = setTimeout(function() {
                RightClickSetInterval = setInterval(() => {
                    let rifle = new mainShipRifle(3, isFuelEndless, resumeTutorialAnime);
                    rifle.fireRifle();
                    rifle.calcDamage();
                }, 250);
            }, 500)
        },
        "mouseup" : function() {
            clearTimeout(timeOutId);
            clearTimeout(RightClickSetInterval);
        }
    })

    gameContainer.one("click", resumeTutorialAnime)
}

function makeBlasterReady() {
    $("body").one("keydown", function(event) {
        if(event.originalEvent.code === "Space"){
            resumeTutorialAnime()
        }
    }) 

    $("body").on("keydown", function(event) {
        if(event.originalEvent.code === "Space"){
            let blaster = new mainShipBlaster(true, blaster__num, isCountingActive, 20 , resumeTutorialAnime);
            blaster.fireBlaster();
            blaster.calcDamage();
        }
    })
};

function shipMovement() {
    gameContainer.css("cursor", "none")
    gameContainer.on("mousemove", (event) => {
        let page__width = window.innerWidth,
            page__height = window.innerHeight

        xPos(gsap.utils.clamp(0, (page__width - mainShipSize.width) , (event.pageX - mainShipSize.halfOfWidth)))
        yPos(gsap.utils.clamp(0, (page__height - mainShipSize.height), (event.pageY - mainShipSize.halfOfHeight)))

        // i used utils.clamp for having a condition for controlling the ship without
        // this condition my ship will gone out of VIEW PORT 

        if(isShipDamageActive === true){
            for(var i = 0; i < CurrentEnemiesData.length; i++){
                if(mainShip.position().left <= CurrentEnemiesData[i].enemyPos.left + 50 &&
                   mainShip.position().left >= CurrentEnemiesData[i].enemyPos.left - 50){
                    if(mainShip.position().top <= CurrentEnemiesData[i].enemyPos.top + 400 &&
                       mainShip.position().top >= CurrentEnemiesData[i].enemyPos.top + 300){
                        // plus 300 is for the line 432 in this line we have an animation for 
                        // putting element in the page with an animation
                        // and 75 is the size of element
                        if(CurrentEnemiesData[i].isEnemyAlive === true){
                            if(isShipInImmortalMode === false){
                                let currentHealth = $(`.heart__num__${currentHeartNumber}`);
                                currentHeartNumber--;

                                if(currentHeartNumber >= 0){
                                    gsap.to(currentHealth, {
                                        opacity: 0,
                                        duration: .3,
                                        ease: "power4.out",
                                        repeat: 1,
                                        yoyo: true,
                                    });
                                    currentHealth.html("<i class='far fa-heart'></i>");
                                    isShipInImmortalMode = true;
                                    gsap.to(mainShip, {
                                        opacity: 0,
                                        duration: .2,
                                        ease: "linear",
                                        repeat: 5,
                                        onComplete: function(){
                                            gsap.set(mainShip, {opacity: 1});
                                        }
                                    })
                                    setTimeout(() => {
                                        isShipInImmortalMode = false;
                                    }, 2000);
                                }
                                else{
                                    currentHeartNumber = 0;
                                    // looseMessage()
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    gameContainer.one("mousemove", resumeTutorialAnime)
}

function blasterCounterIsReady() {
    isCountingActive = true;
}

function fuelContainerIsReady() {
    isFuelEndless = false;
}

function pressToContinue() {
    $("body").one("keydown", resumeTutorialAnime)
}

function makeEnemyReady() {
    let activeEnemies = $(".enemy__container > div");

    activeEnemies.each(function( idx, element){
        let obj = {
            "enemyPos": $(element).position(),
            "enemyNum": idx + 1,
            "isEnemyAlive": true,
            "enemyHealth": {
                "current": 9,
                "first": 9
            }
        }

        CurrentEnemiesData.push(obj);
    });
};

function isGameEnded(callback) {
    let isAnyAlive;

    $.each(CurrentEnemiesData, function(index, value){
        if(value.isEnemyAlive === false){
            isAnyAlive = false;
        }else{
            isAnyAlive = true;
            return false;  
        }
    })

    if(isAnyAlive === false){
        callback();
    }
}

function healthContainerIsReady() {
    isShipDamageActive = true;
}

function controllersAnime() {
    let tl = gsap.timeline();
    tl
    .to("#main__ship__fuelData, #main__ship__healthData", {
        right: "-80",
        duration: 1,
        ease: "power4.out"
    }, "controllersLabel")
    .to("#main__ship__blasterData", {
        left: "-150"
    }, "controllersLabel");

    gameContainer.on({
        "mousemove": function() {$("*").off()},
    })
}