/**
 * Challenge Manager Service
 * Handles daily/weekly challenges, point calculation, and reward distribution
 */

import { getConfig } from '../config/environment.js';
import { AppError } from '../utils/errorHandler.js';

/**
 * Challenge types and configurations
 */
export const CHALLENGE_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    SPECIAL: 'special'
};

export const CHALLENGE_CATEGORIES = {
    SALES: 'sales',
    TRANSACTIONS: 'transactions',
    CUSTOMERS: 'customers',
    EFFICIENCY: 'efficiency',
    SPEED: 'speed',
    ACCURACY: 'accuracy',
    TEAM: 'team'
};

/**
 * Challenge difficulty levels
 */
export const DIFFICULTY_LEVELS = {
    EASY: { multiplier: 1, pointsBase: 50, name: 'Dễ' },
    MEDIUM: { multiplier: 1.5, pointsBase: 100, name: 'Trung bình' },
    HARD: { multiplier: 2, pointsBase: 200, name: 'Khó' },
    EXTREME: { multiplier: 3, pointsBase: 500, name: 'Cực khó' }
};

/**
 * Challenge templates for auto-generation
 */
const CHALLENGE_TEMPLATES = [
    // Daily challenges
    {
        type: CHALLENGE_TYPES.DAILY,
        category: CHALLENGE_CATEGORIES.SALES,
        title: 'Target doanh số hôm nay',
        description: 'Đạt doanh số {target} trong ngày hôm nay',
        targetRange: { min: 300000, max: 800000, step: 50000 },
        difficulty: 'MEDIUM',
        icon: '💰'
    },
    {
        type: CHALLENGE_TYPES.DAILY,
        category: CHALLENGE_CATEGORIES.TRANSACTIONS,
        title: 'Số giao dịch trong ngày',
        description: 'Hoàn thành {target} giao dịch trong ngày',
        targetRange: { min: 10, max: 30, step: 2 },
        difficulty: 'EASY',
        icon: '🛒'
    },
    {
        type: CHALLENGE_TYPES.DAILY,
        category: CHALLENGE_CATEGORIES.CUSTOMERS,
        title: 'Phục vụ khách hàng',
        description: 'Phục vụ {target} khách hàng khác nhau trong ngày',
        targetRange: { min: 8, max: 20, step: 2 },
        difficulty: 'EASY',
        icon: '👥'
    },
    {
        type: CHALLENGE_TYPES.DAILY,
        category: CHALLENGE_CATEGORIES.SPEED,
        title: 'Tốc độ giao dịch',
        description: 'Hoàn thành giao dịch trung bình dưới {target} giây',
        targetRange: { min: 30, max: 60, step: 5 },
        difficulty: 'HARD',
        icon: '⚡'
    },

    // Weekly challenges
    {
        type: CHALLENGE_TYPES.WEEKLY,
        category: CHALLENGE_CATEGORIES.SALES,
        title: 'Doanh số tuần',
        description: 'Đạt doanh số {target} trong tuần này',
        targetRange: { min: 2000000, max: 5000000, step: 250000 },
        difficulty: 'MEDIUM',
        icon: '📈'
    },
    {
        type: CHALLENGE_TYPES.WEEKLY,
        category: CHALLENGE_CATEGORIES.EFFICIENCY,
        title: 'Hiệu quả làm việc',
        description: 'Duy trì hiệu quả trên {target}% trong tuần',
        targetRange: { min: 85, max: 95, step: 2 },
        difficulty: 'HARD',
        icon: '🎯'
    },
    {
        type: CHALLENGE_TYPES.WEEKLY,
        category: CHALLENGE_CATEGORIES.ACCURACY,
        title: 'Độ chính xác',
        description: 'Duy trì độ chính xác trên {target}% trong tuần',
        targetRange: { min: 95, max: 99, step: 1 },
        difficulty: 'EXTREME',
        icon: '🔍'
    },

    // Monthly challenges
    {
        type: CHALLENGE_TYPES.MONTHLY,
        category: CHALLENGE_CATEGORIES.SALES,
        title: 'Siêu target tháng',
        description: 'Đạt doanh số {target} trong tháng',
        targetRange: { min: 8000000, max: 15000000, step: 500000 },
        difficulty: 'HARD',
        icon: '🏆'
    },
    {
        type: CHALLENGE_TYPES.MONTHLY,
        category: CHALLENGE_CATEGORIES.CUSTOMERS,
        title: 'Khách hàng mới',
        description: 'Thu hút {target} khách hàng mới trong tháng',
        targetRange: { min: 50, max: 100, step: 10 },
        difficulty: 'MEDIUM',
        icon: '🌟'
    }
];

