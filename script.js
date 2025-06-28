// 象棋游戏主类
class ChineseChess {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'red'; // 红方先行
        this.selectedPiece = null;
        this.selectedPosition = null;
        this.gameStatus = 'playing';
        this.moveHistory = [];
        this.possibleMoves = [];
        this.soundEnabled = true;
        this.aiMode = true; // 默认开启AI模式
        this.aiDifficulty = 'medium'; // 默认中等难度
        this.aiThinking = false; // AI是否正在思考

        // 深度学习AI相关
        this.deepLearningAI = null;
        this.useDeepLearning = false; // 是否使用深度学习
        this.learningEnabled = true; // 是否启用学习
        this.gameStartTime = Date.now();
        this.currentGameMoves = [];

        // 高级AI
        this.advancedAI = new AdvancedChessAI();
        this.useAdvancedAI = true;

        // AI对战训练相关
        this.isTraining = false; // 是否在训练模式
        this.trainingGames = 0; // 训练局数
        this.trainingSpeed = 'fast'; // 训练速度
        this.trainingInterval = null; // 训练定时器
        this.gameTimeoutId = null; // 游戏超时定时器

        // 防止无限对局的机制
        this.moveCount = 0; // 总移动次数
        this.maxMovesPerGame = 150; // 每局最大移动数（降低限制）
        this.positionHistory = []; // 局面历史
        this.maxRepeatedPositions = 3; // 最大重复局面次数
        this.noCaptureCount = 0; // 无吃子移动计数
        this.maxNoCaptureMove = 50; // 最大无吃子移动数（降低限制）

