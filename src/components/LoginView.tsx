import React, { useState } from 'react';
import type { View } from '../types';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { ArrowLeft } from 'lucide-react';

interface LoginViewProps {
  setView: (view: View) => void;
  postLoginAction: View | null;
}

const LoginView: React.FC<LoginViewProps> = ({ setView, postLoginAction }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
        }
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName: name,
          email: email,
        });
      }
      setView(postLoginAction || 'products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setIsResetting(true);
    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Password reset email sent. Please check your inbox (and spam folder).");
    } catch (err: any) {
      console.error("Error:", err.message);
      // Firebase specific error handling
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError("Error sending reset email. Please try again later.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      setView(postLoginAction || 'products');
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeTabClasses = "border-blue-500 text-blue-600";
  const inactiveTabClasses = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

  return (
    <div className="max-w-md mx-auto mt-10 mb-10 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => setView('products')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors transform hover:scale-105"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Products</span>
      </button>
      
      <div className="bg-white p-8 rounded-xl shadow-xl transform transition-all hover:shadow-2xl">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => { setIsLogin(true); setError(null); setResetMessage(null); }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors transform hover:scale-105 ${isLogin ? activeTabClasses : inactiveTabClasses}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setResetMessage(null); }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors transform hover:scale-105 ${!isLogin ? activeTabClasses : inactiveTabClasses}`}
            >
              Sign Up
            </button>
          </nav>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">{isLogin ? 'Welcome Back!' : 'Create an Account'}</h1>
        <p className="text-gray-600 mb-6">{isLogin ? 'Please login to continue.' : 'Join us to get your water delivered.'}</p>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetting}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-blue-300"
              >
                {isResetting ? "Sending..." : "Forgot password?"}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          {resetMessage && <p className="text-sm text-green-700 bg-green-100 p-3 rounded-md">{resetMessage}</p>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 text-lg disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </div>

          {/* Google Sign-In Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 text-lg disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Sign In / Sign Up with Google'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