/**
 * Achievement templates for milestones
 */
const ACHIEVEMENT_TEMPLATES = [
    {
        id: 'FIRST_SALE',
        title: 'Giao dịch đầu tiên',
        description: 'Hoàn thành giao dịch bán hàng đầu tiên',
        icon: '🎯',
        category: 'milestone',
        rarity: 'common',
        points: 100,
        condition: { type: 'transaction_count', value: 1 }
    },
    {
        id: 'SALES_ROOKIE',
        title: 'Tân binh bán hàng',
        description: 'Hoàn thành 10 giao dịch bán hàng',
        icon: '🏃',
        category: 'sales',
        rarity: 'common',
        points: 200,
        condition: { type: 'transaction_count', value: 10 }
    },
    {
        id: 'SALES_WARRIOR',
        title: 'Chiến binh bán hàng',
        description: 'Hoàn thành 100 giao dịch bán hàng',
        icon: '⚔️',
        category: 'sales',
        rarity: 'rare',
        points: 500,
        condition: { type: 'transaction_count', value: 100 }
    },
    {
        id: 'SALES_LEGEND',
        title: 'Huyền thoại bán hàng',
        description: 'Hoàn thành 1000 giao dịch bán hàng',
        icon: '👑',
        category: 'sales',
        rarity: 'legendary',
        points: 2000,
        condition: { type: 'transaction_count', value: 1000 }
    },
    {
        id: 'MILLION_SELLER',
        title: 'Triệu phú doanh số',
        description: 'Đạt doanh số 10 triệu đồng trong tháng',
        icon: '💰',
        category: 'revenue',
        rarity: 'epic',
        points: 1000,
        condition: { type: 'monthly_revenue', value: 10000000 }
    },
    {
        id: 'CUSTOMER_LOVER',
        title: 'Người yêu khách hàng',
        description: 'Phục vụ 500 khách hàng khác nhau',
        icon: '❤️',
        category: 'customer',
        rarity: 'rare',
        points: 750,
        condition: { type: 'unique_customers', value: 500 }
    },
    {
        id: 'SPEED_DEMON',
        title: 'Thần tốc độ',
        description: 'Hoàn thành 20 giao dịch trong 1 giờ',
        icon: '⚡',
        category: 'speed',
        rarity: 'epic',
        points: 1200,
        condition: { type: 'transactions_per_hour', value: 20 }
    },
    {
        id: 'PERFECT_WEEK',
        title: 'Tuần hoàn hảo',
        description: 'Đạt target 7 ngày liên tiếp',
        icon: '🔥',
        category: 'streak',
        rarity: 'legendary',
        points: 2000,
        condition: { type: 'daily_target_streak', value: 7 }
    },
    {
        id: 'ACCURACY_MASTER',
        title: 'Bậc thầy chính xác',
        description: 'Duy trì độ chính xác 100% trong 30 ngày',
        icon: '🎯',
        category: 'accuracy',
        rarity: 'legendary',
        points: 2500,
        condition: { type: 'accuracy_streak', value: 30, threshold: 100 }
    }
];

/**
 * Challenge Manager Class
 */
export class ChallengeManager {
    constructor(env) {
        this.env = env;
        this.config = getConfig(env);
    }