        this.initializeGame();
        this.initializeAudio();
        this.initializeAI();
        this.initializeOpeningBook();
        this.initializeDeepLearning();
    }

    // 初始化音频系统
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }

    // 播放音效
    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }
    
    // 初始化棋盘
    initializeBoard() {
        const board = Array(10).fill(null).map(() => Array(9).fill(null));

        // 初始化黑方棋子（上方）
        board[0] = [
            {piece: '车', color: 'black'}, {piece: '马', color: 'black'}, {piece: '象', color: 'black'},
            {piece: '士', color: 'black'}, {piece: '将', color: 'black'}, {piece: '士', color: 'black'},
            {piece: '象', color: 'black'}, {piece: '马', color: 'black'}, {piece: '车', color: 'black'}
        ];
        board[2] = [
            null, {piece: '炮', color: 'black'}, null, null, null, null, null, {piece: '炮', color: 'black'}, null
        ];
        board[3] = [
            {piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'},
            null, {piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'}
        ];

        // 初始化红方棋子（下方）
        board[6] = [
            {piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'},
            null, {piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'}
        ];
        board[7] = [
            null, {piece: '炮', color: 'red'}, null, null, null, null, null, {piece: '炮', color: 'red'}, null
        ];
        board[9] = [
            {piece: '车', color: 'red'}, {piece: '马', color: 'red'}, {piece: '相', color: 'red'},
            {piece: '仕', color: 'red'}, {piece: '帅', color: 'red'}, {piece: '仕', color: 'red'},
            {piece: '相', color: 'red'}, {piece: '马', color: 'red'}, {piece: '车', color: 'red'}
        ];

        return board;
    }
    
    // 初始化游戏界面
    initializeGame() {
        try {
            this.createBoard();
            this.updateGameInfo();
            this.bindEvents();

            // 隐藏loading提示
            if (typeof hideLoading === 'function') {
                hideLoading();
            }

            console.log('象棋游戏初始化完成');
        } catch (error) {
            console.error('游戏初始化失败:', error);
            const loading = document.getElementById('loading');
            if (loading) {
                loading.textContent = '游戏初始化失败: ' + error.message;
                loading.style.color = '#ff6b6b';
            }
        }
    }
    
    // 创建棋盘DOM
    createBoard() {
        const boardElement = document.getElementById('chessboard');
        boardElement.innerHTML = '';

        // 创建棋盘线条
        this.createBoardLines(boardElement);

        // 添加河界标记
        this.createRiverMarker(boardElement);

        // 添加九宫格对角线
        this.createPalaceLines(boardElement);

        // 添加兵线标记
        this.createSoldierMarks(boardElement);

        // 创建棋盘交叉点（棋子放置位置）
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                // 棋子放在线的交叉点上：40px边距 + col*65px间距
                cell.style.left = `${40 + col * 65}px`;
                cell.style.top = `${40 + row * 65}px`;
                cell.dataset.row = row;
                cell.dataset.col = col;

                // 添加棋子
                const pieceData = this.board[row][col];
                if (pieceData) {
                    const pieceElement = this.createPieceElement(pieceData, row, col);
                    cell.appendChild(pieceElement);
                }

                boardElement.appendChild(cell);
            }
        }
    }

    // 创建棋盘线条
    createBoardLines(boardElement) {
        const linesContainer = document.createElement('div');
        linesContainer.className = 'board-lines';

        // 创建横线（10条）
        for (let i = 0; i < 10; i++) {
            const line = document.createElement('div');
            line.className = 'board-line horizontal';
            line.style.top = `${i * 65}px`;
            line.style.left = '0px';
            line.style.width = '520px';
            line.style.height = '2px';
            linesContainer.appendChild(line);
        }

        // 创建竖线（9条）
        for (let i = 0; i < 9; i++) {
            const line = document.createElement('div');
            line.className = 'board-line vertical';
            line.style.left = `${i * 65}px`;
            line.style.width = '2px';

            // 边线贯通，中间线在河界处断开
            if (i === 0 || i === 8) {
                // 边线贯通整个棋盘
                line.style.height = '585px';
                line.style.top = '0px';
                linesContainer.appendChild(line);
            } else {
                // 中间的线在河界处分段
                // 上半部分：0-4行
                const topLine = document.createElement('div');
                topLine.className = 'board-line vertical';
                topLine.style.left = `${i * 65}px`;
                topLine.style.width = '2px';
                topLine.style.height = '260px'; // 4行 * 65px
                topLine.style.top = '0px';
                linesContainer.appendChild(topLine);

                // 下半部分：5-9行
                const bottomLine = document.createElement('div');
                bottomLine.className = 'board-line vertical';
                bottomLine.style.left = `${i * 65}px`;
                bottomLine.style.width = '2px';
                bottomLine.style.height = '325px'; // 5行 * 65px
                bottomLine.style.top = '260px';
                linesContainer.appendChild(bottomLine);
            }
        }

        boardElement.appendChild(linesContainer);
    }

    // 创建河界标记
    createRiverMarker(boardElement) {
        const river = document.createElement('div');
        river.className = 'river';

        const chuHe = document.createElement('span');
        chuHe.className = 'chu-he';
        chuHe.textContent = '楚河';

        const hanJie = document.createElement('span');
        hanJie.className = 'han-jie';
        hanJie.textContent = '汉界';

        river.appendChild(chuHe);
        river.appendChild(hanJie);
        boardElement.appendChild(river);
    }
    
    // 创建九宫格对角线
    createPalaceLines(boardElement) {
        // 九宫格位置：
        // 黑方九宫格：第0-2行，第3-5列
        // 红方九宫格：第7-9行，第3-5列

        // 黑方九宫格对角线（上方）
        const blackLines = [
            // 左上到右下的对角线：从(0,3)到(2,5)
            {
                x1: 40 + 3 * 65, y1: 40 + 0 * 65,
                x2: 40 + 5 * 65, y2: 40 + 2 * 65
            },
            // 右上到左下的对角线：从(0,5)到(2,3)
            {
                x1: 40 + 5 * 65, y1: 40 + 0 * 65,
                x2: 40 + 3 * 65, y2: 40 + 2 * 65
            }
        ];

        // 红方九宫格对角线（下方）
        const redLines = [
            // 左上到右下的对角线：从(7,3)到(9,5)
            {
                x1: 40 + 3 * 65, y1: 40 + 7 * 65,
                x2: 40 + 5 * 65, y2: 40 + 9 * 65
            },
            // 右上到左下的对角线：从(7,5)到(9,3)
            {
                x1: 40 + 5 * 65, y1: 40 + 7 * 65,
                x2: 40 + 3 * 65, y2: 40 + 9 * 65
            }
        ];

        [...blackLines, ...redLines].forEach(line => {
            const lineElement = document.createElement('div');
            lineElement.className = 'palace-line';
            const length = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
            const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI;

            lineElement.style.width = `${length}px`;
            lineElement.style.height = '2px';
            lineElement.style.left = `${line.x1}px`;
            lineElement.style.top = `${line.y1}px`;
            lineElement.style.transformOrigin = '0 0';
            lineElement.style.transform = `rotate(${angle}deg)`;

            boardElement.appendChild(lineElement);
        });

        // 添加兵线标记
        this.createSoldierMarks(boardElement);
    }

    // 创建兵线标记
    createSoldierMarks(boardElement) {
        // 兵线位置：黑方第3行(row=3)，红方第6行(row=6)
        const soldierPositions = [
            // 黑方兵线 - 第4行（索引3）
            {row: 3, cols: [1, 3, 5, 7]},
            // 红方兵线 - 第7行（索引6）
            {row: 6, cols: [1, 3, 5, 7]}
        ];

        soldierPositions.forEach(({row, cols}) => {
            cols.forEach(col => {
                const mark = document.createElement('div');
                mark.className = 'soldier-mark';
                mark.style.left = `${40 + col * 65}px`;
                mark.style.top = `${40 + row * 65}px`;
                boardElement.appendChild(mark);
            });
        });

        // 边线兵位标记
        const edgePositions = [
            // 黑方边兵
            {row: 3, col: 0}, {row: 3, col: 8},
            // 红方边兵
            {row: 6, col: 0}, {row: 6, col: 8}
        ];

        edgePositions.forEach(({row, col}) => {
            const mark = document.createElement('div');
            mark.className = 'soldier-mark';
            mark.style.left = `${40 + col * 65}px`;
            mark.style.top = `${40 + row * 65}px`;
            boardElement.appendChild(mark);
        });
    }
    
    // 创建棋子元素
    createPieceElement(pieceData, row, col) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        pieceElement.textContent = pieceData.piece;
        pieceElement.dataset.row = row;
        pieceElement.dataset.col = col;

        // 使用棋子数据中的颜色信息
        const color = pieceData.color;

        if (color === 'red') {
            pieceElement.classList.add('red');
            pieceElement.dataset.color = 'red';
        } else if (color === 'black') {
            pieceElement.classList.add('black');
            pieceElement.dataset.color = 'black';
        }

        return pieceElement;
    }

    // 获取棋子颜色（从棋盘数据中获取）
    getPieceColor(row, col) {
        const pieceData = this.board[row][col];
        return pieceData ? pieceData.color : null;
    }

    // 获取棋子名称
    getPieceName(row, col) {
        const pieceData = this.board[row][col];
        return pieceData ? pieceData.piece : null;
    }
    
    // 绑定事件
    bindEvents() {
        const boardElement = document.getElementById('chessboard');
        boardElement.addEventListener('click', (e) => this.handleCellClick(e));

        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoMove());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());

        // AI控制事件
        document.getElementById('ai-mode').addEventListener('change', (e) => {
            this.aiMode = e.target.value === 'ai';
            this.restartGame();
        });

        document.getElementById('ai-difficulty').addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 防止右键菜单
        boardElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // 处理键盘按键
    handleKeyPress(e) {
        if (this.gameStatus !== 'playing') return;

        switch (e.key) {
            case 'Escape':
                // 只有在非AI模式或轮到玩家时才能取消选择
                if (!this.aiMode || this.currentPlayer === 'red') {
                    this.clearSelection();
                }
                break;
            case 'u':
            case 'U':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.undoMove();
                }
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (confirm('确定要重新开始游戏吗？')) {
                        this.restartGame();
                    }
                }
                break;
            case 'h':
            case 'H':
                // 只有在非AI模式或轮到玩家时才能使用提示
                if (!this.aiMode || this.currentPlayer === 'red') {
                    this.showHint();
                }
                break;
        }
    }
    
    // 处理格子点击
    handleCellClick(e) {
        if (this.gameStatus !== 'playing') return;

        // 如果是AI模式且轮到黑方，或者AI正在思考，则不允许操作
        if ((this.aiMode && this.currentPlayer === 'black') || this.aiThinking) {
            return;
        }

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const piece = cell.querySelector('.piece');

        if (this.selectedPiece) {
            // 已选中棋子，尝试移动
            if (this.isValidMove(this.selectedPosition, { row, col })) {
                this.movePiece(this.selectedPosition, { row, col });
                this.clearSelection();
                this.switchPlayer();
                this.checkGameStatus();
            } else {
                // 选择新棋子或取消选择
                this.clearSelection();
                if (piece && piece.dataset.color === this.currentPlayer) {
                    this.selectPiece(piece, { row, col });
                }
            }
        } else {
            // 未选中棋子，选择棋子
            if (piece && piece.dataset.color === this.currentPlayer) {
                this.selectPiece(piece, { row, col });
            }
        }
    }
    
    // 选择棋子
    selectPiece(pieceElement, position) {
        // 验证棋子数据一致性
        const pieceData = this.board[position.row][position.col];
        if (!pieceData || pieceData.color !== this.currentPlayer) {
            console.warn('棋子数据不一致，重新同步显示');
            this.updateBoardDisplay();
            return;
        }

        this.selectedPiece = pieceElement;
        this.selectedPosition = position;
        pieceElement.classList.add('selected');

        // 显示可能的移动位置
        this.showPossibleMoves(position);
    }
    
    // 清除选择
    clearSelection() {
        if (this.selectedPiece) {
            this.selectedPiece.classList.remove('selected');
        }
        this.selectedPiece = null;
        this.selectedPosition = null;
        this.clearPossibleMoves();
    }
    
    // 显示可能的移动位置
    showPossibleMoves(position) {
        this.clearPossibleMoves();
        this.possibleMoves = this.getPossibleMoves(position);
        
        this.possibleMoves.forEach(move => {
            const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (cell) {
                cell.classList.add('possible-move');
            }
        });
    }
    
    // 清除可能移动位置的标记
    clearPossibleMoves() {
        document.querySelectorAll('.possible-move').forEach(cell => {
            cell.classList.remove('possible-move');
        });
        this.possibleMoves = [];
    }
    
    // 移动棋子
    movePiece(from, to) {
        const pieceData = this.board[from.row][from.col];
        const capturedPieceData = this.board[to.row][to.col];

        // 记录移动历史
        this.moveHistory.push({
            from: { ...from },
            to: { ...to },
            pieceData: pieceData,
            capturedPieceData: capturedPieceData,
            player: this.currentPlayer
        });

        // 更新棋盘数据
        this.board[to.row][to.col] = pieceData;
        this.board[from.row][from.col] = null;

        // 添加移动动画
        this.animateMove(from, to);

        // 更新DOM
        this.updateBoardDisplay();
        this.updateMoveHistory();

        // 显示移动提示
        this.showMoveHint(pieceData.piece, from, to);
    }

    // 移动动画
    animateMove(from, to) {
        const fromCell = document.querySelector(`[data-row="${from.row}"][data-col="${from.col}"]`);
        const toCell = document.querySelector(`[data-row="${to.row}"][data-col="${to.col}"]`);

        if (fromCell && toCell) {
            fromCell.classList.add('highlight');
            toCell.classList.add('highlight');

            setTimeout(() => {
                fromCell.classList.remove('highlight');
                toCell.classList.remove('highlight');
            }, 500);
        }
    }

    // 显示移动提示
    showMoveHint(piece, from, to) {
        const message = `${this.currentPlayer === 'red' ? '红方' : '黑方'} ${piece} 从 ${this.positionToString(from)} 移动到 ${this.positionToString(to)}`;
        this.showHintMessage(message);
    }

    // 显示提示消息
    showHintMessage(message) {
        // 移除现有的提示消息
        const existingHint = document.querySelector('.hint-message');
        if (existingHint) {
            existingHint.remove();
        }

        // 创建新的提示消息
        const hintElement = document.createElement('div');
        hintElement.className = 'hint-message';
        hintElement.textContent = message;
        document.body.appendChild(hintElement);

        // 显示动画
        setTimeout(() => {
            hintElement.classList.add('show');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            hintElement.classList.remove('show');
            setTimeout(() => {
                if (hintElement.parentNode) {
                    hintElement.parentNode.removeChild(hintElement);
                }
            }, 300);
        }, 3000);
    }
    
    // 更新棋盘显示
    updateBoardDisplay() {
        const boardElement = document.getElementById('chessboard');
        const cells = boardElement.querySelectorAll('.cell');

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const pieceData = this.board[row][col];

            // 清除现有棋子
            const existingPiece = cell.querySelector('.piece');
            if (existingPiece) {
                existingPiece.remove();
            }

            // 添加新棋子
            if (pieceData) {
                const pieceElement = this.createPieceElement(pieceData, row, col);
                cell.appendChild(pieceElement);
            }
        });
    }
    
    // 切换玩家 - 增加防错机制和AI对战支持
    switchPlayer() {
        // 防止在AI思考时切换
        if (this.aiThinking) {
            console.log('AI思考中，暂停切换玩家');
            return;
        }

        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.updateGameInfo();

        // 获取当前游戏模式
        const gameMode = document.getElementById('ai-mode').value;

        // 根据游戏模式决定AI行为
        if (gameMode === 'ai-vs-ai' && this.gameStatus === 'playing') {
            // AI对战模式：双方都是AI
            const delay = this.isTraining ? this.getTrainingDelay() : 800;
            const playerColor = this.currentPlayer;
            const playerEmoji = playerColor === 'red' ? '🔴' : '⚫';

            console.log(`${playerEmoji} AI对战模式：${playerColor}方AI准备移动`);

            if (!this.isTraining) {
                this.showHintMessage(`${playerEmoji} ${playerColor}方AI思考中...`);
            }

            setTimeout(() => {
                if (this.gameStatus === 'playing' && !this.aiThinking && this.currentPlayer === playerColor) {
                    console.log(`${playerEmoji} 执行${playerColor}方AI移动`);
                    this.makeAIMove(playerColor).catch(error => {
                        console.error(`${playerColor}方AI移动失败:`, error);
                        this.aiThinking = false;
                        this.showHintMessage(`❌ ${playerColor}方AI出现错误`);
                    });
                } else {
                    console.warn(`${playerColor}方AI移动条件不满足:`, {
                        gameStatus: this.gameStatus,
                        aiThinking: this.aiThinking,
                        currentPlayer: this.currentPlayer
                    });
                }
            }, delay);
        } else if (gameMode === 'ai' && this.currentPlayer === 'black' && this.gameStatus === 'playing') {
            // 人机对战模式：只有黑方是AI
            console.log('⚫ 人机对战：黑方AI准备移动');
            setTimeout(() => {
                if (this.gameStatus === 'playing' && this.currentPlayer === 'black' && !this.aiThinking) {
                    this.makeAIMove('black').catch(error => {
                        console.error('黑方AI移动失败:', error);
                        this.aiThinking = false;
                        this.showHintMessage('❌ 黑方AI出现错误');
                    });
                }
            }, 600);
        }
    }

    // 获取训练模式下的延迟时间
    getTrainingDelay() {
        switch (this.trainingSpeed) {
            case 'fast': return 50;
            case 'normal': return 200;
            case 'slow': return 500;
            default: return 50;
        }
    }

    // 检查是否应该触发AI移动
    shouldTriggerAI() {
        const gameMode = document.getElementById('ai-mode').value;

        if (gameMode === 'ai-vs-ai') {
            // AI对战模式：双方都是AI
            return true;
        } else if (gameMode === 'ai' && this.currentPlayer === 'black') {
            // 人机对战模式：只有黑方是AI
            return true;
        }

        return false;
    }

    // 启动AI对战模式
    startAIBattle() {
        console.log('🤖 启动AI对战模式...');

        // 设置为AI对战模式
        document.getElementById('ai-mode').value = 'ai-vs-ai';

        // 重新开始游戏，确保红方先行
        this.restartGame();

        // 确保当前玩家是红方
        this.currentPlayer = 'red';
        this.updateGameInfo();

        console.log('✅ AI对战准备完成，红方AI即将开始');
        this.showHintMessage('🔴 红方AI准备开始...');

        // 启动红方AI首步移动
        setTimeout(() => {
            if (this.gameStatus === 'playing' && this.currentPlayer === 'red') {
                console.log('🔴 红方AI开始首步移动');
                this.makeAIMove('red').catch(error => {
                    console.error('红方AI启动失败:', error);
                    this.showHintMessage('❌ 红方AI启动失败');
                });
            } else {
                console.error('AI对战启动条件不满足:', {
                    gameStatus: this.gameStatus,
                    currentPlayer: this.currentPlayer
                });
            }
        }, 1000);
    }
    
    // 更新游戏信息显示
    updateGameInfo() {
        const gameMode = document.getElementById('ai-mode').value;
        let currentPlayerText;

        if (gameMode === 'ai-vs-ai') {
            // AI对战模式
            currentPlayerText = this.currentPlayer === 'red' ? 'AI (红方)' : 'AI (黑方)';
        } else if (gameMode === 'ai') {
            // 人机对战模式
            currentPlayerText = this.currentPlayer === 'red' ? '红方' : 'AI (黑方)';
        } else {
            // 人人对战模式
            currentPlayerText = this.currentPlayer === 'red' ? '红方' : '黑方';
        }

        document.getElementById('current-player').textContent = currentPlayerText;

        let statusText = '游戏进行中';
        if (this.gameStatus === 'red-win') {
            statusText = gameMode === 'ai-vs-ai' ? 'AI (红方) 获胜' : '红方获胜';
        } else if (this.gameStatus === 'black-win') {
            statusText = gameMode === 'ai-vs-ai' ? 'AI (黑方) 获胜' :
                        (gameMode === 'ai' ? 'AI获胜' : '黑方获胜');
        } else if (this.gameStatus !== 'playing') {
            statusText = '游戏结束';
        } else if (this.aiThinking) {
            statusText = `${currentPlayerText} 思考中...`;
        }

        document.getElementById('game-status').textContent = statusText;
    }
    
    // 更新移动历史显示
    updateMoveHistory() {
        const historyElement = document.getElementById('move-history');
        const lastMove = this.moveHistory[this.moveHistory.length - 1];

        if (lastMove) {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';

            // 在AI模式下显示AI标识
            const playerText = lastMove.player === 'red' ? '红' :
                (this.aiMode && lastMove.player === 'black' ? 'AI' : '黑');

            const captureText = lastMove.capturedPieceData ?
                ` 吃${lastMove.capturedPieceData.piece}` : '';

            moveItem.textContent = `${this.moveHistory.length}. ${playerText}: ${lastMove.pieceData.piece} ${this.positionToString(lastMove.from)} → ${this.positionToString(lastMove.to)}${captureText}`;

            historyElement.appendChild(moveItem);
            historyElement.scrollTop = historyElement.scrollHeight;
        }
    }
    
    // 位置转换为字符串
    positionToString(pos) {
        const cols = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        return `${cols[pos.col]}${pos.row + 1}`;
    }
    
    // 重新开始游戏
    restartGame() {
        // 清理所有状态
        this.board = this.initializeBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.selectedPosition = null;
        this.gameStatus = 'playing';
        this.moveHistory = [];
        this.possibleMoves = [];
        this.aiThinking = false;
        this.searchStartTime = null;

        // 重置防止无限对局的计数器
        this.moveCount = 0;
        this.positionHistory = [];
        this.noCaptureCount = 0;

        // 更新AI设置
        this.aiMode = document.getElementById('ai-mode').value === 'ai';
        this.aiDifficulty = document.getElementById('ai-difficulty').value;

        // 清理UI状态
        document.getElementById('move-history').innerHTML = '';
        this.clearSelection();
        this.clearPossibleMoves();

        // 移除任何现有的提示消息
        const existingHints = document.querySelectorAll('.hint-message');
        existingHints.forEach(hint => hint.remove());

        // 移除任何游戏结束模态框
        const existingModals = document.querySelectorAll('.game-over-modal');
        existingModals.forEach(modal => modal.remove());

        this.createBoard();
        this.updateGameInfo();

        this.showHintMessage('游戏重新开始！红方先行');
    }

    // 紧急恢复游戏状态
    emergencyRecover() {
        console.log('执行紧急恢复...');
        this.aiThinking = false;
        this.gameStatus = 'playing';
        this.currentPlayer = 'red';
        this.updateGameInfo();
        this.showHintMessage('已执行紧急恢复，游戏继续');
    }
    
    // 悔棋
    undoMove() {
        if (this.moveHistory.length === 0) return;

        // 如果AI正在思考，不允许悔棋
        if (this.aiThinking) {
            this.showHintMessage('AI思考中，无法悔棋');
            return;
        }

        // 在AI模式下，需要悔两步（玩家的一步和AI的一步）
        if (this.aiMode && this.moveHistory.length >= 2 && this.currentPlayer === 'red') {
            // 悔销AI的移动
            const aiMove = this.moveHistory.pop();
            this.board[aiMove.from.row][aiMove.from.col] = aiMove.pieceData;
            this.board[aiMove.to.row][aiMove.to.col] = aiMove.capturedPieceData;

            // 移除AI移动的历史记录显示
            const historyElement = document.getElementById('move-history');
            if (historyElement.lastChild) {
                historyElement.removeChild(historyElement.lastChild);
            }
        }

        // 悔销玩家的移动
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory.pop();

            // 恢复棋盘状态
            this.board[lastMove.from.row][lastMove.from.col] = lastMove.pieceData;
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPieceData;

            // 切换回上一个玩家
            this.currentPlayer = lastMove.player;

            // 移除历史记录显示
            const historyElement = document.getElementById('move-history');
            if (historyElement.lastChild) {
                historyElement.removeChild(historyElement.lastChild);
            }
        }

        // 更新显示
        this.updateBoardDisplay();
        this.updateGameInfo();
        this.clearSelection();
    }
    
    // 显示提示
    showHint() {
        if (this.gameStatus !== 'playing') {
            this.showHintMessage('游戏已结束，无法提供提示');
            return;
        }

        if (this.aiMode && this.currentPlayer === 'black') {
            this.showHintMessage('AI回合，无需提示');
            return;
        }

        if (this.aiThinking) {
            this.showHintMessage('AI思考中，请稍候');
            return;
        }

        if (!this.selectedPiece) {
            // 如果没有选择棋子，提供一般性提示
            const playerMoves = this.getAllPossibleMoves(this.currentPlayer);
            if (playerMoves.length === 0) {
                this.showHintMessage('无可移动的棋子');
            } else {
                this.showHintMessage(`请选择一个棋子，共有 ${playerMoves.length} 种可能的移动`);
            }
            return;
        }

        const moves = this.getPossibleMoves(this.selectedPosition);
        if (moves.length === 0) {
            this.showHintMessage('当前棋子无法移动，请选择其他棋子');
        } else {
            this.showHintMessage(`当前棋子有 ${moves.length} 个可移动位置`);
            // 高亮显示可移动位置
            this.showPossibleMoves(this.selectedPosition);
        }
    }
    
    // 检查游戏状态
    checkGameStatus() {
        // 如果游戏已经结束，不再检查
        if (this.gameStatus !== 'playing') return;

        // 检查防止无限对局的条件
        if (this.checkDrawConditions()) {
            return; // 如果判定为和棋，直接返回
        }

        // 检查将/帅是否被吃
        let redKingExists = false;
        let blackKingExists = false;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const pieceData = this.board[row][col];
                if (pieceData && pieceData.piece === '帅') redKingExists = true;
                if (pieceData && pieceData.piece === '将') blackKingExists = true;
            }
        }

        if (!redKingExists) {
            this.gameStatus = 'black-win';
            const winnerText = this.aiMode ? 'AI获胜！红方帅被吃' : '黑方获胜！红方帅被吃';
            this.handleGameEnd(winnerText);
            return;
        } else if (!blackKingExists) {
            this.gameStatus = 'red-win';
            this.handleGameEnd('红方获胜！黑方将被吃');
            return;
        }

        // 检查当前玩家是否被将军
        const currentPlayerInCheck = this.isInCheck(this.currentPlayer);

        // 检查当前玩家是否有合法移动
        const hasLegalMoves = this.hasLegalMoves(this.currentPlayer);

        if (currentPlayerInCheck && !hasLegalMoves) {
            // 将死
            this.gameStatus = this.currentPlayer === 'red' ? 'black-win' : 'red-win';
            const winner = this.currentPlayer === 'red' ?
                (this.aiMode ? 'AI' : '黑方') : '红方';
            const loser = this.currentPlayer === 'red' ? '红方' :
                (this.aiMode ? 'AI' : '黑方');
            this.handleGameEnd(`${winner}获胜！${loser}被将死`);
        } else if (!hasLegalMoves) {
            // 困毙（无子可动但未被将军）
            this.gameStatus = this.currentPlayer === 'red' ? 'black-win' : 'red-win';
            const winner = this.currentPlayer === 'red' ?
                (this.aiMode ? 'AI' : '黑方') : '红方';
            const loser = this.currentPlayer === 'red' ? '红方' :
                (this.aiMode ? 'AI' : '黑方');
            this.handleGameEnd(`${winner}获胜！${loser}被困毙`);
        } else if (currentPlayerInCheck) {
            // 被将军但有应将方法
            const playerText = this.currentPlayer === 'red' ? '红方' :
                (this.aiMode ? 'AI' : '黑方');
            this.showHintMessage(`${playerText}被将军！必须应将`);
        }

        this.updateGameInfo();
    }

    // 检查和棋条件（防止无限对局）
    checkDrawConditions() {
        console.log(`🔍 检查和棋条件: 移动数=${this.moveCount}/${this.maxMovesPerGame}, 无吃子=${this.noCaptureCount}/${this.maxNoCaptureMove}`);

        // 1. 检查移动次数是否超过限制
        if (this.moveCount >= this.maxMovesPerGame) {
            console.log(`⏰ 达到最大移动数限制: ${this.moveCount}/${this.maxMovesPerGame}`);
            this.gameStatus = 'draw';
            this.handleGameEnd(`和棋！超过${this.maxMovesPerGame}步移动限制`);
            return true;
        }

        // 2. 检查无吃子移动次数
        if (this.noCaptureCount >= this.maxNoCaptureMove) {
            console.log(`⏰ 达到最大无吃子移动限制: ${this.noCaptureCount}/${this.maxNoCaptureMove}`);
            this.gameStatus = 'draw';
            this.handleGameEnd(`和棋！连续${this.maxNoCaptureMove}步无吃子`);
            return true;
        }

        // 3. 检查重复局面
        const currentPosition = this.getBoardHash();
        const repetitionCount = this.positionHistory.filter(pos => pos === currentPosition).length;

        console.log(`🔄 重复局面检查: 当前重复次数=${repetitionCount}/${this.maxRepeatedPositions}`);

        if (repetitionCount >= this.maxRepeatedPositions) {
            console.log(`⏰ 达到最大重复局面限制: ${repetitionCount}/${this.maxRepeatedPositions}`);
            this.gameStatus = 'draw';
            this.handleGameEnd('和棋！重复局面');
            return true;
        }

        return false;
    }

    // 获取棋盘哈希值（用于检测重复局面）
    getBoardHash() {
        let hash = '';
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    hash += `${piece.color}${piece.piece}${row}${col}`;
                } else {
                    hash += 'empty';
                }
            }
        }
        hash += this.currentPlayer; // 包含当前玩家信息
        return hash;
    }



    // 处理游戏结束
    handleGameEnd(message) {
        // 清除游戏超时定时器
        if (this.gameTimeoutId) {
            clearTimeout(this.gameTimeoutId);
            this.gameTimeoutId = null;
        }

        if (this.isTraining) {
            // 训练模式：不显示模态框，直接触发学习和下一局
            console.log(`🎯 训练局结束: ${message}`);
            this.triggerLearning();
        } else {
            // 正常模式：显示游戏结束模态框
            this.showGameOverModal(message);
            this.triggerLearning();
        }
    }

    // 触发学习过程
    async triggerLearning() {
        try {
            console.log('🎯 游戏结束，开始学习过程...');

            if (this.learningEnabled && this.deepLearningAI) {
                // 显示游戏结果
                const winner = this.gameStatus === 'red-win' ? '红方' :
                              this.gameStatus === 'black-win' ? '黑方' :
                              this.gameStatus === 'draw' ? '平局' : '未知';
                const resultText = this.gameStatus === 'draw' ? '平局' : `${winner}获胜`;
                console.log(`🏆 游戏结果: ${resultText}`);

                // 为整局游戏的移动分配最终奖励
                this.assignFinalRewards();

                // 获取学习前的统计
                const statsBefore = this.deepLearningAI.getLearningStats();
                console.log(`📚 学习前经验数量: ${statsBefore.experienceCount}`);

                // 触发学习
                console.log('🧠 开始神经网络学习...');
                await this.deepLearningAI.learnFromExperience();

                // 获取学习后的统计
                const statsAfter = this.deepLearningAI.getLearningStats();
                console.log(`📈 学习后经验数量: ${statsAfter.experienceCount}`);

                // 更新训练统计显示
                this.updateTrainingStats();

                if (statsAfter.experienceCount > 0 && !this.isTraining) {
                    this.showHintMessage(`🧠 AI学习完成！经验库: ${statsAfter.experienceCount} 个样本`);
                }
            }

            // 如果是训练模式，继续下一局
            if (this.isTraining) {
                this.onTrainingGameEnd();
            }

            // 重置当前游戏数据
            this.currentGameMoves = [];
            this.gameStartTime = Date.now();

        } catch (error) {
            console.error('学习过程出错:', error);
        }
    }

    // 检查玩家是否有合法移动
    hasLegalMoves(playerColor) {
        for (let fromRow = 0; fromRow < 10; fromRow++) {
            for (let fromCol = 0; fromCol < 9; fromCol++) {
                const pieceData = this.board[fromRow][fromCol];
                if (pieceData && pieceData.color === playerColor) {
                    // 这是己方棋子，检查是否有合法移动
                    for (let toRow = 0; toRow < 10; toRow++) {
                        for (let toCol = 0; toCol < 9; toCol++) {
                            if (this.isValidMove({ row: fromRow, col: fromCol }, { row: toRow, col: toCol })) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    // 显示游戏结束模态框
    showGameOverModal(message) {
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.innerHTML = `
            <div class="game-over-content">
                <h2>游戏结束</h2>
                <p>${message}</p>
                <button onclick="this.closest('.game-over-modal').remove(); window.chessGame.restartGame();">再来一局</button>
            </div>
        `;
        document.body.appendChild(modal);

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 验证移动是否合法
    isValidMove(from, to) {
        if (!from || !to) return false;
        if (from.row === to.row && from.col === to.col) return false;

        const pieceData = this.board[from.row][from.col];
        const targetPieceData = this.board[to.row][to.col];

        if (!pieceData) return false; // 起始位置没有棋子

        // 不能吃自己的棋子
        if (targetPieceData && pieceData.color === targetPieceData.color) {
            return false;
        }

        // 检查边界
        if (to.row < 0 || to.row >= 10 || to.col < 0 || to.col >= 9) {
            return false;
        }

        // 根据棋子类型检查移动规则
        if (!this.isValidPieceMove(pieceData.piece, from, to)) {
            return false;
        }

        // 检查移动后是否会导致己方将军（不能送将）
        if (this.wouldBeInCheckAfterMove(from, to)) {
            return false;
        }

        return true;
    }

    // 检查移动后是否会导致己方将军
    wouldBeInCheckAfterMove(from, to) {
        // 临时执行移动
        const originalPieceData = this.board[to.row][to.col];
        const movingPieceData = this.board[from.row][from.col];

        this.board[to.row][to.col] = movingPieceData;
        this.board[from.row][from.col] = null;

        // 检查己方是否被将军
        const playerColor = movingPieceData.color;
        const inCheck = this.isInCheck(playerColor);

        // 恢复棋盘状态
        this.board[from.row][from.col] = movingPieceData;
        this.board[to.row][to.col] = originalPieceData;

        return inCheck;
    }

    // 检查指定颜色的玩家是否被将军
    isInCheck(playerColor) {
        // 找到己方的将/帅
        let kingPosition = null;
        const kingPiece = playerColor === 'red' ? '帅' : '将';

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const pieceData = this.board[row][col];
                if (pieceData && pieceData.piece === kingPiece) {
                    kingPosition = { row, col };
                    break;
                }
            }
            if (kingPosition) break;
        }

        if (!kingPosition) return false; // 没有找到将/帅

        // 检查是否有敌方棋子能攻击到将/帅
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const pieceData = this.board[row][col];
                if (pieceData && pieceData.color !== playerColor) {
                    // 这是敌方棋子，检查是否能攻击到将/帅
                    if (this.canAttack({ row, col }, kingPosition)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // 检查一个棋子是否能攻击到目标位置（不考虑将军规则）
    canAttack(from, to) {
        const pieceData = this.board[from.row][from.col];
        if (!pieceData) return false;

        // 使用基本的移动规则检查，但不检查将军
        return this.isValidPieceMove(pieceData.piece, from, to);
    }



    // 检查特定棋子的移动规则
    isValidPieceMove(piece, from, to) {
        switch (piece) {
            case '帅':
            case '将':
                return this.isValidKingMove(from, to);
            case '仕':
            case '士':
                return this.isValidAdvisorMove(from, to);
            case '相':
            case '象':
                return this.isValidElephantMove(from, to);
            case '车':
                return this.isValidRookMove(from, to);
            case '马':
                return this.isValidKnightMove(from, to);
            case '炮':
                return this.isValidCannonMove(from, to);
            case '兵':
            case '卒':
                return this.isValidPawnMove(piece, from, to);
            default:
                return false;
        }
    }

    // 将/帅的移动规则
    isValidKingMove(from, to) {
        // 只能在九宫格内移动
        const isInPalace = (row, col) => {
            return col >= 3 && col <= 5 &&
                   ((row >= 0 && row <= 2) || (row >= 7 && row <= 9));
        };

        if (!isInPalace(to.row, to.col)) return false;

        // 只能移动一格，且只能横向或纵向
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);

        if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
            return false;
        }

        // 检查将帅照面规则
        if (this.wouldKingsFaceEachOther(from, to)) {
            return false;
        }

        return true;
    }

    // 检查将帅是否会照面
    wouldKingsFaceEachOther(from, to) {
        // 临时移动棋子
        const originalPieceData = this.board[to.row][to.col];
        const movingPieceData = this.board[from.row][from.col];

        this.board[to.row][to.col] = movingPieceData;
        this.board[from.row][from.col] = null;

        // 找到两个将/帅的位置
        let redKingPos = null;
        let blackKingPos = null;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const pieceData = this.board[row][col];
                if (pieceData && pieceData.piece === '帅') {
                    redKingPos = { row, col };
                } else if (pieceData && pieceData.piece === '将') {
                    blackKingPos = { row, col };
                }
            }
        }

        let faceEachOther = false;

        // 检查是否在同一列且中间无子
        if (redKingPos && blackKingPos && redKingPos.col === blackKingPos.col) {
            const minRow = Math.min(redKingPos.row, blackKingPos.row);
            const maxRow = Math.max(redKingPos.row, blackKingPos.row);

            let hasObstacle = false;
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][redKingPos.col] !== null) {
                    hasObstacle = true;
                    break;
                }
            }

            if (!hasObstacle) {
                faceEachOther = true;
            }
        }

        // 恢复棋盘状态
        this.board[from.row][from.col] = movingPieceData;
        this.board[to.row][to.col] = originalPieceData;

        return faceEachOther;
    }

    // 仕/士的移动规则
    isValidAdvisorMove(from, to) {
        // 只能在九宫格内移动
        const isInPalace = (row, col) => {
            return col >= 3 && col <= 5 &&
                   ((row >= 0 && row <= 2) || (row >= 7 && row <= 9));
        };

        if (!isInPalace(to.row, to.col)) return false;

        // 只能斜向移动一格
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);

        return rowDiff === 1 && colDiff === 1;
    }

    // 相/象的移动规则
    isValidElephantMove(from, to) {
        // 不能过河
        const pieceData = this.board[from.row][from.col];
        const isRed = pieceData.color === 'red';

        if (isRed && to.row < 5) return false; // 红方不能过河
        if (!isRed && to.row > 4) return false; // 黑方不能过河

        // 只能斜向移动两格
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;

        if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return false;

        // 检查象眼是否被堵
        const eyeRow = from.row + rowDiff / 2;
        const eyeCol = from.col + colDiff / 2;

        return this.board[eyeRow][eyeCol] === null;
    }

    // 车的移动规则
    isValidRookMove(from, to) {
        // 只能横向或纵向移动
        if (from.row !== to.row && from.col !== to.col) return false;

        // 检查路径是否有障碍物
        return this.isPathClear(from, to);
    }

    // 马的移动规则
    isValidKnightMove(from, to) {
        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);

        // 马走日字
        if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
            return false;
        }

        // 检查马腿是否被堵
        let legRow, legCol;
        if (rowDiff === 2) {
            legRow = from.row + (to.row - from.row) / 2;
            legCol = from.col;
        } else {
            legRow = from.row;
            legCol = from.col + (to.col - from.col) / 2;
        }

        return this.board[legRow][legCol] === null;
    }

    // 炮的移动规则
    isValidCannonMove(from, to) {
        // 只能横向或纵向移动
        if (from.row !== to.row && from.col !== to.col) return false;

        const targetPiece = this.board[to.row][to.col];
        const obstacleCount = this.countObstacles(from, to);

        if (targetPiece) {
            // 吃子时必须隔一个棋子
            return obstacleCount === 1;
        } else {
            // 移动时路径必须无障碍
            return obstacleCount === 0;
        }
    }

    // 兵/卒的移动规则
    isValidPawnMove(piece, from, to) {
        const pieceData = this.board[from.row][from.col];
        const isRed = pieceData.color === 'red';
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);

        // 只能移动一格
        if (Math.abs(rowDiff) + colDiff !== 1) return false;

        if (isRed) {
            // 红兵：向上移动（行号减小）
            if (from.row > 4) {
                // 未过河（在己方半场，第5-9行），只能向前（向上）
                return rowDiff === -1 && colDiff === 0;
            } else {
                // 已过河或在河界上（第0-4行），可以向前或左右，但不能后退
                return (rowDiff === -1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
            }
        } else {
            // 黑卒：向下移动（行号增大）
            if (from.row < 5) {
                // 未过河（在己方半场，第0-4行），只能向前（向下）
                return rowDiff === 1 && colDiff === 0;
            } else {
                // 已过河或在河界上（第5-9行），可以向前或左右，但不能后退
                return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
            }
        }
    }

    // 检查路径是否畅通
    isPathClear(from, to) {
        const rowStep = from.row === to.row ? 0 : (to.row - from.row) / Math.abs(to.row - from.row);
        const colStep = from.col === to.col ? 0 : (to.col - from.col) / Math.abs(to.col - from.col);

        let currentRow = from.row + rowStep;
        let currentCol = from.col + colStep;

        while (currentRow !== to.row || currentCol !== to.col) {
            if (this.board[currentRow][currentCol] !== null) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    // 计算路径上的障碍物数量
    countObstacles(from, to) {
        const rowStep = from.row === to.row ? 0 : (to.row - from.row) / Math.abs(to.row - from.row);
        const colStep = from.col === to.col ? 0 : (to.col - from.col) / Math.abs(to.col - from.col);

        let count = 0;
        let currentRow = from.row + rowStep;
        let currentCol = from.col + colStep;

        while (currentRow !== to.row || currentCol !== to.col) {
            if (this.board[currentRow][currentCol] !== null) {
                count++;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }

        return count;
    }

    // 获取可能的移动位置
    getPossibleMoves(position) {
        const moves = [];
        const pieceData = this.board[position.row][position.col];

        if (!pieceData) return moves;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.isValidMove(position, { row, col })) {
                    moves.push({ row, col });
                }
            }
        }

        return moves;
    }

    // 初始化AI系统
    initializeAI() {
        // 棋子价值表
        this.pieceValues = {
            '帅': 10000, '将': 10000,
            '车': 900,
            '马': 450,
            '炮': 450,
            '相': 200, '象': 200,
            '仕': 200, '士': 200,
            '兵': 100, '卒': 100
        };

        // 位置价值表 - 兵/卒
        this.pawnPositionValues = {
            red: [
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [60, 60, 60, 60, 60, 60, 60, 60, 60],
                [70, 90, 70, 60, 60, 60, 70, 90, 70],
                [70, 90, 70, 60, 60, 60, 70, 90, 70],
                [70, 90, 70, 60, 60, 60, 70, 90, 70]
            ],
            black: [
                [70, 90, 70, 60, 60, 60, 70, 90, 70],
                [70, 90, 70, 60, 60, 60, 70, 90, 70],
                [70, 90, 70, 60, 60, 60, 70, 90, 70],
                [60, 60, 60, 60, 60, 60, 60, 60, 60],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ]
        };

        // 马的位置价值表
        this.knightPositionValues = [
            [90, 90, 90, 96, 90, 96, 90, 90, 90],
            [90, 96,103, 97, 94, 97,103, 96, 90],
            [92, 98, 96, 92, 98, 92, 96, 98, 92],
            [93,108,100,107,100,107,100,108, 93],
            [90,100, 99,103,104,103, 99,100, 90],
            [90,100, 99,103,104,103, 99,100, 90],
            [93,108,100,107,100,107,100,108, 93],
            [92, 98, 96, 92, 98, 92, 96, 98, 92],
            [90, 96,103, 97, 94, 97,103, 96, 90],
            [90, 90, 90, 96, 90, 96, 90, 90, 90]
        ];

        // 车的位置价值表
        this.rookPositionValues = [
            [206,208,207,213,214,213,207,208,206],
            [206,212,209,216,233,216,209,212,206],
            [206,208,207,214,216,214,207,208,206],
            [206,213,213,216,216,216,213,213,206],
            [208,211,211,214,215,214,211,211,208],
            [208,212,212,214,215,214,212,212,208],
            [204,209,204,212,214,212,204,209,204],
            [198,208,204,212,212,212,204,208,198],
            [200,208,206,212,200,212,206,208,200],
            [194,206,204,212,200,212,204,206,194]
        ];
    }

    // 初始化开局库 - 增强版
    initializeOpeningBook() {
        this.openingBook = [
            // 红方开局 - 中炮局
            { moves: 0, from: {row: 7, col: 1}, to: {row: 7, col: 4}, name: "炮二平五" },
            { moves: 0, from: {row: 7, col: 7}, to: {row: 7, col: 4}, name: "炮八平五" },

            // 红方开局 - 飞相局
            { moves: 0, from: {row: 9, col: 2}, to: {row: 7, col: 4}, name: "相三进五" },
            { moves: 0, from: {row: 9, col: 6}, to: {row: 7, col: 4}, name: "相七进五" },

            // 红方开局 - 起马局
            { moves: 0, from: {row: 9, col: 1}, to: {row: 7, col: 2}, name: "马二进三" },
            { moves: 0, from: {row: 9, col: 7}, to: {row: 7, col: 6}, name: "马八进七" },

            // 红方开局 - 进兵局
            { moves: 0, from: {row: 6, col: 2}, to: {row: 5, col: 2}, name: "兵三进一" },
            { moves: 0, from: {row: 6, col: 6}, to: {row: 5, col: 6}, name: "兵七进一" },

            // 黑方应对 - 屏风马
            { moves: 1, from: {row: 0, col: 1}, to: {row: 2, col: 2}, name: "马2进3" },
            { moves: 1, from: {row: 0, col: 7}, to: {row: 2, col: 6}, name: "马8进7" },

            // 黑方应对 - 反宫马
            { moves: 1, from: {row: 0, col: 1}, to: {row: 2, col: 0}, name: "马2进1" },
            { moves: 1, from: {row: 0, col: 7}, to: {row: 2, col: 8}, name: "马8进9" },

            // 黑方应对 - 中炮对中炮
            { moves: 1, from: {row: 2, col: 1}, to: {row: 2, col: 4}, name: "炮2平5" },
            { moves: 1, from: {row: 2, col: 7}, to: {row: 2, col: 4}, name: "炮8平5" },

            // 黑方应对 - 卒底炮
            { moves: 1, from: {row: 2, col: 1}, to: {row: 5, col: 1}, name: "炮2进3" },
            { moves: 1, from: {row: 2, col: 7}, to: {row: 5, col: 7}, name: "炮8进3" },

            // 第二步开局
            { moves: 2, from: {row: 9, col: 1}, to: {row: 7, col: 2}, name: "马二进三" },
            { moves: 2, from: {row: 9, col: 7}, to: {row: 7, col: 6}, name: "马八进七" },
            { moves: 2, from: {row: 9, col: 0}, to: {row: 8, col: 0}, name: "车一进一" },
            { moves: 2, from: {row: 9, col: 8}, to: {row: 8, col: 8}, name: "车九进一" },

            // 黑方第二步
            { moves: 3, from: {row: 0, col: 0}, to: {row: 1, col: 0}, name: "车1进1" },
            { moves: 3, from: {row: 0, col: 8}, to: {row: 1, col: 8}, name: "车9进1" },
            { moves: 3, from: {row: 0, col: 2}, to: {row: 2, col: 4}, name: "象3进5" },
            { moves: 3, from: {row: 0, col: 6}, to: {row: 2, col: 4}, name: "象7进5" },
        ];
    }

    // 初始化深度学习AI
    async initializeDeepLearning() {
        try {
            console.log('初始化深度学习AI系统...');

            // 检查TensorFlow.js是否可用
            if (typeof tf === 'undefined') {
                console.warn('TensorFlow.js未加载，深度学习功能不可用');
                return;
            }

            // 创建深度学习AI实例
            this.deepLearningAI = new DeepLearningChessAI();

            // 等待AI初始化完成
            let attempts = 0;
            while (!this.deepLearningAI.isInitialized && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!this.deepLearningAI.isInitialized) {
                console.warn('深度学习AI初始化超时，但继续使用');
            }

            // 检查是否有训练进度
            const progress = this.deepLearningAI.getTrainingProgress();
            if (progress.hasTrainedModel) {
                console.log(`🎓 发现已训练的AI模型！经验: ${progress.experienceCount}个`);
                this.showHintMessage(`🎓 AI已加载训练成果！经验: ${progress.experienceCount}个`);
                // 如果有训练数据，自动启用深度学习
                this.useDeepLearning = true;
            } else {
                console.log('深度学习AI系统初始化完成（新模型）');

                // 加载预训练数据
                if (window.pretrainedData) {
                    window.pretrainedData.preloadTrainingData(this.deepLearningAI);
                    this.showHintMessage('🎓 AI已加载预训练数据，具备基础象棋知识！');
                } else {
                    this.showHintMessage('🧠 深度学习AI已启用，AI将从每局游戏中学习！');
                }

                // 新模型也启用深度学习，但权重较低
                this.useDeepLearning = true;
            }

            // 更新训练统计显示
            this.updateTrainingStats();

        } catch (error) {
            console.error('深度学习AI初始化失败:', error);
            this.deepLearningAI = null;
        }
    }

    // 切换深度学习模式
    toggleDeepLearning() {
        if (!this.deepLearningAI) {
            this.showHintMessage('深度学习AI未初始化');
            return;
        }

        this.useDeepLearning = !this.useDeepLearning;
        const status = this.useDeepLearning ? '启用' : '禁用';
        this.showHintMessage(`深度学习模式已${status}`);
        console.log(`深度学习模式: ${status}`);
    }

    // 切换学习功能
    toggleLearning() {
        this.learningEnabled = !this.learningEnabled;
        const status = this.learningEnabled ? '启用' : '禁用';
        this.showHintMessage(`AI学习功能已${status}`);
        console.log(`AI学习功能: ${status}`);
    }

    // 检查是否有开局库中的走法
    getOpeningMove() {
        const moveCount = this.moveHistory.length;
        if (moveCount >= 8) return null; // 只在前8步使用开局库

        const availableMoves = this.openingBook.filter(opening =>
            opening.moves === moveCount &&
            this.isValidMove(opening.from, opening.to)
        );

        if (availableMoves.length > 0) {
            // 随机选择一个开局走法
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            return availableMoves[randomIndex];
        }

        return null;
    }

    // 评估棋局分数 - 增强版
    evaluatePosition() {
        let score = 0;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const pieceData = this.board[row][col];
                if (!pieceData) continue;

                const piece = pieceData.piece;
                const color = pieceData.color;
                const isRed = color === 'red';

                // 基础子力价值
                let pieceValue = this.pieceValues[piece] || 0;

                // 位置价值
                let positionValue = 0;
                if (piece === '兵' || piece === '卒') {
                    positionValue = this.pawnPositionValues[color][row][col];
                } else if (piece === '马') {
                    positionValue = this.knightPositionValues[row][col];
                } else if (piece === '车') {
                    positionValue = this.rookPositionValues[row][col];
                }

                // 棋子保护和攻击价值
                const protectionValue = this.evaluatePieceProtection(row, col, color);
                const attackValue = this.evaluatePieceAttacks(row, col, color);

                const totalValue = pieceValue + positionValue + protectionValue + attackValue;
                score += isRed ? totalValue : -totalValue;
            }
        }

        // 将军惩罚/奖励
        if (this.isInCheck('red')) {
            score -= 800; // 增加惩罚
        }
        if (this.isInCheck('black')) {
            score += 800; // 增加奖励
        }

        // 控制中心奖励
        score += this.evaluateCenterControl();

        // 棋子协调性评估
        score += this.evaluatePieceCoordination();

        // 王的安全性评估
        score += this.evaluateKingSafety();

        return score;
    }

    // 评估棋子保护
    evaluatePieceProtection(row, col, color) {
        let protection = 0;
        const directions = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
                const protector = this.board[newRow][newCol];
                if (protector && protector.color === color) {
                    protection += 10; // 被己方棋子保护
                }
            }
        }

        return protection;
    }

    // 评估棋子攻击力
    evaluatePieceAttacks(row, col, color) {
        let attacks = 0;
        const possibleMoves = this.getPossibleMoves({row, col});

        for (const move of possibleMoves) {
            const target = this.board[move.row][move.col];
            if (target && target.color !== color) {
                attacks += this.pieceValues[target.piece] * 0.1; // 攻击价值
            }
        }

        return attacks;
    }

    // 评估中心控制
    evaluateCenterControl() {
        let score = 0;
        const centerSquares = [
            [4, 3], [4, 4], [4, 5],
            [5, 3], [5, 4], [5, 5]
        ];

        for (const [row, col] of centerSquares) {
            const piece = this.board[row][col];
            if (piece) {
                const value = piece.color === 'red' ? 20 : -20;
                score += value;
            }
        }

        return score;
    }

    // 评估棋子协调性
    evaluatePieceCoordination() {
        let score = 0;

        // 马炮配合
        score += this.evaluateHorseCannonCoordination();

        // 车马配合
        score += this.evaluateRookHorseCoordination();

        return score;
    }

    // 评估马炮配合
    evaluateHorseCannonCoordination() {
        let score = 0;
        const horses = [];
        const cannons = [];

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.piece === '马') {
                        horses.push({row, col, color: piece.color});
                    } else if (piece.piece === '炮') {
                        cannons.push({row, col, color: piece.color});
                    }
                }
            }
        }

        // 检查马炮距离
        for (const horse of horses) {
            for (const cannon of cannons) {
                if (horse.color === cannon.color) {
                    const distance = Math.abs(horse.row - cannon.row) + Math.abs(horse.col - cannon.col);
                    if (distance <= 3) {
                        score += horse.color === 'red' ? 15 : -15;
                    }
                }
            }
        }

        return score;
    }

    // 评估车马配合
    evaluateRookHorseCoordination() {
        let score = 0;
        // 类似的逻辑...
        return score;
    }

    // 评估王的安全性
    evaluateKingSafety() {
        let score = 0;

        // 找到双方的王
        let redKing = null;
        let blackKing = null;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.piece === '帅') redKing = {row, col};
                    if (piece.piece === '将') blackKing = {row, col};
                }
            }
        }

        // 评估王周围的保护
        if (redKing) {
            score += this.evaluateKingProtection(redKing, 'red');
        }
        if (blackKing) {
            score -= this.evaluateKingProtection(blackKing, 'black');
        }

        return score;
    }

    // 评估王的保护
    evaluateKingProtection(kingPos, color) {
        let protection = 0;
        const directions = [[-1,0], [1,0], [0,-1], [0,1]];

        for (const [dr, dc] of directions) {
            const newRow = kingPos.row + dr;
            const newCol = kingPos.col + dc;

            if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
                const protector = this.board[newRow][newCol];
                if (protector && protector.color === color) {
                    protection += 30; // 王周围有己方棋子保护
                }
            }
        }

        return protection;
    }

    // Minimax算法与Alpha-Beta剪枝 - 增强版
    minimax(depth, alpha, beta, maximizingPlayer) {
        // 检查搜索超时（防止AI思考时间过长）
        const timeLimit = this.aiDifficulty === 'expert' ? 15000 : 10000;
        if (this.searchStartTime && Date.now() - this.searchStartTime > timeLimit) {
            return this.evaluatePosition(); // 超时返回当前评估
        }

        if (depth === 0) {
            return this.evaluatePosition();
        }

        const currentColor = maximizingPlayer ? 'red' : 'black';

        // 检查将军状态
        const inCheck = this.isInCheck(currentColor);

        // 获取所有可能移动并排序
        let moves = this.getAllPossibleMoves(currentColor);

        if (moves.length === 0) {
            // 无子可动，检查是否被将军
            if (inCheck) {
                return maximizingPlayer ? -10000 + depth : 10000 - depth; // 被将死，深度越浅惩罚越重
            }
            return 0; // 困毙
        }

        // 对移动进行排序以提高剪枝效率
        moves = this.sortMoves(moves);

        // 如果被将军，只考虑解将的移动
        if (inCheck) {
            moves = moves.filter(move => {
                // 执行移动
                const originalPiece = this.board[move.to.row][move.to.col];
                this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
                this.board[move.from.row][move.from.col] = null;

                const stillInCheck = this.isInCheck(currentColor);

                // 撤销移动
                this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
                this.board[move.to.row][move.to.col] = originalPiece;

                return !stillInCheck;
            });
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                // 执行移动
                const originalPiece = this.board[move.to.row][move.to.col];
                this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
                this.board[move.from.row][move.from.col] = null;

                const evaluation = this.minimax(depth - 1, alpha, beta, false);

                // 撤销移动
                this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
                this.board[move.to.row][move.to.col] = originalPiece;

                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);

                if (beta <= alpha) {
                    break; // Alpha-Beta剪枝
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                // 执行移动
                const originalPiece = this.board[move.to.row][move.to.col];
                this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
                this.board[move.from.row][move.from.col] = null;

                const evaluation = this.minimax(depth - 1, alpha, beta, true);

                // 撤销移动
                this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
                this.board[move.to.row][move.to.col] = originalPiece;

                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);

                if (beta <= alpha) {
                    break; // Alpha-Beta剪枝
                }
            }
            return minEval;
        }
    }

    // 获取所有可能的移动 - 增加错误检查
    getAllPossibleMoves(color) {
        const moves = [];

        try {
            if (!color || !this.board) {
                console.error('getAllPossibleMoves: 无效参数');
                return moves;
            }

            for (let fromRow = 0; fromRow < 10; fromRow++) {
                for (let fromCol = 0; fromCol < 9; fromCol++) {
                    try {
                        const pieceData = this.board[fromRow][fromCol];
                        if (pieceData && pieceData.color === color) {
                            for (let toRow = 0; toRow < 10; toRow++) {
                                for (let toCol = 0; toCol < 9; toCol++) {
                                    try {
                                        if (this.isValidMove({ row: fromRow, col: fromCol }, { row: toRow, col: toCol })) {
                                            moves.push({
                                                from: { row: fromRow, col: fromCol },
                                                to: { row: toRow, col: toCol }
                                            });
                                        }
                                    } catch (error) {
                                        // 忽略单个移动检查错误，继续检查其他移动
                                        console.warn(`移动检查错误 ${fromRow},${fromCol} -> ${toRow},${toCol}:`, error);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`棋子检查错误 ${fromRow},${fromCol}:`, error);
                    }
                }
            }

            console.log(`${color}方找到 ${moves.length} 个可能移动`);
            return moves;

        } catch (error) {
            console.error('getAllPossibleMoves 出错:', error);
            return moves;
        }
    }

    // AI选择最佳移动 - 增强版
    getBestMove() {
        // 首先检查开局库
        const openingMove = this.getOpeningMove();
        if (openingMove) {
            this.updateTips(`AI使用开局: ${openingMove.name || '经典开局'}`);
            return openingMove;
        }

        // 检查是否有立即获胜的机会
        const winningMove = this.findWinningMove('black');
        if (winningMove) {
            this.updateTips("AI发现致胜机会！");
            return winningMove;
        }

        // 检查是否需要防守
        const defensiveMove = this.findDefensiveMove('black');
        if (defensiveMove) {
            this.updateTips("AI进行防守");
            return defensiveMove;
        }

        const difficulty = this.aiDifficulty;
        let depth;

        switch (difficulty) {
            case 'easy': depth = 2; break;
            case 'medium': depth = 4; break;
            case 'hard': depth = 5; break;
            case 'expert': depth = 7; break; // 增加专家难度深度
            default: depth = 4;
        }

        const moves = this.getAllPossibleMoves('black');
        if (moves.length === 0) return null;

        // 简单难度添加随机性
        if (difficulty === 'easy' && Math.random() < 0.25) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            return randomMove;
        }

        // 设置搜索开始时间
        this.searchStartTime = Date.now();

        let bestMove = moves[0];
        let bestScore = Infinity;

        // 对移动进行排序以提高Alpha-Beta剪枝效率
        const sortedMoves = this.sortMoves(moves);

        // 根据难度调整搜索范围
        const maxMoves = difficulty === 'expert' ? sortedMoves.length :
                        difficulty === 'hard' ? Math.min(sortedMoves.length, 30) :
                        Math.min(sortedMoves.length, 20);

        this.updateTips(`AI正在分析 ${maxMoves} 种可能...`);

        for (let i = 0; i < maxMoves; i++) {
            const move = sortedMoves[i];

            // 检查是否超时
            const timeLimit = difficulty === 'expert' ? 12000 : 8000;
            if (Date.now() - this.searchStartTime > timeLimit) {
                break;
            }

            // 执行移动
            const originalPiece = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
            this.board[move.from.row][move.from.col] = null;

            const score = this.minimax(depth - 1, -Infinity, Infinity, true);

            // 撤销移动
            this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = originalPiece;

            if (score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        // 分析最佳移动类型
        this.analyzeMoveType(bestMove);

        return bestMove;
    }

    // 寻找获胜移动
    findWinningMove(color) {
        const moves = this.getAllPossibleMoves(color);

        for (const move of moves) {
            // 执行移动
            const originalPiece = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
            this.board[move.from.row][move.from.col] = null;

            // 检查是否将死对方
            const opponentColor = color === 'red' ? 'black' : 'red';
            const isCheckmate = this.isCheckmate(opponentColor);

            // 撤销移动
            this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = originalPiece;

            if (isCheckmate) {
                return move;
            }
        }

        return null;
    }

    // 寻找防守移动
    findDefensiveMove(color) {
        const opponentColor = color === 'red' ? 'black' : 'red';

        // 检查对方是否有获胜威胁
        const opponentWinningMove = this.findWinningMove(opponentColor);
        if (!opponentWinningMove) return null;

        // 寻找能够阻止对方获胜的移动
        const moves = this.getAllPossibleMoves(color);

        for (const move of moves) {
            // 执行移动
            const originalPiece = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
            this.board[move.from.row][move.from.col] = null;

            // 检查对方是否还能获胜
            const stillHasWinningMove = this.findWinningMove(opponentColor);

            // 撤销移动
            this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
            this.board[move.to.row][move.to.col] = originalPiece;

            if (!stillHasWinningMove) {
                return move;
            }
        }

        return null;
    }

    // 分析移动类型
    analyzeMoveType(move) {
        const piece = this.board[move.from.row][move.from.col];
        const target = this.board[move.to.row][move.to.col];

        if (target) {
            this.updateTips(`AI吃掉了${target.piece}！`);
        } else if (piece.piece === '炮') {
            this.updateTips("AI运用炮兵战术");
        } else if (piece.piece === '马') {
            this.updateTips("AI马踏连营");
        } else if (piece.piece === '车') {
            this.updateTips("AI车马炮协同作战");
        } else {
            this.updateTips("AI深思熟虑的一步");
        }
    }

    // 更新提示信息
    updateTips(message) {
        const tipsElement = document.getElementById('tips-content');
        if (tipsElement) {
            const newTip = document.createElement('p');
            newTip.textContent = `🤖 ${message}`;
            newTip.style.color = '#0c5460';
            newTip.style.fontWeight = 'bold';
            tipsElement.insertBefore(newTip, tipsElement.firstChild);

            // 保持最多5条提示
            while (tipsElement.children.length > 5) {
                tipsElement.removeChild(tipsElement.lastChild);
            }
        }
    }

    // 移动排序以提高搜索效率
    sortMoves(moves) {
        return moves.sort((a, b) => {
            // 优先考虑吃子移动
            const aCaptureValue = this.board[a.to.row][a.to.col] ?
                this.pieceValues[this.board[a.to.row][a.to.col].piece] : 0;
            const bCaptureValue = this.board[b.to.row][b.to.col] ?
                this.pieceValues[this.board[b.to.row][b.to.col].piece] : 0;

            return bCaptureValue - aCaptureValue;
        });
    }

    // AI执行移动 - 支持红方和黑方AI
    async makeAIMove(aiColor = null) {
        // 确定AI颜色
        const targetColor = aiColor || this.currentPlayer;

        // 严格的状态检查
        if (this.aiThinking) {
            console.log('AI已在思考中，跳过');
            return;
        }

        if (this.gameStatus !== 'playing') {
            console.log('游戏未进行中，AI不移动');
            return;
        }

        if (this.currentPlayer !== targetColor) {
            console.log(`当前是${this.currentPlayer}方回合，但要求${targetColor}方AI移动，跳过`);
            return;
        }

        console.log(`${targetColor}方AI开始思考...`);
        this.aiThinking = true;
        this.updateGameInfo();

        try {
            // 根据模式和难度调整思考时间
            let thinkingTime;

            if (this.isTraining) {
                // 训练模式：极短思考时间
                thinkingTime = this.getTrainingDelay();
            } else {
                // 正常模式：根据难度调整
                switch (this.aiDifficulty) {
                    case 'easy': thinkingTime = 300; break;
                    case 'medium': thinkingTime = 800; break;
                    case 'hard': thinkingTime = 1200; break;
                    case 'expert': thinkingTime = 2000; break;
                    default: thinkingTime = 800;
                }
            }

            console.log(`🔍 ${targetColor}方AI思考时间: ${thinkingTime}ms, 训练模式: ${this.isTraining}`);

            if (!this.isTraining) {
                this.showHintMessage(`AI (${this.getDifficultyText()}) 正在思考...`);
            }

            // 思考延迟
            if (thinkingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, thinkingTime));
            }

            // 获取AI移动 - 修复异步调用
            console.log(`🔍 ${targetColor}方AI开始获取移动...`);
            const bestMove = await this.getAIMove(targetColor);
            console.log(`🔍 ${targetColor}方AI获取到移动:`, bestMove);

            if (bestMove && this.isValidAIMove(bestMove, targetColor)) {
                console.log(`${targetColor}方AI执行移动:`, bestMove);

                // 验证移动合法性
                if (!this.isValidMove(bestMove.from, bestMove.to)) {
                    throw new Error(`${targetColor}方AI生成了非法移动`);
                }

                // 执行移动
                this.executeAIMove(bestMove, targetColor);

                const piece = this.board[bestMove.to.row][bestMove.to.col];
                if (!this.isTraining) {
                    const colorEmoji = targetColor === 'red' ? '🔴' : '⚫';
                    const colorName = targetColor === 'red' ? '红方' : '黑方';
                    this.showHintMessage(`${colorEmoji} ${colorName}AI移动: ${piece ? piece.piece : '棋子'} ${this.getPositionName(bestMove.from)} → ${this.getPositionName(bestMove.to)}`);
                }

                // 重置AI思考状态，检查游戏状态，然后切换玩家
                this.aiThinking = false;
                this.updateGameInfo();
                this.checkGameStatus();

                // 只有在游戏继续进行时才切换玩家
                if (this.gameStatus === 'playing') {
                    this.switchPlayer();
                }

            } else {
                console.log(`${targetColor}方AI无法找到有效移动`);
                if (!this.isTraining) {
                    this.showHintMessage(`${targetColor}方AI无法移动`);
                }
                this.aiThinking = false;
                this.updateGameInfo();
                this.checkGameStatus();
            }

        } catch (error) {
            console.error('AI移动出错:', error);
            this.showHintMessage('AI出现错误，请重新开始游戏');
            this.gameStatus = 'error';
            this.aiThinking = false;
            this.updateGameInfo();
        }
    }

    // 获取AI移动 - 集成高级AI和深度学习，支持指定颜色
    async getAIMove(aiColor = 'black') {
        try {
            // 优先使用高级AI
            if (this.useAdvancedAI && this.advancedAI) {
                console.log(`🧠 使用高级AI算法 (${aiColor}方)`);
                const advancedMove = this.advancedAI.getBestMove(this.board, aiColor, this);
                if (advancedMove) {
                    console.log(`🎯 高级AI推荐移动:`, advancedMove);
                    return advancedMove;
                }
            }

            const moves = this.getAllPossibleMoves(aiColor);

            if (!moves || moves.length === 0) {
                console.log(`${aiColor}方AI无可用移动`);
                return null;
            }

            console.log(`${aiColor}方AI找到 ${moves.length} 个可能移动`);

            // 简单难度随机选择
            if (this.aiDifficulty === 'easy' && Math.random() < 0.3) {
                return moves[Math.floor(Math.random() * moves.length)];
            }

            let bestMove = moves[0];
            let bestScore = -Infinity;

            // 如果启用深度学习且模型可用
            if (this.useDeepLearning && this.deepLearningAI && this.deepLearningAI.model) {
                console.log(`🧠 使用深度学习AI评估移动 (经验: ${this.deepLearningAI.experienceBuffer.length})`);

                // 限制搜索数量避免卡顿
                const maxMoves = Math.min(moves.length, 8);

                for (let i = 0; i < maxMoves; i++) {
                    const move = moves[i];

                    try {
                        // 模拟执行移动
                        const originalPiece = this.board[move.to.row][move.to.col];
                        this.board[move.to.row][move.to.col] = this.board[move.from.row][move.from.col];
                        this.board[move.from.row][move.from.col] = null;

                        // 使用深度学习评估
                        const dlScore = await this.deepLearningAI.evaluatePosition(this.board);

                        // 撤销移动
                        this.board[move.from.row][move.from.col] = this.board[move.to.row][move.to.col];
                        this.board[move.to.row][move.to.col] = originalPiece;

                        // 结合传统评估，随着经验增加，深度学习权重增加
                        const traditionalScore = this.evaluateMove(move);
                        const experienceCount = this.deepLearningAI.experienceBuffer.length;
                        const dlWeight = Math.min(0.8, 0.3 + experienceCount / 1000); // 经验越多，深度学习权重越高
                        const traditionalWeight = 1 - dlWeight;

                        const combinedScore = dlScore * dlWeight + traditionalScore * traditionalWeight;

                        if (combinedScore > bestScore) {
                            bestScore = combinedScore;
                            bestMove = move;
                        }

                        console.log(`移动评估: DL=${dlScore.toFixed(2)} (权重${dlWeight.toFixed(2)}), 传统=${traditionalScore.toFixed(2)} (权重${traditionalWeight.toFixed(2)}), 综合=${combinedScore.toFixed(2)}`);

                    } catch (error) {
                        console.warn('深度学习评估失败，使用传统评估:', error);
                        // 如果深度学习失败，使用传统评估
                        const traditionalScore = this.evaluateMove(move);
                        if (traditionalScore > bestScore) {
                            bestScore = traditionalScore;
                            bestMove = move;
                        }
                    }
                }

                console.log(`🎯 深度学习AI选择移动，最终评分: ${bestScore.toFixed(2)}`);

            } else {
                // 使用传统评估
                const maxMoves = Math.min(moves.length, 20);

                for (let i = 0; i < maxMoves; i++) {
                    const move = moves[i];
                    const score = this.evaluateMove(move);

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = move;
                    }
                }
            }

            return bestMove;

        } catch (error) {
            console.error('获取AI移动出错:', error);
            return null;
        }
    }

    // 验证AI移动有效性
    isValidAIMove(move, aiColor = null) {
        if (!move || !move.from || !move.to) {
            return false;
        }

        const { from, to } = move;

        // 检查坐标范围
        if (from.row < 0 || from.row >= 10 || from.col < 0 || from.col >= 9 ||
            to.row < 0 || to.row >= 10 || to.col < 0 || to.col >= 9) {
            return false;
        }

        // 检查起始位置有棋子且是当前玩家的棋子
        const piece = this.board[from.row][from.col];
        const expectedColor = aiColor || this.currentPlayer;
        if (!piece || piece.color !== expectedColor) {
            return false;
        }

        return true;
    }

    // 执行AI移动
    executeAIMove(move, aiColor = 'black') {
        const pieceData = this.board[move.from.row][move.from.col];
        const capturedPieceData = this.board[move.to.row][move.to.col];

        // 保存移动前的棋盘状态用于学习
        const beforeBoard = this.copyBoard(this.board);

        // 记录移动历史
        this.moveHistory.push({
            from: { ...move.from },
            to: { ...move.to },
            pieceData: pieceData,
            capturedPieceData: capturedPieceData,
            player: aiColor
        });

        // 记录当前游戏的移动
        this.currentGameMoves.push({
            move: move,
            boardBefore: beforeBoard,
            player: aiColor,
            timestamp: Date.now()
        });

        // 更新棋盘
        this.board[move.to.row][move.to.col] = pieceData;
        this.board[move.from.row][move.from.col] = null;

        // 更新防止无限对局的计数器（在棋盘更新后）
        this.moveCount++;
        console.log(`🔢 移动计数更新: ${this.moveCount}`);

        // 更新无吃子移动计数
        if (capturedPieceData) {
            this.noCaptureCount = 0; // 有吃子，重置计数
            console.log(`🍽️ 有吃子，重置无吃子计数: ${this.noCaptureCount}`);
        } else {
            this.noCaptureCount++; // 无吃子，增加计数
            console.log(`⏳ 无吃子移动计数: ${this.noCaptureCount}`);
        }

        // 记录当前局面到历史中（在棋盘更新后）
        const currentHash = this.getBoardHash();
        this.positionHistory.push(currentHash);

        // 限制历史记录长度，避免内存过度使用
        if (this.positionHistory.length > 200) {
            this.positionHistory.shift();
        }

        // 检查重复局面
        const repetitionCount = this.positionHistory.filter(pos => pos === currentHash).length;
        if (repetitionCount > 1) {
            console.log(`🔄 检测到重复局面，重复次数: ${repetitionCount}`);
        }

        // 如果启用学习，记录经验（记录双方AI的经验）
        if (this.learningEnabled && this.deepLearningAI) {
            this.recordMoveExperience(beforeBoard, move, this.board, aiColor);
            console.log(`📚 记录${aiColor}方AI移动经验`);
        }

        // 更新显示
        this.updateBoardDisplay();
        this.updateMoveHistory();
        this.updateTrainingStats(); // 更新统计显示
    }

    // 记录移动经验用于学习
    recordMoveExperience(beforeBoard, move, afterBoard, aiColor = 'black') {
        try {
            // 计算移动奖励
            let reward = 0;

            // 吃子奖励
            const capturedPiece = beforeBoard[move.to.row][move.to.col];
            if (capturedPiece) {
                const pieceValue = this.pieceValues[capturedPiece.piece] || 100;
                reward += pieceValue;
                console.log(`${aiColor}方吃子奖励: +${pieceValue}`);
            }

            // 位置奖励 - 中心控制
            if (move.to.row >= 3 && move.to.row <= 6 && move.to.col >= 3 && move.to.col <= 5) {
                reward += 20;
                console.log(`${aiColor}方中心控制奖励: +20`);
            }

            // 前进奖励（鼓励进攻）
            const movingPiece = beforeBoard[move.from.row][move.from.col];
            if (movingPiece) {
                if (aiColor === 'red' && move.to.row < move.from.row) {
                    reward += 5; // 红方向上进攻
                } else if (aiColor === 'black' && move.to.row > move.from.row) {
                    reward += 5; // 黑方向下进攻
                }
            }

            // 检查游戏是否结束
            const gameOver = this.gameStatus !== 'playing';
            if (gameOver) {
                // 根据游戏结果给予奖励
                if ((this.gameStatus === 'black-win' && aiColor === 'black') ||
                    (this.gameStatus === 'red-win' && aiColor === 'red')) {
                    reward += 1000; // 获胜大奖励
                    console.log(`${aiColor}方获胜奖励: +1000`);
                } else if ((this.gameStatus === 'black-win' && aiColor === 'red') ||
                          (this.gameStatus === 'red-win' && aiColor === 'black')) {
                    reward -= 1000; // 失败大惩罚
                    console.log(`${aiColor}方失败惩罚: -1000`);
                }
            }

            // 记录经验到深度学习AI
            this.deepLearningAI.recordExperience(
                beforeBoard,
                move,
                reward,
                afterBoard,
                gameOver
            );

            console.log(`📊 ${aiColor}方AI经验记录完成，总奖励: ${reward}`);

        } catch (error) {
            console.error('记录移动经验失败:', error);
        }
    }

    // 复制棋盘状态
    copyBoard(board) {
        const copy = [];
        for (let row = 0; row < 10; row++) {
            copy[row] = [];
            for (let col = 0; col < 9; col++) {
                copy[row][col] = board[row][col] ? { ...board[row][col] } : null;
            }
        }
        return copy;
    }

    // 简化的移动评估
    evaluateMove(move) {
        let score = 0;

        // 吃子奖励
        const target = this.board[move.to.row][move.to.col];
        if (target) {
            score += this.pieceValues[target.piece] || 100;
        }

        // 中心控制奖励
        if (move.to.row >= 3 && move.to.row <= 6 && move.to.col >= 3 && move.to.col <= 5) {
            score += 20;
        }

        // 随机因子避免重复
        score += Math.random() * 10;

        return score;
    }

    // 获取难度文本
    getDifficultyText() {
        switch (this.aiDifficulty) {
            case 'easy': return '简单';
            case 'medium': return '中等';
            case 'hard': return '困难';
            case 'expert': return '专家';
            default: return '中等';
        }
    }

    // 获取棋子显示名称
    getPieceDisplayName(piece) {
        return piece || '未知';
    }

    // 获取位置名称
    getPositionName(pos) {
        const cols = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const rows = ['１', '２', '３', '４', '５', '６', '７', '８', '９', '１０'];
        return `${cols[pos.col]}${rows[pos.row]}`;
    }

    // 更新提示信息
    updateTips(message) {
        // 可以在这里添加提示信息显示逻辑
        console.log('AI提示:', message);
    }

    // 分析移动类型
    analyzeMoveType(move) {
        if (!move) return;

        const piece = this.board[move.from.row][move.from.col];
        const target = this.board[move.to.row][move.to.col];

        if (target) {
            console.log(`AI执行吃子: ${piece.piece} 吃 ${target.piece}`);
        } else {
            console.log(`AI执行移动: ${piece.piece}`);
        }
    }



    // 为整局游戏分配最终奖励
    assignFinalRewards() {
        if (!this.currentGameMoves.length) return;

        let finalReward = 0;

        // 根据游戏结果分配奖励
        if (this.gameStatus === 'black-win') {
            finalReward = 500; // 黑方获胜
        } else if (this.gameStatus === 'red-win') {
            finalReward = -500; // 红方获胜
        } else if (this.gameStatus === 'draw') {
            finalReward = 0; // 和棋
        } else {
            finalReward = 0; // 其他情况
        }

        // 为最近的移动分配更高的奖励/惩罚
        for (let i = this.currentGameMoves.length - 1; i >= 0; i--) {
            const moveData = this.currentGameMoves[i];
            if (moveData.player === 'black') {
                const decayFactor = Math.pow(0.9, this.currentGameMoves.length - 1 - i);
                const adjustedReward = finalReward * decayFactor;

                // 更新经验缓冲区中的奖励
                if (this.deepLearningAI.experienceBuffer.length > 0) {
                    const lastExperience = this.deepLearningAI.experienceBuffer[this.deepLearningAI.experienceBuffer.length - 1];
                    lastExperience.reward += adjustedReward;
                }
            }
        }

        console.log(`分配最终奖励: ${finalReward}，影响 ${this.currentGameMoves.length} 个移动`);
    }

    // 测试AI能力
    async testAIStrength() {
        if (!this.deepLearningAI || !this.deepLearningAI.model) {
            this.showHintMessage('❌ 深度学习AI未初始化');
            return;
        }

        console.log('🧪 开始测试AI能力...');
        this.showHintMessage('🧪 正在测试AI能力...');

        try {
            // 创建测试棋盘位置
            const testPositions = [
                this.initializeBoard(), // 开局位置
                this.createMidGamePosition(), // 中局位置
                this.createEndGamePosition() // 残局位置
            ];

            let totalScore = 0;
            let testCount = 0;

            for (let i = 0; i < testPositions.length; i++) {
                const position = testPositions[i];
                const positionName = ['开局', '中局', '残局'][i];

                console.log(`🎯 测试${positionName}位置...`);

                // 使用深度学习评估
                const dlScore = await this.deepLearningAI.evaluatePosition(position);

                // 获取可能移动
                const moves = this.getAllPossibleMoves('black');
                if (moves.length > 0) {
                    // 评估前几个移动
                    let bestScore = -Infinity;
                    for (let j = 0; j < Math.min(5, moves.length); j++) {
                        const move = moves[j];
                        const moveScore = this.evaluateMove(move);
                        bestScore = Math.max(bestScore, moveScore);
                    }

                    // 计算AI理解度（深度学习分数与传统分数的相关性）
                    const understanding = Math.abs(dlScore) + Math.abs(bestScore);
                    totalScore += understanding;
                    testCount++;

                    console.log(`${positionName}: DL=${dlScore.toFixed(2)}, 传统=${bestScore.toFixed(2)}, 理解度=${understanding.toFixed(2)}`);
                }
            }

            const averageScore = testCount > 0 ? totalScore / testCount : 0;
            const aiLevel = this.getAILevel(averageScore);

            console.log(`🏆 AI测试完成！平均分数: ${averageScore.toFixed(2)}, 等级: ${aiLevel}`);
            this.showHintMessage(`🏆 AI能力测试完成！等级: ${aiLevel} (分数: ${averageScore.toFixed(1)})`);

            return {
                score: averageScore,
                level: aiLevel,
                experiences: this.deepLearningAI.experienceBuffer.length
            };

        } catch (error) {
            console.error('AI能力测试失败:', error);
            this.showHintMessage('❌ AI能力测试失败');
            return null;
        }
    }

    // 根据分数判断AI等级
    getAILevel(score) {
        if (score < 50) return '新手';
        if (score < 100) return '初级';
        if (score < 200) return '中级';
        if (score < 400) return '高级';
        if (score < 800) return '专家';
        return '大师';
    }

    // 创建中局测试位置
    createMidGamePosition() {
        const board = this.initializeBoard();
        // 移动一些棋子到中局位置
        // 这里简化处理，实际可以设置更复杂的中局位置
        return board;
    }

    // 创建残局测试位置
    createEndGamePosition() {
        const board = Array(10).fill(null).map(() => Array(9).fill(null));

        // 设置简单的残局：红方帅、车，黑方将、车
        board[9][4] = { piece: '帅', color: 'red' };
        board[9][0] = { piece: '车', color: 'red' };
        board[0][4] = { piece: '将', color: 'black' };
        board[0][8] = { piece: '车', color: 'black' };

        return board;
    }

    // 开始AI对战训练
    startTraining() {
        if (this.isTraining) {
            this.showHintMessage('训练已在进行中');
            return;
        }

        console.log('开始AI对战训练...');
        this.isTraining = true;
        this.trainingGames = 0;

        // 设置AI对战模式
        document.getElementById('ai-mode').value = 'ai-vs-ai';

        // 获取训练速度
        this.trainingSpeed = document.getElementById('training-speed').value;

        // 启用学习
        this.learningEnabled = true;

        // 开始第一局训练
        this.startTrainingGame();

        this.showHintMessage('🤖 AI对战训练已开始！');
        this.updateTrainingStats();
    }

    // 停止AI对战训练
    async stopTraining() {
        if (!this.isTraining) {
            this.showHintMessage('当前没有在训练');
            return;
        }

        console.log('停止AI对战训练...');
        this.isTraining = false;

        if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
            this.trainingInterval = null;
        }

        // 停止训练时自动保存训练数据
        if (this.trainingGames > 0) {
            console.log('💾 训练结束，自动保存训练数据...');
            await this.saveTrainingData();
        }

        this.showHintMessage(`🤖 训练已停止！共完成 ${this.trainingGames} 局训练，数据已保存`);
        this.updateTrainingStats();
    }

    // 开始一局训练游戏
    startTrainingGame() {
        if (!this.isTraining) return;

        // 重新开始游戏
        this.restartGame();

        // 确保是AI对战模式
        document.getElementById('ai-mode').value = 'ai-vs-ai';

        // 确保红方先行
        this.currentPlayer = 'red';
        this.updateGameInfo();

        console.log(`🎯 开始第 ${this.trainingGames + 1} 局训练，红方AI先行`);
        console.log(`🔍 训练状态检查: isTraining=${this.isTraining}, gameStatus=${this.gameStatus}, currentPlayer=${this.currentPlayer}`);

        // 设置强制结束定时器（防止死循环）
        this.gameTimeoutId = setTimeout(() => {
            if (this.isTraining && this.gameStatus === 'playing') {
                console.log('⏰ 训练局超时，强制结束');
                this.gameStatus = 'draw';
                this.handleGameEnd('和棋！训练局超时');
            }
        }, 30000); // 30秒超时

        // 开始第一步移动（红方先行）
        setTimeout(() => {
            console.log(`🔍 训练移动条件检查: isTraining=${this.isTraining}, gameStatus=${this.gameStatus}, currentPlayer=${this.currentPlayer}`);
            if (this.isTraining && this.gameStatus === 'playing' && this.currentPlayer === 'red') {
                console.log('🔴 训练局：红方AI开始首步移动');
                this.makeAIMove('red').catch(error => {
                    console.error('训练中红方AI移动失败:', error);
                    // 训练出错时继续下一局
                    this.onTrainingGameEnd();
                });
            } else {
                console.warn('训练启动条件不满足，跳过本局', {
                    isTraining: this.isTraining,
                    gameStatus: this.gameStatus,
                    currentPlayer: this.currentPlayer
                });
                this.onTrainingGameEnd();
            }
        }, this.getTrainingDelay());
    }

    // 更新训练统计
    updateTrainingStats() {
        const gamesElement = document.getElementById('training-games');
        const experiencesElement = document.getElementById('training-experiences');
        const modelParamsElement = document.getElementById('model-params');
        const learningStatusElement = document.getElementById('learning-status');
        const trainingProgressElement = document.getElementById('training-progress');
        const currentMovesElement = document.getElementById('current-moves');
        const noCaptureMovesElement = document.getElementById('no-capture-moves');

        if (gamesElement) {
            gamesElement.textContent = this.trainingGames;
        }

        if (experiencesElement && this.deepLearningAI) {
            experiencesElement.textContent = this.deepLearningAI.experienceBuffer.length;
        }

        if (modelParamsElement && this.deepLearningAI && this.deepLearningAI.model && this.deepLearningAI.isInitialized) {
            try {
                const paramCount = this.deepLearningAI.model.countParams();
                modelParamsElement.textContent = paramCount.toLocaleString();
            } catch (error) {
                modelParamsElement.textContent = '计算中...';
            }
        } else if (modelParamsElement) {
            modelParamsElement.textContent = '初始化中...';
        }

        if (learningStatusElement && this.deepLearningAI) {
            const status = this.deepLearningAI.isTraining ? '学习中...' :
                          this.isTraining ? '训练中' : '待机';
            learningStatusElement.textContent = status;
        }

        // 更新训练进度
        if (trainingProgressElement && this.deepLearningAI) {
            const progress = this.deepLearningAI.getTrainingProgress();
            if (progress.hasTrainedModel) {
                const saveDate = new Date(progress.saveTime).toLocaleDateString();
                trainingProgressElement.textContent = `已训练 (${saveDate})`;
                trainingProgressElement.style.color = '#00ff00';
            } else {
                trainingProgressElement.textContent = '新模型';
                trainingProgressElement.style.color = '#ffff00';
            }
        }

        // 更新当前游戏状态
        if (currentMovesElement) {
            currentMovesElement.textContent = this.moveCount;
        }

        if (noCaptureMovesElement) {
            noCaptureMovesElement.textContent = this.noCaptureCount;
        }


    }

    // 手动保存训练数据
    async saveTrainingData() {
        if (!this.deepLearningAI) {
            this.showHintMessage('❌ 深度学习AI未初始化');
            return;
        }

        try {
            await this.deepLearningAI.saveModel();
            this.showHintMessage('💾 训练数据已保存！');
            this.updateTrainingStats();
        } catch (error) {
            console.error('保存训练数据失败:', error);
            this.showHintMessage('❌ 保存失败');
        }
    }

    // 清除训练数据
    clearTrainingData() {
        if (!this.deepLearningAI) {
            this.showHintMessage('❌ 深度学习AI未初始化');
            return;
        }

        if (confirm('确定要清除所有训练数据吗？这将删除AI的学习成果！')) {
            try {
                this.deepLearningAI.clearSavedData();
                this.deepLearningAI.experienceBuffer = [];
                this.showHintMessage('🗑️ 训练数据已清除！');
                this.updateTrainingStats();
            } catch (error) {
                console.error('清除训练数据失败:', error);
                this.showHintMessage('❌ 清除失败');
            }
        }
    }

    // 训练游戏结束处理
    onTrainingGameEnd() {
        if (!this.isTraining) return;

        this.trainingGames++;
        this.updateTrainingStats();

        console.log(`✅ 完成第 ${this.trainingGames} 局训练`);

        // 每5局显示一次进度和AI能力变化
        if (this.trainingGames % 5 === 0) {
            const experiences = this.deepLearningAI ? this.deepLearningAI.experienceBuffer.length : 0;
            this.showHintMessage(`🎓 训练进度: ${this.trainingGames}局, 经验: ${experiences}个`);

            // 每10局自动保存一次训练数据
            if (this.trainingGames % 10 === 0) {
                console.log('💾 自动保存训练进度...');
                setTimeout(async () => {
                    await this.saveTrainingData();
                }, 500);
            }

            // 每20局测试一次AI能力
            if (this.trainingGames % 20 === 0) {
                console.log('🧪 自动测试AI能力提升...');
                setTimeout(async () => {
                    const result = await this.testAIStrength();
                    if (result) {
                        console.log(`🏆 AI能力测试: 等级${result.level}, 分数${result.score.toFixed(1)}`);
                    }
                }, 1000);
            }
        }

        // 继续下一局训练
        setTimeout(() => {
            this.startTrainingGame();
        }, 100);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.chessGame = new ChineseChess();

        // 添加全局错误处理
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
            if (window.chessGame && window.chessGame.aiThinking) {
                window.chessGame.emergencyRecover();
            }
        });

        // 添加未处理的Promise错误处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise错误:', event.reason);
            if (window.chessGame && window.chessGame.aiThinking) {
                window.chessGame.emergencyRecover();
            }
        });

        // 设置深度学习控制按钮
        setupDeepLearningControls();

        // 设置训练控制按钮
        setupTrainingControls();

        // 设置游戏模式监听器
        setupGameModeListener();

        console.log('象棋游戏初始化完成，已添加错误处理');

    } catch (error) {
        console.error('游戏初始化失败:', error);
        document.body.innerHTML = '<div style="text-align:center;padding:50px;color:red;">游戏初始化失败，请刷新页面重试</div>';
    }
});

