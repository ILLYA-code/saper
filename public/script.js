import { addData, getScoresFromFirestore } from './firebase-config.js';

let field = document.querySelector('#field');
let sizeMenuElement = document.getElementById('size-menu');
let complexityMenyElement = document.getElementById('complexity-menu');
let countElement = document.getElementById('count');
let timerElement = document.getElementById('timer');
let bestTimerElement = document.getElementById('best');
let retryButton = document.getElementById('retry-button');
let victoryPlayButton = document.getElementById('victory-play-button');
let gameOverBoxElement = document.getElementById('game-over-box');
let gameVictoryElement = document.getElementById('victory-box');
let boardBtn = document.getElementById('board-btn');
let mobileBestTimerElement = document.getElementById('mobile-best-timer');
let mobileTimerElement = document.getElementById('mobile-timer');
let mobileTimerTextElement = document.getElementById('mobile-timer-text');
let mobileBestTimerTextElement = document.getElementById('mobile-best-timer-text');

let isFlagPressed = false;

let isMobile = false;
const setIsMobile = (n) => isMobile = n;

setTimeout(() => {
    mobileBestTimerElement.style.height = mobileTimerElement.offsetHeight + 'px';
}, 100);

let timerInterval;
let seconds = 0;
let minutes = 0;

let cellsOpened = 0;
let isVictory = false;

let playerName = localStorage.getItem("playerName");

function generatePlayerId() {
    let id = '';
    for (let i = 0; i < 10; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

let playerID = localStorage.getItem("playerID");
if (!playerID) {
    playerID = generatePlayerId();
    localStorage.setItem("playerID", playerID);
}

let currentMode = 'normal10';
const updateCurrentMode = (n) => currentMode = n;

let localStorageKeys = ['easy10', 'easy17', 'easy24', 'normal10', 'normal17', 'normal24', 'hard10', 'hard17', 'hard24']
let localStorageKeysValuesMap = new Map();

let isCheat1Active = false;
let isCheat2Active = false;

const getTimeBySeconds = (sec) => {
    let localMinutes = Math.floor(sec / 60) % 60;
    let localSeconds = sec % 60;
    if (localMinutes < 10) {
        localMinutes = `0${localMinutes}`;
    }
    if (localSeconds < 10) {
        localSeconds = `0${localSeconds}`;
    }
    if (sec >= 3600) {
        let localHours = Math.floor(sec / 3600);
        return `${localHours}:${localMinutes}:${localSeconds}`;
    } else {
        return `${localMinutes}:${localSeconds}`;
    }
}

localStorageKeys.forEach((el) => {
    if (localStorage.getItem(el)) {
        localStorageKeysValuesMap.set(el, localStorage.getItem(el));
        if (currentMode === el) {
            bestTimerElement.innerText = getTimeBySeconds(localStorage.getItem(el) * 1);
            mobileBestTimerTextElement.innerText = getTimeBySeconds(localStorage.getItem(el) * 1);
        }
    } else {
        localStorageKeysValuesMap.set(el, 'none');
    }
})

let amount = localStorage.getItem('amount') * 1;
const updateAmount = (n) => {
    amount = n * 1;
    localStorage.setItem('amount', n * 1);
}
if (!amount) {
    updateAmount(10);
}

let bombsCount = localStorage.getItem('bombsCount');
const writeBombsCount = (n) => countElement.innerText = n;

const updateBombsCount = (n) => {
    bombsCount = n;
    writeBombsCount(n);
    localStorage.setItem('bombsCount', bombsCount);
}

if (!bombsCount) {
    updateBombsCount(15);
}

let cellSize = 50;

let winWidth = 0;
let winHeight = 0;

const updateWinSize = () => {
    winWidth = window.innerWidth;
    winHeight = window.innerHeight;
    let c = 0;
    if (window.innerWidth > 767) {
        c = 100;
    } else {
        c = 10
    }
    return (winWidth > winHeight ? winHeight - 50 : winWidth) - c;
};

let cellsMap = new Map();
let bombsArray = [];
let markedCells = [];

let isFirstOpening = true;
let isGameOver = false;

const writeBestTimer = () => {
    if (localStorage.getItem(currentMode)) {
        let currentBest = localStorage.getItem(currentMode);
        if (currentBest === 'none') {
            bestTimerElement.innerText = '--:--';
            mobileBestTimerTextElement.innerText = '--:--';
        } else if (currentBest * 1 > 0) {
            bestTimerElement.innerText = getTimeBySeconds(currentBest);
            mobileBestTimerTextElement.innerText = getTimeBySeconds(currentBest);
        }
    } else {
        bestTimerElement.innerText = '--:--';
        mobileBestTimerTextElement.innerText = '--:--';
    }
}

// let isChoiceActive = false;
// let lastChoiceId = '';

const reDrawField = (amount) => {
    cellsOpened = 0;
    isVictory = false;
    bombsArray = [];
    field.innerHTML = '';
    cellsMap.clear();
    markedCells = [];
    isFirstOpening = true;
    isGameOver = false;
    sizeMenuElement.disabled = false;
    complexityMenyElement.disabled = false;
    boardBtn.href = './board.html'
    seconds = 0;
    minutes = 0;
    writeBestTimer();

    let winSize = updateWinSize();
    field.style.maxWidth = winSize + "px";
    field.style.maxHeight = (winSize + 4) + "px";
    
    for(let i = 0; i < amount; i++) {
        let newRow = document.createElement('div');
        newRow.classList.add('row');

        for(let j = 0; j < amount; j++) {
            let newCell = document.createElement('div');
            cellSize = winSize / amount;
            newCell.style.width = `${cellSize}px`;
            newCell.style.height = `${cellSize}px`;
            newCell.style.fontSize = `${cellSize / 1.3}px`

            let cellId = `x${j}y${i}`
            newCell.id = cellId;
            newCell.classList.add('cell');

            cellsMap.set(cellId, {
                id: cellId,
                bomb: false,
                marked: false,
                opened: false,
                bombsAround: 0,
                x: j,
                y: i
            });

            let pressTimer;
            const LONG_PRESS_THRESHOLD = 250;

            newCell.addEventListener('mousedown', (event) => {
                if (event.button === 0) {
                    openCell(cellId);
                } else if (event.button === 2) {
                    markCell(cellId);
                }
            });

            newCell.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            })

            newCell.addEventListener('touchstart', e => {
                e.preventDefault();
                pressTimer = setTimeout(() => {
                    markCell(cellId);
                    pressTimer = null;
                }, LONG_PRESS_THRESHOLD);
            });

            newCell.addEventListener('touchend', () => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    openCell(cellId);
                }
                pressTimer = null;
            });

            newCell.addEventListener('touchcancel', () => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                }
                pressTimer = null;
            });

            newRow.appendChild(newCell);
        }

        field.appendChild(newRow);
    }
}

