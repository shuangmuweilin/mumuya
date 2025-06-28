// 高级象棋AI系统
class AdvancedChessAI {
    constructor() {
        // 棋子价值表
        this.pieceValues = {
            '帅': 10000, '将': 10000,
            '车': 900, '马': 450, '炮': 450,
            '相': 200, '象': 200, '士': 200, '仕': 200,
            '兵': 100, '卒': 100
        };

        // 位置价值表
        this.positionValues = this.initializePositionValues();
        
        // 搜索深度
        this.maxDepth = 4;
        this.maxTime = 3000; // 3秒思考时间
    }

    // 初始化位置价值表
    initializePositionValues() {
        const values = {};
        
        // 兵/卒的位置价值
        values['兵'] = [
            [0,  0,  0,  0,  0,  0,  0,  0,  0],
            [0,  0,  0,  0,  0,  0,  0,  0,  0],
            [0,  0,  0,  0,  0,  0,  0,  0,  0],
            [0,  0,  0,  0,  0,  0,  0,  0,  0],
            [0,  0,  0,  0,  0,  0,  0,  0,  0],
            [10, 10, 10, 20, 20, 20, 10, 10, 10],
            [20, 20, 20, 30, 30, 30, 20, 20, 20],
            [30, 30, 30, 40, 40, 40, 30, 30, 30],
            [40, 40, 40, 50, 50, 50, 40, 40, 40],
            [50, 50, 50, 60, 60, 60, 50, 50, 50]
        ];

        values['卒'] = values['兵'].slice().reverse();

        // 车的位置价值
        values['车'] = [
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180]
        ];

        // 马的位置价值
        values['马'] = [
            [80,  90,  90,  90,  90,  90,  90,  90,  80],
            [90,  90,  90,  90,  90,  90,  90,  90,  90],
            [90,  90, 110, 110, 110, 110, 110,  90,  90],
            [90,  90, 110, 110, 110, 110, 110,  90,  90],
            [90,  90, 110, 110, 110, 110, 110,  90,  90],
            [90,  90, 110, 110, 110, 110, 110,  90,  90],
            [90,  90, 110, 110, 110, 110, 110,  90,  90],
            [90,  90,  90,  90,  90,  90,  90,  90,  90],
            [90,  90,  90,  90,  90,  90,  90,  90,  90],
            [80,  90,  90,  90,  90,  90,  90,  90,  80]
        ];

        // 炮的位置价值
        values['炮'] = [
            [180, 180, 180, 180, 180, 180, 180, 180, 180],
            [180, 180, 180, 180, 180, 180, 180, 180, 180],
            [180, 180, 180, 180, 180, 180, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 190, 190, 190, 180, 180, 180],
            [180, 180, 180, 180, 180, 180, 180, 180, 180],
            [180, 180, 180, 180, 180, 180, 180, 180, 180],
            [180, 180, 180, 180, 180, 180, 180, 180, 180],
            [180, 180, 180, 180, 180, 180, 180, 180, 180]
        ];

