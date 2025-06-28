// 预训练象棋AI数据
class PretrainedChessData {
    constructor() {
        // 开局库 - 常见的开局走法
        this.openingBook = {
            // 红方开局
            'red_openings': [
                // 中炮开局
                { from: { row: 9, col: 4 }, to: { row: 7, col: 4 }, name: '中炮' },
                { from: { row: 9, col: 1 }, to: { row: 7, col: 2 }, name: '马二进三' },
                { from: { row: 9, col: 7 }, to: { row: 7, col: 6 }, name: '马八进七' },
                
                // 仙人指路
                { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, name: '兵七进一' },
                
                // 飞相开局
                { from: { row: 9, col: 2 }, to: { row: 7, col: 4 }, name: '相三进五' },
                { from: { row: 9, col: 6 }, to: { row: 7, col: 4 }, name: '相七进五' }
            ],
            
            // 黑方应对
            'black_responses': [
                // 应对中炮
                { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' },
                { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
                { from: { row: 0, col: 4 }, to: { row: 2, col: 4 }, name: '中炮对攻' },
                
                // 屏风马
                { from: { row: 0, col: 1 }, to: { row: 2, col: 2 }, name: '马2进3' },
                { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
                
                // 反宫马
                { from: { row: 0, col: 7 }, to: { row: 2, col: 6 }, name: '马8进7' },
                { from: { row: 0, col: 1 }, to: { row: 2, col: 0 }, name: '马2进1' }
            ]
        };

        // 战术模式库
        this.tacticalPatterns = [
            // 双车胁士
            {
                name: '双车胁士',
                pattern: 'rook_attack_advisor',
                description: '用双车攻击对方的士',
                value: 300
            },
            
            // 马后炮
            {
                name: '马后炮',
                pattern: 'horse_cannon_combo',
                description: '马和炮的配合攻击',
                value: 250
            },
            
            // 卧槽马
            {
                name: '卧槽马',
                pattern: 'sleeping_horse',
                description: '马在对方底线的强力位置',
                value: 400
            },
            
            // 铁门栓
            {
                name: '铁门栓',
                pattern: 'iron_gate',
                description: '车在对方九宫内的强力控制',
                value: 350
            }
        ];

        // 残局知识库
        this.endgameKnowledge = {
            // 车兵对车
            'rook_pawn_vs_rook': {
                evaluation: 'slight_advantage',
                tips: ['推进兵到底线', '用车保护兵', '避免车被牵制']
            },
            
            // 马炮对马炮
            'horse_cannon_vs_horse_cannon': {
                evaluation: 'equal',
                tips: ['控制中心', '马炮配合', '避免子力交换']
            },
            
            // 单车对单车
            'rook_vs_rook': {
                evaluation: 'draw_tendency',
                tips: ['占据有利位置', '限制对方车的活动', '寻找战术机会']
            }
        };

        // 位置评估权重
        this.positionWeights = {
            // 中心控制
            center_control: 1.2,
            
            // 子力协调
            piece_coordination: 1.1,
            
            // 王的安全
            king_safety: 1.5,
            
            // 子力活跃度
            piece_activity: 1.0,
            
            // 兵形结构
            pawn_structure: 0.8
        };

        // 经验数据样本
        this.experienceSamples = this.generateExperienceSamples();
    }

    // 生成经验数据样本
    generateExperienceSamples() {
        const samples = [];
        
        // 开局阶段的好移动
        samples.push({
            boardState: 'opening',
            move: { from: { row: 9, col: 4 }, to: { row: 7, col: 4 } },
            reward: 50,
            phase: 'opening',
            description: '中炮开局'
        });

        samples.push({
            boardState: 'opening',
            move: { from: { row: 9, col: 1 }, to: { row: 7, col: 2 } },
            reward: 45,
            phase: 'opening',
            description: '马二进三'
        });

        // 中局阶段的战术
        samples.push({
            boardState: 'middlegame',
            move: { from: { row: 7, col: 4 }, to: { row: 3, col: 4 } },
            reward: 80,
            phase: 'middlegame',
            description: '炮打中兵'
        });

        // 残局阶段的技巧
        samples.push({
            boardState: 'endgame',
            move: { from: { row: 8, col: 0 }, to: { row: 8, col: 4 } },
            reward: 60,
            phase: 'endgame',
            description: '车占中路'
        });

        return samples;
    }

    // 获取开局建议
    getOpeningMove(board, color, moveCount) {
        if (moveCount > 10) return null; // 只在开局前10步提供建议

        const openings = color === 'red' ? this.openingBook.red_openings : this.openingBook.black_responses;
        
        // 随机选择一个开局
        const randomOpening = openings[Math.floor(Math.random() * openings.length)];
        
        // 检查这个移动是否可行
        const piece = board[randomOpening.from.row][randomOpening.from.col];
        if (piece && piece.color === color) {
            return randomOpening;
        }
        
        return null;
    }

    // 检测战术模式
    detectTacticalPattern(board, move) {
        // 简化的战术检测
        const piece = board[move.from.row][move.from.col];
        const target = board[move.to.row][move.to.col];
        
        if (target && piece) {
            // 吃子移动，给予额外奖励
            return {
                pattern: 'capture',
                value: this.getPieceValue(target.piece),
                description: `${piece.piece}吃${target.piece}`
            };
        }
        
        return null;
    }

    // 获取棋子价值
    getPieceValue(piece) {
        const values = {
            '帅': 10000, '将': 10000,
            '车': 900, '马': 450, '炮': 450,
            '相': 200, '象': 200, '士': 200, '仕': 200,
            '兵': 100, '卒': 100
        };
        return values[piece] || 0;
    }

    // 评估局面阶段
    evaluateGamePhase(board) {
        let pieceCount = 0;
        let majorPieces = 0;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    pieceCount++;
                    if (['车', '马', '炮'].includes(piece.piece)) {
                        majorPieces++;
                    }
                }
            }
        }

        if (pieceCount > 20) return 'opening';
        if (majorPieces > 8) return 'middlegame';
        return 'endgame';
    }