// reDrawField(10);

const getNeighbors = (x, y) => {
    let neighborsArray = [
        `x${x - 1}y${y - 1}`,
        `x${x}y${y - 1}`,
        `x${x + 1}y${y - 1}`,
        `x${x - 1}y${y}`,
        `x${x + 1}y${y}`,
        `x${x - 1}y${y + 1}`,
        `x${x}y${y + 1}`,
        `x${x + 1}y${y + 1}`,
    ];

    return neighborsArray;
}

const continueOpening = (cellsAround) => {
    cellsAround.forEach((el) => {
        if (cellsMap.has(el) && !cellsMap.get(el).opened) {
            openCell(el);
        }
    })
}

const gameOver = () => {
    isGameOver = true;
    clearInterval(timerInterval);
    markedCells.forEach((el) => {
        if (cellsMap.get(el).bomb) {
            document.getElementById(el).innerHTML = '';
        }
    });

    for(let i = 0; i < bombsArray.length; i++) {
        setTimeout(() => {
            document.getElementById(bombsArray[i]).classList.add('live-bomb');
        }, 30 + (i * 30));
    }

    setTimeout(() => {
        gameOverBoxElement.style.display = 'flex';
    }, 30 + bombsArray.length * 30);
}

let scoresFromFirestoreResponse = await getScoresFromFirestore() || null;
let nicknamesArray = [];