    /**
     * Generate daily challenges for a user
     * @param {string} userId - User ID
     * @param {Object} userStats - User performance statistics
     * @returns {Promise<Array>} Generated challenges
     */
    async generateDailyChallenges(userId, userStats) {
        try {
            const dailyTemplates = CHALLENGE_TEMPLATES.filter(t => t.type === CHALLENGE_TYPES.DAILY);
            const challenges = [];

            // Generate 2-3 daily challenges
            const numChallenges = Math.floor(Math.random() * 2) + 2;
            const selectedTemplates = this.shuffleArray(dailyTemplates).slice(0, numChallenges);

            for (const template of selectedTemplates) {
                const challenge = await this.createChallengeFromTemplate(template, userId, userStats);
                challenges.push(challenge);
            }

            // Store challenges in database
            for (const challenge of challenges) {
                await this.storeChallengeInDB(challenge);
            }

            return challenges;
        } catch (error) {
            console.error('Error generating daily challenges:', error);
            throw new AppError('Failed to generate daily challenges');
        }
    }

    /**
     * Generate weekly challenges
     * @param {string} userId - User ID
     * @param {Object} userStats - User performance statistics
     * @returns {Promise<Array>} Generated challenges
     */
    async generateWeeklyChallenges(userId, userStats) {
        try {
            const weeklyTemplates = CHALLENGE_TEMPLATES.filter(t => t.type === CHALLENGE_TYPES.WEEKLY);
            const challenges = [];

            // Generate 1-2 weekly challenges
            const numChallenges = Math.floor(Math.random() * 2) + 1;
            const selectedTemplates = this.shuffleArray(weeklyTemplates).slice(0, numChallenges);

            for (const template of selectedTemplates) {
                const challenge = await this.createChallengeFromTemplate(template, userId, userStats);
                challenges.push(challenge);
            }

            // Store challenges in database
            for (const challenge of challenges) {
                await this.storeChallengeInDB(challenge);
            }

            return challenges;
        } catch (error) {
            console.error('Error generating weekly challenges:', error);
            throw new AppError('Failed to generate weekly challenges');
        }
    }

