// 深度学习象棋AI系统
class DeepLearningChessAI {
    constructor() {
        this.model = null;
        this.isTraining = false;
        this.gameHistory = [];
        this.trainingData = [];
        this.learningRate = 0.001;
        this.batchSize = 32;
        this.epochs = 10;
        this.isInitialized = false;

        // 经验回放缓冲区
        this.experienceBuffer = [];
        this.maxBufferSize = 10000;

        // 网络架构参数
        this.boardSize = 90; // 10x9 棋盘
        this.hiddenLayers = [512, 256, 128];
        this.outputSize = 1; // 位置评估值

        // 异步初始化
        this.initialize();
    }

    // 异步初始化方法
    async initialize() {
        try {
            console.log('🧠 初始化深度学习AI...');

            // 先尝试加载已保存的模型
            const loaded = await this.loadModel();

            if (!loaded) {
                // 如果没有保存的模型，创建新模型
                await this.initializeModel();
                console.log('🆕 创建了新的AI模型');
            }

            this.isInitialized = true;
            console.log('✅ 深度学习AI初始化完成');

        } catch (error) {
            console.error('❌ 深度学习AI初始化失败:', error);
            // 如果初始化失败，创建基础模型
            await this.initializeModel();
            this.isInitialized = true;
        }
    }

    // 初始化神经网络模型
    async initializeModel() {
        try {
            console.log('初始化深度学习模型...');
            
            // 创建序列模型
            this.model = tf.sequential({
                layers: [
                    // 输入层：棋盘状态 (90个位置)
                    tf.layers.dense({
                        inputShape: [this.boardSize],
                        units: this.hiddenLayers[0],
                        activation: 'relu',
                        kernelInitializer: 'heNormal'
                    }),
                    
                    // Dropout层防止过拟合
                    tf.layers.dropout({ rate: 0.3 }),
                    
                    // 第二隐藏层
                    tf.layers.dense({
                        units: this.hiddenLayers[1],
                        activation: 'relu',
                        kernelInitializer: 'heNormal'
                    }),
                    
                    tf.layers.dropout({ rate: 0.2 }),
                    
                    // 第三隐藏层
                    tf.layers.dense({
                        units: this.hiddenLayers[2],
                        activation: 'relu',
                        kernelInitializer: 'heNormal'
                    }),
                    
                    tf.layers.dropout({ rate: 0.1 }),
                    
                    // 输出层：位置评估值
                    tf.layers.dense({
                        units: this.outputSize,
                        activation: 'tanh' // 输出-1到1之间的评估值
                    })
                ]
            });

            // 编译模型
            this.model.compile({
                optimizer: tf.train.adam(this.learningRate),
                loss: 'meanSquaredError',
                metrics: ['mae']
            });

            console.log('深度学习模型初始化完成');
            this.printModelSummary();
            
        } catch (error) {
            console.error('模型初始化失败:', error);
        }
    }

    // 打印模型摘要
    printModelSummary() {
        if (this.model) {
            console.log('=== 神经网络架构 ===');
            console.log(`输入层: ${this.boardSize} 个神经元`);
            console.log(`隐藏层: ${this.hiddenLayers.join(' -> ')} 个神经元`);
            console.log(`输出层: ${this.outputSize} 个神经元`);
            console.log(`总参数数量: ${this.model.countParams()}`);
            console.log('====================');
        }
    }

    // 将棋盘状态转换为神经网络输入
    boardToTensor(board) {
        const input = new Array(90).fill(0);

        // 棋子编码 - 修复编码问题
        const pieceEncoding = {
            // 红方棋子
            '帅': 6, '车': 5, '马': 4, '炮': 4, '相': 3, '仕': 2, '兵': 1,
            // 黑方棋子
            '将': 6, '象': 3, '士': 2, '卒': 1
        };

        try {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 9; col++) {
                    const index = row * 9 + col;
                    const piece = board[row][col];

                    if (piece && piece.piece && piece.color) {
                        const baseValue = pieceEncoding[piece.piece] || 1;
                        // 红方为正值，黑方为负值
                        input[index] = piece.color === 'red' ? baseValue : -baseValue;
                    }
                }
            }