const checkForVictory = () => {
    if ((amount * amount) - bombsArray.length === cellsOpened) {
        isVictory = true;
        clearInterval(timerInterval);
        let lastBest = localStorageKeysValuesMap.get(currentMode);
        gameVictoryElement.style.display = 'flex';
        
        if (lastBest === 'none' || lastBest * 1 > seconds) {
            localStorageKeysValuesMap.set(currentMode, seconds);
            localStorage.setItem(currentMode, seconds);

            const getPlayerName = (text) => {
                let newNickname = prompt(text);
                
                if (nicknamesArray.includes(newNickname)) {
                    getPlayerName('this nickname already exist, try to create some unique');
                }

                return newNickname;
            }

            if (!playerName) {
                playerName = prompt("create a unique nickname");
                if (scoresFromFirestoreResponse) {
                    scoresFromFirestoreResponse.scores.forEach((el) => {
                        nicknamesArray.push(el.playerName);
                    });
                }
                if (nicknamesArray.includes(playerName)) {
                    playerName = getPlayerName('this nickname already exist, try to create some unique');
                }
                localStorage.setItem("playerName", playerName);
            }

            addData(currentMode, playerID, playerName, seconds).then(res => {
                if (res.success) {
                    // console.log("Тестовий запис успішно додано через setTimeout.");
                    // handleGetScores(); // Оновлюємо рекорди, щоб побачити тестовий запис
                } else {
                    console.error("Помилка додавання тестового запису: ", res.error);
                }
            });
        }
    }
}

const openCell = (id) => {
    // if (isChoiceActive) {
    //     document.getElementById(`${id}choice`).style.display = 'none';
    //     return;
    // }
    
    if (isGameOver || isVictory) {
        return;
    }
    
    if (cellsMap.get(id).marked) {
        markCell(id);
        return;
    }

    if (bombsArray.includes(id)) {
        gameOver();
        return;
    } else {
        let cellsAroundArray = getNeighbors(cellsMap.get(id).x, cellsMap.get(id).y);
        
        if (cellsMap.get(id).opened) {
            let flagsAround = 0;
            
            cellsAroundArray.forEach((el) => {
                if (cellsMap.has(el) && cellsMap.get(el).marked) {
                    flagsAround++;
                }
            });

            if (flagsAround === cellsMap.get(id).bombsAround) {
                cellsAroundArray.forEach((el) => {
                    if (cellsMap.has(el) && !cellsMap.get(el).marked && !cellsMap.get(el).opened) {
                        openCell(el);
                    }
                })
            }
        } else {
            if (isFirstOpening) {
                isFlagPressed = false;
                sizeMenuElement.disabled = true;
                complexityMenyElement.disabled = true;
                boardBtn.href = 'javascript:void(0);';
                bombsArray = [];
                generateBombs(bombsCount, [...cellsAroundArray, id]);
                isFirstOpening = false;
                timerInterval = setInterval(() => {
                    seconds++; 
                    timerElement.innerText = getTimeBySeconds(seconds);
                    mobileTimerTextElement.innerText = getTimeBySeconds(seconds);
                }, 1000);
            }

            let bombsAroundCount = cellsMap.get(id).bombsAround;

            let currentColor = 'black';

            if (bombsAroundCount === 0) {
                currentColor = 'rgb(0, 194, 0)'
            } else if (bombsAroundCount === 1 || bombsAroundCount === 2) {
                currentColor = 'green';
            } else if (bombsAroundCount === 3 || bombsAroundCount === 4) {
                currentColor = 'rgb(108, 138, 0)';
            } else if (bombsAroundCount === 5 || bombsAroundCount === 6) {
                currentColor = 'red';
            } else if (bombsAroundCount >= 7) {
                currentColor = 'rgb(72, 0, 94)';
            }

            let currentElement = document.getElementById(id);
            currentElement.style.color = currentColor;
            currentElement.style.background = 'white'
            bombsAroundCount > 0 ? currentElement.innerText = bombsAroundCount : null;

            cellsMap.set(id, { ...cellsMap.get(id), opened: true });
            cellsOpened++;
            checkForVictory();

            if (bombsAroundCount === 0) {
                continueOpening(cellsAroundArray);
            }
        }
    }
}

