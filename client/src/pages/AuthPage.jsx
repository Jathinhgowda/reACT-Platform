import { useState } from 'react';
import { useParams } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import { Link } from 'react-router-dom';

const AuthPage = () => {
  const { type } = useParams();
  const isLogin = type === 'login';

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-xl rounded-lg border border-gray-100">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {isLogin ? 'Welcome Back' : 'Welcome to reACT'}
      </h1>

      {isLogin ? <LoginForm /> : <SignupForm />}

      <p className="mt-6 text-center text-sm text-gray-600">
        {isLogin ? 'New to reACT?' : 'Already have an account?'}
        <Link 
          to={isLogin ? '/auth/signup' : '/auth/login'}
          className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
        >
          {isLogin ? 'Create an account' : 'Log In'}
        </Link>
      </p>
    </div>
  );
};

export default AuthPage;