// 设置深度学习控制按钮
function setupDeepLearningControls() {
    // 深度学习开关
    const toggleDeepLearningBtn = document.getElementById('toggle-deep-learning');
    if (toggleDeepLearningBtn) {
        toggleDeepLearningBtn.addEventListener('click', () => {
            if (window.chessGame) {
                window.chessGame.toggleDeepLearning();
                updateButtonState(toggleDeepLearningBtn, window.chessGame.useDeepLearning);
            }
        });
    }

    // 学习功能开关
    const toggleLearningBtn = document.getElementById('toggle-learning');
    if (toggleLearningBtn) {
        toggleLearningBtn.addEventListener('click', () => {
            if (window.chessGame) {
                window.chessGame.toggleLearning();
                updateButtonState(toggleLearningBtn, window.chessGame.learningEnabled);
            }
        });
        // 默认启用学习
        updateButtonState(toggleLearningBtn, true);
    }

    // 重置学习数据
    const resetLearningBtn = document.getElementById('reset-learning');
    if (resetLearningBtn) {
        resetLearningBtn.addEventListener('click', () => {
            if (window.chessGame && window.chessGame.deepLearningAI) {
                if (confirm('确定要重置所有学习数据吗？这将清除AI的所有学习经验。')) {
                    window.chessGame.deepLearningAI.resetLearning();
                    window.chessGame.showHintMessage('🧠 学习数据已重置');
                }
            }
        });
    }
}