const markCell = (id) => {
    if (isGameOver || isFirstOpening || isVictory) {
        return;
    }
    if (!cellsMap.get(id).opened && (bombsCount - markedCells.length) > 0) {
        cellsMap.set(id, { ...cellsMap.get(id), marked: !cellsMap.get(id).marked });
        let currentCellElement = document.getElementById(id);
        if (cellsMap.get(id).marked) {
            let flagElement = document.createElement('div');
            flagElement.classList.add('flag');
            flagElement.innerHTML = '<div class="red"></div><div></div>';
            currentCellElement.appendChild(flagElement);
            markedCells.push(id);
            writeBombsCount(bombsCount - markedCells.length);
        } else {
            currentCellElement.innerHTML = '';
            markedCells.splice(markedCells.indexOf(id), 1);
            writeBombsCount(bombsCount - markedCells.length);
        }
    } else if (cellsMap.get(id).marked) {
        cellsMap.set(id, { ...cellsMap.get(id), marked: !cellsMap.get(id).marked });
        let currentCellElement = document.getElementById(id);
        currentCellElement.innerHTML = '';
        markedCells.splice(markedCells.indexOf(id), 1);
        writeBombsCount(bombsCount - markedCells.length);
    }
}

const getRandomNumber = (min, max) => {
    let nn = min + Math.floor(Math.random() * max);
    return nn;
}

const generateBombs = (countOfBombs, cellsArea) => {
    let cx, cy;
    let bombId;

    const generateCoords = () => {
        cx = getRandomNumber(0, amount);
        cy = getRandomNumber(0, amount);
        bombId = `x${cx}y${cy}`;

        if (cellsArea.includes(bombId) || bombsArray.includes(bombId)) {
            generateCoords();
        } else {
            bombsArray.push(bombId);
        }
    }
    
    for(let i = 0; i < countOfBombs; i++) {
        generateCoords();
    }

    bombsArray.forEach((el) => {
        cellsMap.set(el, { ...cellsMap.get(el), bomb: true });

        let neighbors = getNeighbors(cellsMap.get(el).x, cellsMap.get(el).y);

        neighbors.forEach((n) => {
            if (cellsMap.has(n)) {
                cellsMap.set(n, { ...cellsMap.get(n), bombsAround: cellsMap.get(n).bombsAround + 1 })
            }
        })
    });
}

// let lastComplexity = 2;
let lastComplexity = localStorage.getItem('lastComplexity');
if (!lastComplexity) {
    lastComplexity = 2;
    localStorage.setItem('lastComplexity', 2);
}

const updateComplexity = (comp) => {
    let complexity = comp * 1;
    localStorage.setItem('lastComplexity', complexity);
    // console.log(complexity, amount);
    
    if (amount === 10) {
        if (complexity === 1) {
            updateBombsCount(10);
            updateCurrentMode('easy10');
        } else if (complexity === 2) {
            updateBombsCount(15);
            updateCurrentMode('normal10');
        } else if (complexity === 3) {
            updateBombsCount(20);
            updateCurrentMode('hard10');
        }
    } else if (amount === 17) {
        if (complexity === 1) {
            updateBombsCount(30);
            updateCurrentMode('easy17');
        } else if (complexity === 2) {
            updateBombsCount(60);
            updateCurrentMode('normal17');
        } else if (complexity === 3) {
            updateBombsCount(80);
            updateCurrentMode('hard17');
        }
    } else if (amount === 24) {
        if (complexity === 1) {
            updateBombsCount(99);
            updateCurrentMode('easy24');
        } else if (complexity === 2) {
            updateBombsCount(130);
            updateCurrentMode('normal24');
        } else if (complexity === 3) {
            updateBombsCount(160);
            updateCurrentMode('hard24');
        }
    }
}

updateComplexity(lastComplexity);
reDrawField(amount);

sizeMenuElement.value = amount;
complexityMenyElement.value = lastComplexity;

// sizesOptions.forEach((el) => {
//     if (el.target.value == amount) {
//         el.selected = true;
//     }
// });

// comsOptions.forEach((el) => {
//     if (el.target.value == lastComplexity) {
//         el.selected = true
//     }
// })

sizeMenuElement.addEventListener('change', (ev) => {
    let val = ev.target.value * 1;
    updateAmount(val);
    updateComplexity(lastComplexity);
    reDrawField(amount);
});

complexityMenyElement.addEventListener('change', (ev) => {
    let val = ev.target.value * 1;
    lastComplexity = val;
    updateComplexity(val);
    writeBestTimer();
});

const restartGame = () => {
    reDrawField(amount);
    timerElement.innerText = '00:00';
    mobileTimerTextElement.innerText = '00:00';
    writeBombsCount(bombsCount);
    markedCells.forEach((el) => {
        document.getElementById(el).innerHTML = '';
    });
    markedCells = [];
    gameOverBoxElement.style.display = 'none';
    gameVictoryElement.style.display = 'none';
}

retryButton.addEventListener('click', () => {
    restartGame();
});