    /**
     * Create challenge from template with personalized targets
     * @param {Object} template - Challenge template
     * @param {string} userId - User ID
     * @param {Object} userStats - User performance statistics
     * @returns {Object} Generated challenge
     */
    async createChallengeFromTemplate(template, userId, userStats) {
        const challengeId = `${template.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate personalized target based on user stats
        const target = this.calculatePersonalizedTarget(template, userStats);
        
        // Calculate reward points
        const difficulty = DIFFICULTY_LEVELS[template.difficulty];
        const rewardPoints = Math.floor(difficulty.pointsBase * difficulty.multiplier);

        // Set deadline based on challenge type
        const deadline = this.calculateDeadline(template.type);

        return {
            id: challengeId,
            userId,
            type: template.type,
            category: template.category,
            title: template.title,
            description: template.description.replace('{target}', target.toLocaleString()),
            target,
            progress: 0,
            difficulty: template.difficulty,
            rewardPoints,
            icon: template.icon,
            status: 'active',
            createdAt: new Date().toISOString(),
            deadline: deadline.toISOString(),
            completedAt: null
        };
    }

    /**
     * Calculate personalized target based on user performance
     * @param {Object} template - Challenge template
     * @param {Object} userStats - User performance statistics
     * @returns {number} Calculated target
     */
    calculatePersonalizedTarget(template, userStats) {
        const { targetRange } = template;
        let baseTarget;

        // Use user stats to determine appropriate target
        switch (template.category) {
            case CHALLENGE_CATEGORIES.SALES:
                baseTarget = userStats.averageDailySales || targetRange.min;
                break;
            case CHALLENGE_CATEGORIES.TRANSACTIONS:
                baseTarget = userStats.averageDailyTransactions || targetRange.min;
                break;
            case CHALLENGE_CATEGORIES.CUSTOMERS:
                baseTarget = userStats.averageDailyCustomers || targetRange.min;
                break;
            default:
                baseTarget = targetRange.min;
        }

        // Adjust target based on difficulty and add some randomness
        const difficultyMultiplier = DIFFICULTY_LEVELS[template.difficulty].multiplier;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        
        let adjustedTarget = Math.floor(baseTarget * difficultyMultiplier * randomFactor);
        
        // Ensure target is within range and aligned to step
        adjustedTarget = Math.max(targetRange.min, Math.min(targetRange.max, adjustedTarget));
        adjustedTarget = Math.round(adjustedTarget / targetRange.step) * targetRange.step;

        return adjustedTarget;
    }

    /**
     * Calculate deadline based on challenge type
     * @param {string} type - Challenge type
     * @returns {Date} Deadline date
     */
    calculateDeadline(type) {
        const now = new Date();
        
        switch (type) {
            case CHALLENGE_TYPES.DAILY:
                // End of current day
                const endOfDay = new Date(now);
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay;
                
            case CHALLENGE_TYPES.WEEKLY:
                // End of current week (Sunday)
                const endOfWeek = new Date(now);
                const daysUntilSunday = 7 - now.getDay();
                endOfWeek.setDate(now.getDate() + daysUntilSunday);
                endOfWeek.setHours(23, 59, 59, 999);
                return endOfWeek;
                
            case CHALLENGE_TYPES.MONTHLY:
                // End of current month
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endOfMonth.setHours(23, 59, 59, 999);
                return endOfMonth;
                
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        }
    }

    /**
     * Update challenge progress
     * @param {string} userId - User ID
     * @param {string} category - Challenge category
     * @param {number} value - Progress value
     */
    async updateChallengeProgress(userId, category, value) {
        try {
            const stmt = this.env.DB.prepare(`
                UPDATE user_challenges 
                SET progress = progress + ?, updated_at = datetime('now')
                WHERE user_id = ? AND category = ? AND status = 'active'
                  AND deadline > datetime('now')
            `);
            
            await stmt.bind(value, userId, category).run();

            // Check for completed challenges
            await this.checkCompletedChallenges(userId);
        } catch (error) {
            console.error('Error updating challenge progress:', error);
        }
    }

    /**
     * Check and process completed challenges
     * @param {string} userId - User ID
     */
    async checkCompletedChallenges(userId) {
        try {
            // Get completed challenges
            const stmt = this.env.DB.prepare(`
                SELECT * FROM user_challenges 
                WHERE user_id = ? AND status = 'active' 
                  AND progress >= target
            `);
            
            const completedChallenges = await stmt.bind(userId).all();

            for (const challenge of completedChallenges) {
                await this.completeChallenge(challenge);
            }
        } catch (error) {
            console.error('Error checking completed challenges:', error);
        }
    }

    /**
     * Complete a challenge and award points
     * @param {Object} challenge - Challenge object
     */
    async completeChallenge(challenge) {
        try {
            // Mark challenge as completed
            const updateStmt = this.env.DB.prepare(`
                UPDATE user_challenges 
                SET status = 'completed', completed_at = datetime('now')
                WHERE id = ?
            `);
            await updateStmt.bind(challenge.id).run();

            // Award points to user
            await this.awardPoints(challenge.user_id, challenge.reward_points, {
                type: 'challenge_completion',
                challengeId: challenge.id,
                challengeTitle: challenge.title
            });

            // Check for achievement unlocks
            await this.checkAchievementUnlocks(challenge.user_id);

            console.log(`Challenge completed: ${challenge.title} by user ${challenge.user_id}`);
        } catch (error) {
            console.error('Error completing challenge:', error);
        }
    }

    /**
     * Award points to user
     * @param {string} userId - User ID
     * @param {number} points - Points to award
     * @param {Object} source - Source of points
     */
    async awardPoints(userId, points, source) {
        try {
            // Update user points
            const updateUserStmt = this.env.DB.prepare(`
                UPDATE users 
                SET points = points + ?, experience = experience + ?
                WHERE id = ?
            `);
            await updateUserStmt.bind(points, points, userId).run();

            // Log point transaction
            const logStmt = this.env.DB.prepare(`
                INSERT INTO point_transactions (
                    user_id, points, source_type, source_id, description, created_at
                ) VALUES (?, ?, ?, ?, ?, datetime('now'))
            `);
            
            await logStmt.bind(
                userId,
                points,
                source.type,
                source.challengeId || source.achievementId || null,
                source.challengeTitle || source.achievementTitle || 'Points awarded'
            ).run();

        } catch (error) {
            console.error('Error awarding points:', error);
        }
    }

    /**
     * Check for achievement unlocks
     * @param {string} userId - User ID
     */
    async checkAchievementUnlocks(userId) {
        try {
            // Get user stats
            const userStats = await this.getUserStats(userId);
            
            // Check each achievement template
            for (const template of ACHIEVEMENT_TEMPLATES) {
                const isUnlocked = await this.isAchievementUnlocked(userId, template.id);
                
                if (!isUnlocked && this.checkAchievementCondition(template.condition, userStats)) {
                    await this.unlockAchievement(userId, template);
                }
            }
        } catch (error) {
            console.error('Error checking achievement unlocks:', error);
        }
    }

    /**
     * Check if achievement condition is met
     * @param {Object} condition - Achievement condition
     * @param {Object} userStats - User statistics
     * @returns {boolean} Whether condition is met
     */
    checkAchievementCondition(condition, userStats) {
        switch (condition.type) {
            case 'transaction_count':
                return userStats.totalTransactions >= condition.value;
            case 'monthly_revenue':
                return userStats.currentMonthRevenue >= condition.value;
            case 'unique_customers':
                return userStats.uniqueCustomers >= condition.value;
            case 'transactions_per_hour':
                return userStats.maxTransactionsPerHour >= condition.value;
            case 'daily_target_streak':
                return userStats.currentTargetStreak >= condition.value;
            case 'accuracy_streak':
                return userStats.accuracyStreak >= condition.value && 
                       userStats.currentAccuracy >= condition.threshold;
            default:
                return false;
        }
    }

    /**
     * Unlock achievement for user
     * @param {string} userId - User ID
     * @param {Object} template - Achievement template
     */
    async unlockAchievement(userId, template) {
        try {
            // Insert achievement unlock
            const stmt = this.env.DB.prepare(`
                INSERT INTO user_achievements (
                    user_id, achievement_id, title, description, icon, 
                    category, rarity, points, unlocked_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);
            
            await stmt.bind(
                userId,
                template.id,
                template.title,
                template.description,
                template.icon,
                template.category,
                template.rarity,
                template.points
            ).run();

            // Award points
            await this.awardPoints(userId, template.points, {
                type: 'achievement_unlock',
                achievementId: template.id,
                achievementTitle: template.title
            });

            console.log(`Achievement unlocked: ${template.title} for user ${userId}`);
        } catch (error) {
            console.error('Error unlocking achievement:', error);
        }
    }

    /**
     * Get user statistics for challenge/achievement calculations
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User statistics
     */
    async getUserStats(userId) {
        try {
            const stmt = this.env.DB.prepare(`
                SELECT 
                    COUNT(*) as totalTransactions,
                    COALESCE(SUM(total), 0) as totalRevenue,
                    COUNT(DISTINCT customer_id) as uniqueCustomers,
                    AVG(total) as averageTransaction
                FROM transactions 
                WHERE cashier_id = ? AND status = 'completed'
            `);
            
            const basicStats = await stmt.bind(userId).first();

            // Get monthly revenue
            const monthlyStmt = this.env.DB.prepare(`
                SELECT COALESCE(SUM(total), 0) as currentMonthRevenue
                FROM transactions 
                WHERE cashier_id = ? AND status = 'completed'
                  AND DATE(created_at) >= DATE('now', 'start of month')
            `);
            
            const monthlyStats = await monthlyStmt.bind(userId).first();

            // Get streaks and other complex stats
            // This would involve more complex queries for streaks, accuracy, etc.
            
            return {
                ...basicStats,
                ...monthlyStats,
                currentTargetStreak: 0, // Would be calculated
                accuracyStreak: 0, // Would be calculated
                currentAccuracy: 95, // Would be calculated
                maxTransactionsPerHour: 0, // Would be calculated
                averageDailySales: basicStats.totalRevenue / 30, // Rough estimate
                averageDailyTransactions: basicStats.totalTransactions / 30,
                averageDailyCustomers: basicStats.uniqueCustomers / 30
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {};
        }
    }

    /**
     * Check if achievement is already unlocked
     * @param {string} userId - User ID
     * @param {string} achievementId - Achievement ID
     * @returns {Promise<boolean>} Whether achievement is unlocked
     */
    async isAchievementUnlocked(userId, achievementId) {
        try {
            const stmt = this.env.DB.prepare(`
                SELECT id FROM user_achievements 
                WHERE user_id = ? AND achievement_id = ?
            `);
            
            const result = await stmt.bind(userId, achievementId).first();
            return !!result;
        } catch (error) {
            console.error('Error checking achievement unlock status:', error);
            return false;
        }
    }

    /**
     * Store challenge in database
     * @param {Object} challenge - Challenge object
     */
    async storeChallengeInDB(challenge) {
        try {
            const stmt = this.env.DB.prepare(`
                INSERT INTO user_challenges (
                    id, user_id, type, category, title, description, 
                    target, progress, difficulty, reward_points, icon, 
                    status, deadline, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            await stmt.bind(
                challenge.id,
                challenge.userId,
                challenge.type,
                challenge.category,
                challenge.title,
                challenge.description,
                challenge.target,
                challenge.progress,
                challenge.difficulty,
                challenge.rewardPoints,
                challenge.icon,
                challenge.status,
                challenge.deadline,
                challenge.createdAt
            ).run();
        } catch (error) {
            console.error('Error storing challenge in database:', error);
            throw error;
        }
    }

    /**
     * Utility function to shuffle array
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get active challenges for user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Active challenges
     */
    async getActiveChallenges(userId) {
        try {
            const stmt = this.env.DB.prepare(`
                SELECT * FROM user_challenges 
                WHERE user_id = ? AND status = 'active' 
                  AND deadline > datetime('now')
                ORDER BY created_at DESC
            `);
            
            return await stmt.bind(userId).all();
        } catch (error) {
            console.error('Error getting active challenges:', error);
            return [];
        }
    }

    /**
     * Get user achievements
     * @param {string} userId - User ID
     * @returns {Promise<Array>} User achievements
     */
    async getUserAchievements(userId) {
        try {
            const stmt = this.env.DB.prepare(`
                SELECT * FROM user_achievements 
                WHERE user_id = ?
                ORDER BY unlocked_at DESC
            `);
            
            return await stmt.bind(userId).all();
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }

    /**
     * Cleanup expired challenges
     */
    async cleanupExpiredChallenges() {
        try {
            const stmt = this.env.DB.prepare(`
                UPDATE user_challenges 
                SET status = 'expired' 
                WHERE status = 'active' AND deadline < datetime('now')
            `);
            
            await stmt.run();
        } catch (error) {
            console.error('Error cleaning up expired challenges:', error);
        }
    }
}

/**
 * Initialize gamification system for new user
 * @param {string} userId - User ID
 * @param {Object} env - Environment variables
 */
export async function initializeUserGamification(userId, env) {
    try {
        const challengeManager = new ChallengeManager(env);
        
        // Generate initial challenges
        const userStats = await challengeManager.getUserStats(userId);
        await challengeManager.generateDailyChallenges(userId, userStats);
        
        // Check for any immediate achievement unlocks
        await challengeManager.checkAchievementUnlocks(userId);
        
        console.log(`Gamification initialized for user: ${userId}`);
    } catch (error) {
        console.error('Error initializing user gamification:', error);
    }
}

/**
 * Process transaction for gamification updates
 * @param {Object} transaction - Transaction data
 * @param {Object} env - Environment variables
 */
export async function processTransactionForGamification(transaction, env) {
    try {
        const challengeManager = new ChallengeManager(env);
        
        // Update relevant challenge progress
        await challengeManager.updateChallengeProgress(
            transaction.cashier_id,
            CHALLENGE_CATEGORIES.SALES,
            transaction.total
        );
        
        await challengeManager.updateChallengeProgress(
            transaction.cashier_id,
            CHALLENGE_CATEGORIES.TRANSACTIONS,
            1
        );
        
        if (transaction.customer_id) {
            await challengeManager.updateChallengeProgress(
                transaction.cashier_id,
                CHALLENGE_CATEGORIES.CUSTOMERS,
                1
            );
        }
        
    } catch (error) {
        console.error('Error processing transaction for gamification:', error);
    }
}

export default ChallengeManager;