// 更新按钮状态
function updateButtonState(button, isActive) {
    if (isActive) {
        button.classList.add('active');
        button.textContent = button.textContent.replace('启用', '禁用');
    } else {
        button.classList.remove('active');
        button.textContent = button.textContent.replace('禁用', '启用');
    }
}

// 设置训练控制按钮
function setupTrainingControls() {
    // 开始训练按钮
    const startTrainingBtn = document.getElementById('start-training');
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', () => {
            if (window.chessGame) {
                window.chessGame.startTraining();
                startTrainingBtn.classList.add('active');

                const stopBtn = document.getElementById('stop-training');
                if (stopBtn) stopBtn.classList.remove('active');
            }
        });
    }

    // 停止训练按钮
    const stopTrainingBtn = document.getElementById('stop-training');
    if (stopTrainingBtn) {
        stopTrainingBtn.addEventListener('click', () => {
            if (window.chessGame) {
                window.chessGame.stopTraining();
                stopTrainingBtn.classList.add('active');

                const startBtn = document.getElementById('start-training');
                if (startBtn) startBtn.classList.remove('active');
            }
        });
    }

    // 训练速度选择
    const trainingSpeedSelect = document.getElementById('training-speed');
    if (trainingSpeedSelect) {
        trainingSpeedSelect.addEventListener('change', (e) => {
            if (window.chessGame) {
                window.chessGame.trainingSpeed = e.target.value;
                console.log('训练速度已更改为:', e.target.value);
            }
        });
    }

    // 手动启动AI对战按钮
    const startAIBattleBtn = document.getElementById('start-ai-battle');
    if (startAIBattleBtn) {
        startAIBattleBtn.addEventListener('click', () => {
            if (window.chessGame) {
                console.log('🎮 手动启动AI对战');
                window.chessGame.startAIBattle();
            }
        });
    }

    // 测试AI能力按钮
    const testAIStrengthBtn = document.getElementById('test-ai-strength');
    if (testAIStrengthBtn) {
        testAIStrengthBtn.addEventListener('click', async () => {
            if (window.chessGame) {
                console.log('🧪 开始测试AI能力');
                await window.chessGame.testAIStrength();
            }
        });
    }

    // 保存训练数据按钮
    const saveTrainingBtn = document.getElementById('save-training');
    if (saveTrainingBtn) {
        saveTrainingBtn.addEventListener('click', async () => {
            if (window.chessGame) {
                console.log('💾 手动保存训练数据');
                await window.chessGame.saveTrainingData();
            }
        });
    }

    // 清除训练数据按钮
    const clearTrainingBtn = document.getElementById('clear-training');
    if (clearTrainingBtn) {
        clearTrainingBtn.addEventListener('click', () => {
            if (window.chessGame) {
                console.log('🗑️ 清除训练数据');
                window.chessGame.clearTrainingData();
            }
        });
    }

    // 高级AI开关
    const useAdvancedAICheckbox = document.getElementById('use-advanced-ai');
    if (useAdvancedAICheckbox) {
        useAdvancedAICheckbox.addEventListener('change', (e) => {
            if (window.chessGame) {
                window.chessGame.useAdvancedAI = e.target.checked;
                const status = e.target.checked ? '启用' : '禁用';
                console.log(`🧠 高级AI已${status}`);
                window.chessGame.showHintMessage(`🧠 高级AI已${status}`);
            }
        });
    }

    // 深度学习开关
    const useDeepLearningCheckbox = document.getElementById('use-deep-learning');
    if (useDeepLearningCheckbox) {
        useDeepLearningCheckbox.addEventListener('change', (e) => {
            if (window.chessGame) {
                window.chessGame.useDeepLearning = e.target.checked;
                const status = e.target.checked ? '启用' : '禁用';
                console.log(`🧠 深度学习已${status}`);
                window.chessGame.showHintMessage(`🧠 深度学习已${status}`);
            }
        });
    }
}

// 设置游戏模式监听器
function setupGameModeListener() {
    const gameModeSelect = document.getElementById('ai-mode');
    if (gameModeSelect) {
        gameModeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            console.log('游戏模式切换为:', mode);

            if (window.chessGame) {
                if (mode === 'ai-vs-ai') {
                    // 切换到AI对战模式时自动开始
                    console.log('启动AI对战模式，红方先行');
                    window.chessGame.showHintMessage('🤖 AI对战模式：红方AI先行');
                    setTimeout(() => {
                        window.chessGame.startAIBattle();
                    }, 1000);
                } else {
                    // 切换到其他模式时重新开始游戏
                    window.chessGame.restartGame();
                    if (mode === 'ai') {
                        window.chessGame.showHintMessage('🎮 人机对战模式：红方先行');
                    } else {
                        window.chessGame.showHintMessage('👥 人人对战模式：红方先行');
                    }
                }
            }
        });
    }
}
