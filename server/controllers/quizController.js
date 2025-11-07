// server/controllers/quizController.js (Modified Logic)

const Quiz = require('../models/Quiz');
const UserQuizAttempt = require('../models/UserQuizAttempt'); // <-- New Import
const { addPoints } = require('../utils/gamification');


// @desc    Get all quizzes (WITH attempt status)
// @route   GET /api/quizzes
// @access  Public (Checks auth status)
exports.getQuizzes = async (req, res) => {
    try {
        // Fetch all quizzes
        const quizzes = await Quiz.find().select('-questions.correctAnswerIndex');
        
        let quizzesWithStatus = quizzes.map(q => q.toObject());

        // If user is logged in, fetch their passed quizzes
        if (req.user) {
            const passedAttempts = await UserQuizAttempt.find({ userId: req.user.id, passed: true });
            const passedQuizIds = passedAttempts.map(a => a.quizId.toString());

            quizzesWithStatus = quizzesWithStatus.map(quiz => {
                const hasPassed = passedQuizIds.includes(quiz._id.toString());
                return {
                    ...quiz,
                    attempted: hasPassed,
                    // Optionally calculate points awarded if passed
                    pointsAwarded: hasPassed ? quiz.pointsAwarded : quiz.pointsAwarded
                };
            });
        }

        res.status(200).json(quizzesWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch quizzes.' });
    }
};


// @desc    Submit quiz answers and score
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
    const { answers } = req.body;
    const quizId = req.params.id;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    
    // 1. CHECK FOR PREVIOUS PASS
    const previousPass = await UserQuizAttempt.findOne({ userId, quizId, passed: true });
    if (previousPass) {
        return res.status(400).json({ 
            message: 'You have already successfully passed this quiz and earned the points.',
            pointsAwarded: quiz.pointsAwarded, // Return points even if already passed
            attempted: true
        });
    }

    // 2. SCORE THE QUIZ
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
        const submittedAnswer = answers[index];
        if (submittedAnswer !== undefined && submittedAnswer === q.correctAnswerIndex) {
            correctCount++;
        }
    });
    const scorePercentage = (correctCount / quiz.questions.length) * 100;
    const passed = scorePercentage >= 70;

    // 3. PERSIST ATTEMPT AND AWARD POINTS
    try {
        await UserQuizAttempt.findOneAndUpdate(
            { userId, quizId },
            { score: scorePercentage, passed: passed },
            { upsert: true, new: true }
        );

        if (passed) {
            // Only award points on the first successful pass
            await addPoints(userId, 'QUIZ_PASS', quiz.pointsAwarded); 
            return res.status(200).json({ 
                message: `Quiz passed! You scored ${scorePercentage.toFixed(0)}%. ${quiz.pointsAwarded} points awarded!`,
                pointsAwarded: quiz.pointsAwarded,
                attempted: true
            });
        }
        
        res.status(200).json({ 
            message: `You scored ${scorePercentage.toFixed(0)}%. You need 70% to pass. Try again!`,
            pointsAwarded: 0,
            attempted: false
        });

    } catch (error) {
        console.error('Error submitting quiz or saving attempt:', error);
        res.status(500).json({ message: 'Error submitting quiz.' });
    }
};


// @desc    Get the current user's quiz attempt history
// @route   GET /api/quizzes/my-attempts
// @access  Private
exports.getMyQuizAttempts = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all attempts by the user and populate the Quiz details (title)
        const attempts = await UserQuizAttempt.find({ userId })
            .sort({ createdAt: -1 }) // Show newest attempts first
            .populate('quizId', 'title'); // Populate only title field from Quiz

        // Map the result to a cleaner format for frontend
        const formattedAttempts = attempts.map(attempt => ({
            quizId: attempt.quizId._id,
            title: attempt.quizId.title,
            score: attempt.score,
            passed: attempt.passed,
            createdAt: attempt.createdAt,
        }));

        res.status(200).json(formattedAttempts);
    } catch (error) {
        console.error('Error fetching quiz attempts:', error);
        res.status(500).json({ message: 'Failed to retrieve quiz history.' });
    }
};