    // 获取位置建议
    getPositionalAdvice(board, color) {
        const phase = this.evaluateGamePhase(board);
        
        switch (phase) {
            case 'opening':
                return {
                    advice: '发展子力，控制中心',
                    priority: ['马', '炮', '车'],
                    avoid: '过早出动边路子力'
                };
            case 'middlegame':
                return {
                    advice: '寻找战术机会，协调子力',
                    priority: ['车', '炮', '马'],
                    avoid: '无目的的移动'
                };
            case 'endgame':
                return {
                    advice: '简化局面，推进优势',
                    priority: ['车', '兵', '帅'],
                    avoid: '复杂的战术'
                };
        }
    }

    // 预加载训练数据到深度学习AI
    preloadTrainingData(deepLearningAI) {
        if (!deepLearningAI) return;

        console.log('🎓 加载预训练数据...');
        
        // 添加经验样本到缓冲区
        for (const sample of this.experienceSamples) {
            // 转换为深度学习AI期望的格式
            const experience = {
                state: this.boardToVector(this.createSampleBoard()),
                action: sample.move,
                reward: sample.reward,
                nextState: this.boardToVector(this.createSampleBoard()),
                done: false
            };
            
            deepLearningAI.experienceBuffer.push(experience);
        }

        console.log(`📚 已加载 ${this.experienceSamples.length} 个预训练样本`);
    }

    // 创建示例棋盘（简化）
    createSampleBoard() {
        // 返回一个标准的象棋开局棋盘
        return [
            [
                {piece: '车', color: 'black'}, {piece: '马', color: 'black'}, {piece: '象', color: 'black'}, {piece: '士', color: 'black'}, {piece: '将', color: 'black'}, {piece: '士', color: 'black'}, {piece: '象', color: 'black'}, {piece: '马', color: 'black'}, {piece: '车', color: 'black'}
            ],
            [null, null, null, null, null, null, null, null, null],
            [null, {piece: '炮', color: 'black'}, null, null, null, null, null, {piece: '炮', color: 'black'}, null],
            [{piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'}, null, {piece: '卒', color: 'black'}],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [{piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'}, null, {piece: '兵', color: 'red'}],
            [null, {piece: '炮', color: 'red'}, null, null, null, null, null, {piece: '炮', color: 'red'}, null],
            [null, null, null, null, null, null, null, null, null],
            [
                {piece: '车', color: 'red'}, {piece: '马', color: 'red'}, {piece: '相', color: 'red'}, {piece: '仕', color: 'red'}, {piece: '帅', color: 'red'}, {piece: '仕', color: 'red'}, {piece: '相', color: 'red'}, {piece: '马', color: 'red'}, {piece: '车', color: 'red'}
            ]
        ];
    }

    // 棋盘转向量（简化版）
    boardToVector(board) {
        const vector = new Array(90).fill(0);
        let index = 0;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    // 简化编码：红方为正值，黑方为负值
                    const value = this.getPieceValue(piece.piece) / 100;
                    vector[index] = piece.color === 'red' ? value : -value;
                }
                index++;
            }
        }
        
        return vector;
    }
}

// 全局实例
window.pretrainedData = new PretrainedChessData();