        return values;
    }

    // 高级局面评估
    evaluatePosition(board, color) {
        let score = 0;
        let redPieces = 0;
        let blackPieces = 0;

        // 基础材料评估
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (!piece) continue;

                const pieceValue = this.pieceValues[piece.piece] || 0;
                const positionValue = this.getPositionValue(piece.piece, row, col, piece.color);
                const totalValue = pieceValue + positionValue;

                if (piece.color === 'red') {
                    score += totalValue;
                    redPieces++;
                } else {
                    score -= totalValue;
                    blackPieces++;
                }
            }
        }

        // 控制中心奖励
        score += this.evaluateControl(board, color);

        // 将军威胁评估
        score += this.evaluateThreats(board, color);

        // 机动性评估
        score += this.evaluateMobility(board, color);

        // 残局调整
        if (redPieces + blackPieces < 16) {
            score += this.evaluateEndgame(board, color);
        }

        return color === 'red' ? score : -score;
    }

    // 获取位置价值
    getPositionValue(piece, row, col, color) {
        const values = this.positionValues[piece];
        if (!values) return 0;

        if (color === 'black') {
            // 黑方需要翻转坐标
            row = 9 - row;
        }

        return values[row] ? values[row][col] || 0 : 0;
    }

    // 评估控制力
    evaluateControl(board, color) {
        let score = 0;
        const centerCols = [3, 4, 5];
        const centerRows = [4, 5];

        for (let row of centerRows) {
            for (let col of centerCols) {
                const piece = board[row][col];
                if (piece) {
                    if (piece.color === color) {
                        score += 20;
                    } else {
                        score -= 10;
                    }
                }
            }
        }

        return score;
    }

    // 评估威胁
    evaluateThreats(board, color) {
        // 这里可以添加更复杂的威胁评估
        // 暂时返回0，后续可以扩展
        return 0;
    }

    // 评估机动性
    evaluateMobility(board, color) {
        // 这里可以添加机动性评估
        // 暂时返回0，后续可以扩展
        return 0;
    }

    // 残局评估
    evaluateEndgame(board, color) {
        // 残局中帅/将的活跃度更重要
        let score = 0;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece && (piece.piece === '帅' || piece.piece === '将')) {
                    // 残局中帅/将应该更活跃
                    if (piece.color === color) {
                        score += 50;
                    }
                }
            }
        }

        return score;
    }

    // Alpha-Beta剪枝搜索
    alphaBeta(board, depth, alpha, beta, maximizingPlayer, color, startTime, gameInstance = null) {
        // 时间限制检查
        if (Date.now() - startTime > this.maxTime) {
            return this.evaluatePosition(board, color);
        }

        if (depth === 0) {
            return this.evaluatePosition(board, color);
        }

        const moves = this.getAllPossibleMoves(board, maximizingPlayer ? color : (color === 'red' ? 'black' : 'red'), gameInstance);

        if (moves.length === 0) {
            return maximizingPlayer ? -Infinity : Infinity;
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const eval_ = this.alphaBeta(newBoard, depth - 1, alpha, beta, false, color, startTime, gameInstance);
                maxEval = Math.max(maxEval, eval_);
                alpha = Math.max(alpha, eval_);
                if (beta <= alpha) {
                    break; // Beta剪枝
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const eval_ = this.alphaBeta(newBoard, depth - 1, alpha, beta, true, color, startTime, gameInstance);
                minEval = Math.min(minEval, eval_);
                beta = Math.min(beta, eval_);
                if (beta <= alpha) {
                    break; // Alpha剪枝
                }
            }
            return minEval;
        }
    }

    // 获取最佳移动
    getBestMove(board, color, gameInstance) {
        const startTime = Date.now();
        let bestMove = null;
        let bestScore = -Infinity;

        const moves = this.getAllPossibleMoves(board, color, gameInstance);

        if (moves.length === 0) {
            return null;
        }

        console.log(`🧠 高级AI开始分析 ${moves.length} 个可能移动，搜索深度 ${this.maxDepth}`);

        // 移动排序优化（优先考虑吃子移动）
        moves.sort((a, b) => {
            const aCaptureValue = board[a.to.row][a.to.col] ? this.pieceValues[board[a.to.row][a.to.col].piece] : 0;
            const bCaptureValue = board[b.to.row][b.to.col] ? this.pieceValues[board[b.to.row][b.to.col].piece] : 0;
            return bCaptureValue - aCaptureValue;
        });

        // 限制搜索的移动数量以提高性能
        const maxMovesToSearch = Math.min(moves.length, 12);

        for (let i = 0; i < maxMovesToSearch; i++) {
            const move = moves[i];
            const newBoard = this.makeMove(board, move);
            const score = this.alphaBeta(newBoard, this.maxDepth - 1, -Infinity, Infinity, false, color, startTime, gameInstance);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            // 时间限制检查
            if (Date.now() - startTime > this.maxTime) {
                console.log(`⏰ 高级AI搜索超时，已分析 ${i + 1} 个移动`);
                break;
            }
        }

        const searchTime = Date.now() - startTime;
        console.log(`🧠 高级AI评估完成: 最佳移动得分 ${bestScore.toFixed(2)}, 搜索时间 ${searchTime}ms`);
        return bestMove;
    }

    // 获取所有可能的移动（使用游戏实例的方法）
    getAllPossibleMoves(board, color, gameInstance = null) {
        if (gameInstance && gameInstance.getAllPossibleMoves) {
            // 使用游戏实例的方法获取精确的移动
            return gameInstance.getAllPossibleMoves(color);
        }

        // 备用简化方法
        const moves = [];

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    const pieceMoves = this.getPieceMovesAdvanced(board, row, col, piece, gameInstance);
                    moves.push(...pieceMoves);
                }
            }
        }

        return moves;
    }

    // 获取棋子的高级移动
    getPieceMovesAdvanced(board, row, col, piece, gameInstance = null) {
        const moves = [];

        // 遍历所有可能的目标位置
        for (let toRow = 0; toRow < 10; toRow++) {
            for (let toCol = 0; toCol < 9; toCol++) {
                if (toRow === row && toCol === col) continue;

                const move = {
                    from: { row, col },
                    to: { row: toRow, col: toCol }
                };

                // 优先使用游戏实例的验证方法
                let isValid = false;
                if (gameInstance && gameInstance.isValidMove) {
                    isValid = gameInstance.isValidMove(move.from, move.to);
                } else {
                    isValid = this.isValidMoveSimple(board, move, piece);
                }

                if (isValid) {
                    moves.push(move);
                }
            }
        }

        return moves;
    }

    // 简化的移动验证
    isValidMoveSimple(board, move, piece) {
        const { from, to } = move;
        const targetPiece = board[to.row][to.col];
        
        // 不能吃自己的棋子
        if (targetPiece && targetPiece.color === piece.color) {
            return false;
        }
        
        // 基本的移动规则检查（简化版）
        const deltaRow = Math.abs(to.row - from.row);
        const deltaCol = Math.abs(to.col - from.col);
        
        switch (piece.piece) {
            case '车':
                return (deltaRow === 0 || deltaCol === 0) && this.isPathClear(board, from, to);
            case '马':
                return (deltaRow === 2 && deltaCol === 1) || (deltaRow === 1 && deltaCol === 2);
            case '炮':
                return (deltaRow === 0 || deltaCol === 0) && this.isCannonMoveValid(board, from, to);
            case '兵':
            case '卒':
                return this.isPawnMoveValid(from, to, piece.color);
            default:
                return true; // 其他棋子暂时允许
        }
    }

    // 检查路径是否畅通
    isPathClear(board, from, to) {
        const deltaRow = to.row - from.row;
        const deltaCol = to.col - from.col;
        const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
        
        if (steps <= 1) return true;
        
        const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
        const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
        
        for (let i = 1; i < steps; i++) {
            const checkRow = from.row + stepRow * i;
            const checkCol = from.col + stepCol * i;
            if (board[checkRow][checkCol]) {
                return false;
            }
        }
        
        return true;
    }

    // 炮的移动验证
    isCannonMoveValid(board, from, to) {
        const targetPiece = board[to.row][to.col];
        let piecesBetween = 0;
        
        const deltaRow = to.row - from.row;
        const deltaCol = to.col - from.col;
        const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
        
        const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
        const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
        
        for (let i = 1; i < steps; i++) {
            const checkRow = from.row + stepRow * i;
            const checkCol = from.col + stepCol * i;
            if (board[checkRow][checkCol]) {
                piecesBetween++;
            }
        }
        
        if (targetPiece) {
            return piecesBetween === 1; // 吃子需要跳一个棋子
        } else {
            return piecesBetween === 0; // 移动不能跳棋子
        }
    }

    // 兵/卒的移动验证
    isPawnMoveValid(from, to, color) {
        const deltaRow = to.row - from.row;
        const deltaCol = Math.abs(to.col - from.col);
        
        if (color === 'red') {
            // 红方兵向上移动
            if (from.row >= 5) {
                // 未过河，只能向前
                return deltaRow === -1 && deltaCol === 0;
            } else {
                // 已过河，可以横移
                return (deltaRow === -1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1);
            }
        } else {
            // 黑方卒向下移动
            if (from.row <= 4) {
                // 未过河，只能向前
                return deltaRow === 1 && deltaCol === 0;
            } else {
                // 已过河，可以横移
                return (deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1);
            }
        }
    }

    // 执行移动（返回新棋盘）
    makeMove(board, move) {
        const newBoard = board.map(row => row.slice());
        const piece = newBoard[move.from.row][move.from.col];
        
        newBoard[move.to.row][move.to.col] = piece;
        newBoard[move.from.row][move.from.col] = null;
        
        return newBoard;
    }
}