            return tf.tensor2d([input]);
        } catch (error) {
            console.error('棋盘转换张量失败:', error);
            return tf.tensor2d([input]); // 返回空棋盘
        }
    }

    // 评估棋盘位置
    async evaluatePosition(board) {
        if (!this.model) {
            console.warn('模型未初始化，使用传统评估');
            return 0;
        }

        try {
            const inputTensor = this.boardToTensor(board);
            const prediction = await this.model.predict(inputTensor);
            const value = await prediction.data();
            
            // 清理张量内存
            inputTensor.dispose();
            prediction.dispose();
            
            return value[0] * 1000; // 缩放到合适的范围
            
        } catch (error) {
            console.error('位置评估失败:', error);
            return 0;
        }
    }

    // 记录游戏经验
    recordExperience(board, move, reward, nextBoard, gameOver) {
        const experience = {
            state: this.boardToArray(board),
            action: move,
            reward: reward,
            nextState: this.boardToArray(nextBoard),
            done: gameOver,
            timestamp: Date.now()
        };

        this.experienceBuffer.push(experience);
        
        // 限制缓冲区大小
        if (this.experienceBuffer.length > this.maxBufferSize) {
            this.experienceBuffer.shift();
        }

        console.log(`记录经验，缓冲区大小: ${this.experienceBuffer.length}`);
    }

    // 将棋盘转换为数组
    boardToArray(board) {
        const array = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    array.push(piece.color === 'red' ? 1 : -1);
                } else {
                    array.push(0);
                }
            }
        }
        return array;
    }

    // 从经验中学习
    async learnFromExperience() {
        if (this.experienceBuffer.length < 5) {
            console.log(`经验不足，需要至少5个样本，当前: ${this.experienceBuffer.length}`);
            return;
        }

        if (this.isTraining) {
            console.log('正在训练中，跳过本次学习');
            return;
        }

        console.log(`🧠 开始从 ${this.experienceBuffer.length} 个经验中学习...`);
        this.isTraining = true;

        try {
            // 使用所有可用经验或最多32个
            const batchSize = Math.min(this.experienceBuffer.length, this.batchSize);
            const batch = this.sampleExperiences(batchSize);

            console.log(`📊 采样 ${batchSize} 个经验进行学习`);

            // 准备训练数据
            const states = batch.map(exp => exp.state);
            const targets = await this.calculateTargets(batch);

            // 创建张量
            const inputTensor = tf.tensor2d(states);
            const targetTensor = tf.tensor2d(targets.map(t => [t]));

            console.log(`🔢 输入张量形状: [${inputTensor.shape}], 目标张量形状: [${targetTensor.shape}]`);

            // 训练模型 - 增加训练轮数
            const epochs = Math.min(3, Math.max(1, Math.floor(batchSize / 10)));
            console.log(`🎯 开始 ${epochs} 轮训练...`);

            const history = await this.model.fit(inputTensor, targetTensor, {
                epochs: epochs,
                batchSize: Math.min(batchSize, 16),
                verbose: 0,
                shuffle: true
            });

            const finalLoss = history.history.loss[history.history.loss.length - 1];
            console.log(`✅ 训练完成！最终损失: ${finalLoss.toFixed(6)}`);

            // 清理内存
            inputTensor.dispose();
            targetTensor.dispose();

            // 定期保存模型
            if (this.experienceBuffer.length % 50 === 0) {
                console.log('💾 保存模型...');
                await this.saveModel();
            }

            return true;

        } catch (error) {
            console.error('❌ 学习过程出错:', error);
            return false;
        } finally {
            this.isTraining = false;
        }
    }

    // 随机采样经验
    sampleExperiences(batchSize) {
        const batch = [];
        for (let i = 0; i < batchSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.experienceBuffer.length);
            batch.push(this.experienceBuffer[randomIndex]);
        }
        return batch;
    }

    // 计算目标值
    async calculateTargets(batch) {
        const targets = [];
        
        for (const experience of batch) {
            let target = experience.reward;
            
            if (!experience.done) {
                // 如果游戏未结束，使用贝尔曼方程
                const nextStateTensor = tf.tensor2d([experience.nextState]);
                const nextValue = await this.model.predict(nextStateTensor);
                const nextValueData = await nextValue.data();
                
                target += 0.95 * nextValueData[0]; // 折扣因子0.95
                
                nextStateTensor.dispose();
                nextValue.dispose();
            }
            
            targets.push(target);
        }
        
        return targets;
    }

    // 保存模型和训练数据
    async saveModel() {
        if (!this.model) return;

        try {
            // 保存神经网络模型
            await this.model.save('localstorage://chess-ai-model');

            // 保存训练统计数据
            const trainingData = {
                experienceCount: this.experienceBuffer.length,
                learningRate: this.learningRate,
                batchSize: this.batchSize,
                saveTime: Date.now(),
                version: '1.0'
            };

            localStorage.setItem('chess-ai-training-data', JSON.stringify(trainingData));

            // 保存部分经验数据（最近的1000个）
            const recentExperiences = this.experienceBuffer.slice(-1000);
            localStorage.setItem('chess-ai-experiences', JSON.stringify(recentExperiences));

            console.log(`💾 模型和训练数据已保存 (经验: ${this.experienceBuffer.length}个)`);
        } catch (error) {
            console.error('模型保存失败:', error);
        }
    }

    // 加载模型和训练数据
    async loadModel() {
        try {
            // 加载神经网络模型
            const savedModel = await tf.loadLayersModel('localstorage://chess-ai-model');
            if (savedModel) {
                this.model = savedModel;
                console.log('✅ 已加载保存的神经网络模型');
                this.printModelSummary();

                // 加载训练统计数据
                const trainingDataStr = localStorage.getItem('chess-ai-training-data');
                if (trainingDataStr) {
                    const trainingData = JSON.parse(trainingDataStr);
                    console.log(`📊 训练数据: 经验${trainingData.experienceCount}个, 保存时间: ${new Date(trainingData.saveTime).toLocaleString()}`);
                }

                // 加载经验数据
                const experiencesStr = localStorage.getItem('chess-ai-experiences');
                if (experiencesStr) {
                    const experiences = JSON.parse(experiencesStr);
                    this.experienceBuffer = experiences;
                    console.log(`📚 已加载 ${experiences.length} 个历史经验`);
                }

                return true;
            }
        } catch (error) {
            console.log('未找到保存的模型，使用新模型');
        }

        return false;
    }

    // 获取训练进度信息
    getTrainingProgress() {
        const trainingDataStr = localStorage.getItem('chess-ai-training-data');
        if (trainingDataStr) {
            const trainingData = JSON.parse(trainingDataStr);
            return {
                hasTrainedModel: true,
                experienceCount: trainingData.experienceCount,
                saveTime: trainingData.saveTime,
                currentExperiences: this.experienceBuffer.length
            };
        }

        return {
            hasTrainedModel: false,
            experienceCount: 0,
            saveTime: null,
            currentExperiences: this.experienceBuffer.length
        };
    }

    // 清除所有保存的数据
    clearSavedData() {
        try {
            localStorage.removeItem('chess-ai-training-data');
            localStorage.removeItem('chess-ai-experiences');
            // 注意：模型数据由TensorFlow.js管理，需要特殊处理
            console.log('🗑️ 已清除保存的训练数据');
        } catch (error) {
            console.error('清除数据失败:', error);
        }
    }

    // 获取学习统计信息
    getLearningStats() {
        return {
            experienceCount: this.experienceBuffer.length,
            isTraining: this.isTraining,
            modelParams: this.model ? this.model.countParams() : 0,
            learningRate: this.learningRate
        };
    }

    // 重置学习数据
    resetLearning() {
        this.experienceBuffer = [];
        console.log('学习数据已重置');
    }
}
