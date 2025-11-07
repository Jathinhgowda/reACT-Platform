// src/pages/Quizzes.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { HiOutlineQuestionMarkCircle, HiOutlineAcademicCap, HiCheckCircle } from 'react-icons/hi2';

// NOTE: Assuming the Toast component structure is defined in AdminDashboard and should be copied here, 
// or available globally. For simplicity, I'll assume its code should be added here:

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'error' 
    ? 'bg-red-900/80 text-red-300 border border-red-700' 
    : 'bg-green-900/80 text-green-300 border border-green-700';

  return (
    <div className={`fixed top-5 right-5 p-4 rounded-xl shadow-2xl backdrop-blur-sm ${bgColor} z-50 animate-slide-in`}>
      {message}
    </div>
  );
};


const Quizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null); // <-- NEW STATE FOR TOAST

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await apiClient.get('/quizzes'); 
        setQuizzes(response.data);
      } catch (err) {
        setError("Failed to fetch quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [user]);

  const handleOptionChange = (questionIndex, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length !== activeQuiz.questions.length) {
      setToast({ message: "Please answer all questions before submitting.", type: 'error' }); // <-- TOAST HERE
      return;
    }
    
    try {
      const response = await apiClient.post(`/quizzes/${activeQuiz._id}/submit`, { answers });
      
      setResult(response.data);

      // Display final outcome via Toast
      const toastType = response.data.pointsAwarded > 0 ? 'success' : 'error';
      setToast({ message: response.data.message, type: toastType }); // <-- TOAST HERE
      
      // Update the local list to mark this quiz as attempted
      setQuizzes(prev => prev.map(q => 
          q._id === activeQuiz._id ? { ...q, attempted: true, pointsAwarded: response.data.pointsAwarded } : q
      ));

      setActiveQuiz(null); 
      setAnswers({});
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Quiz submission failed.';
      setToast({ message: errMsg, type: 'error' }); // <-- TOAST HERE
    }
  };


  if (loading) return <div className="text-center p-8 bg-gray-900 text-white min-h-screen">Loading quizzes...</div>;
  if (error) return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;

  // --- Quiz Taking View ---
  if (activeQuiz) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto glass-card p-8 rounded-xl">
          <button 
            onClick={() => setActiveQuiz(null)} 
            className="text-teal-400 hover:text-teal-300 mb-4 text-sm font-bold block"
          >
            ← Back to Quizzes
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">{activeQuiz.title}</h1>
          <p className="text-gray-400 mb-6">{activeQuiz.description}</p>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitQuiz(); }} className="space-y-6">
            {activeQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
                <p className="font-semibold text-lg mb-3 text-white">
                  {qIndex + 1}. {question.text}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-700/50 transition">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={answers[qIndex] === oIndex}
                        onChange={() => handleOptionChange(qIndex, oIndex)}
                        className="form-radio h-4 w-4 text-teal-400 bg-gray-600 border-gray-500"
                        required
                      />
                      <span className="ml-3 text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            <button
              type="submit"
              className="mt-6 w-full py-3 px-4 rounded-lg font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 transition"
            >
              Submit Quiz & Get Points
            </button>
          </form>
          
          {result && (
            <div className={`mt-6 p-4 rounded-lg text-center ${result.pointsAwarded > 0 ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'} border`}>
                <p className='font-bold text-white'>{result.message}</p>
                {result.pointsAwarded > 0 && <p className='text-teal-400 mt-1'>+ {result.pointsAwarded} Points Awarded!</p>}
            </div>
          )}
        </div>
        {/* Toast Notifications */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- Quiz List View ---
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-extrabold text-teal-400 mb-2">Civic Education Quizzes</h1>
      <p className="text-gray-400 mb-8">Test your civic knowledge and earn points!</p>

      {quizzes.length === 0 ? (
        <div className="glass-card p-10 rounded-xl text-center text-gray-400">
          No quizzes available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const hasAttempted = quiz.attempted;
            
            return (
              <div key={quiz._id} className="glass-card p-6 rounded-xl shadow-2xl flex justify-between items-center hover:bg-white/5 transition duration-200">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center">
                    <HiOutlineAcademicCap className="mr-2 text-teal-400" /> {quiz.title}
                  </h2>
                  <p className="text-sm text-gray-400">{quiz.description}</p>
                  
                  <div className="mt-2 flex items-center space-x-3">
                      <p className="text-lg font-bold text-yellow-400">{quiz.pointsAwarded} Pts</p>
                      <p className="text-xs text-gray-500">awarded on passing (70%).</p>
                  </div>
                </div>

                {/* Action Button/Status */}
                <div className='flex flex-col items-end'>
                    {hasAttempted ? (
                        <span className="py-2 px-4 rounded-lg font-bold text-sm text-green-400 bg-green-900/50 flex items-center">
                            <HiCheckCircle className='mr-1' /> Attempted
                        </span>
                    ) : (
                        <button
                            onClick={() => setActiveQuiz(quiz)}
                            disabled={!user}
                            className="py-2 px-4 ml-4 rounded-lg font-bold text-gray-900 bg-indigo-400 hover:bg-indigo-300 transition disabled:opacity-50"
                        >
                            Start Quiz
                        </button>
                    )}
                    {!user && <p className='text-xs text-red-400 mt-1'>Log in to start</p>}
                </div>

              </div>
            );
          })}
        </div>
      )}
      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Quizzes;