victoryPlayButton.addEventListener('click', () => {
    restartGame();
});

let resizeTimeout;

window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(function() {
    let winSize = updateWinSize();
    field.style.maxWidth = winSize + "px";
    field.style.maxHeight = (winSize + 4) + "px";
    let newCellSize = winSize / amount;
    
    for (let i = 0; i < amount; i++) {
        for (let j = 0; j < amount; j++) {
            let currentCell = document.getElementById(`x${j}y${i}`);
            currentCell.style.width = `${newCellSize}px`;
            currentCell.style.height = `${newCellSize}px`;
            currentCell.style.fontSize = `${newCellSize / 1.3}px`;
        }
    }
  }, 400); 
});

let flagsEntire = document.getElementById('flags-entire');
let flagTimeout;

flagsEntire.addEventListener('touchstart', () => {
    flagTimeout = setTimeout(() => {
        isFlagPressed = true;
    }, 1000);
});

flagsEntire.addEventListener('touchend', () => {
    clearTimeout(flagTimeout);
});

flagsEntire.addEventListener('touchmove', () => {
    clearTimeout(flagTimeout);
});

let touchTimer1;
let touchTimer2;

mobileTimerElement.addEventListener('touchstart', () => {
    if (bombsArray.length > 0 && isFlagPressed) {
        touchTimer1 = setTimeout(() => {
            if (!isCheat1Active) {
                isCheat1Active = true;
                bombsArray.forEach((el) => {
                    document.getElementById(el).style.background = 'yellow';
                });
            } else {
                isCheat1Active = false;
                bombsArray.forEach((el) => {
                    document.getElementById(el).style.background = '#9ecea1';
                });
            }
        }, 1000);
    }
});

mobileTimerElement.addEventListener('touchend', () => {
    if (bombsArray.length > 0) {
        clearTimeout(touchTimer1);
    }
});

mobileTimerElement.addEventListener('touchmove', () => {
    if (bombsArray.length > 0) {
        clearTimeout(touchTimer1);
    }
});


mobileBestTimerElement.addEventListener('touchstart', () => {
    if (bombsArray.length > 0 && isFlagPressed) {    
        touchTimer2 = setTimeout(() => {
            bombsArray.forEach((el) => {
                markCell(el);
            })
            // if (!isCheat2Active) {
            //     isCheat2Active = true;
            //     bombsArray.forEach((el) => {
            //         markCell(el);
            //     });
            // } else {
            //     isCheat2Active = false;
            //     bombsArray.forEach((el) => {
            //         markCell(el);
            //     });
            // }
        }, 1000);
    }
});

mobileBestTimerElement.addEventListener('touchend', () => {
    if (bombsArray.length > 0) {
        clearTimeout(touchTimer2);
    }
});

mobileBestTimerElement.addEventListener('touchmove', () => {
    if (bombsArray.length > 0) {
        clearTimeout(touchTimer2);
    }
});


function listenForCheatCodes(callbackMap) {
  const cheatCodes = {
    'FILL3': ['KeyF', 'KeyI', 'KeyL', 'KeyL', 'Digit3'],
    'MARK3': ['KeyM', 'KeyA', 'KeyR', 'KeyK', 'Digit3']
  };

  const maxLength = Math.max(...Object.values(cheatCodes).map(c => c.length));
  let inputBuffer = [];

  document.addEventListener('keydown', (e) => {
    inputBuffer.push(e.code);

    if (inputBuffer.length > maxLength) {
      inputBuffer.shift();
    }

    for (const [name, codeSeq] of Object.entries(cheatCodes)) {
      if (arraysMatch(inputBuffer.slice(-codeSeq.length), codeSeq)) {
        inputBuffer = [];
        callbackMap[name]?.(); 
      }
    }
  });

  function arraysMatch(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
}

let isPKcheatActive = false;
listenForCheatCodes({
  FILL3: () => {
    if (!isPKcheatActive && bombsArray.length > 0) {
        bombsArray.forEach((el) => {
            document.getElementById(el).style.background = 'yellow';
        });
        isPKcheatActive = true;
    } else {
        bombsArray.forEach((el) => {
            document.getElementById(el).style.background = '#9ecea1';
        });
        isPKcheatActive = false;
    }
  },
  MARK3: () => {
    bombsArray.forEach((el) => {
        markCell(el);
    })
  }
});
