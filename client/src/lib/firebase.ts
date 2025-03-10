import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing. Check your environment variables.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance
export const firebaseAuth = getAuth(app);

// Authentication Methods

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error', error);
    
    // Handle specific Firebase Auth errors
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        throw new Error('An account already exists with a different credential.');
      case 'auth/popup-blocked':
        throw new Error('Authentication popup was blocked. Please enable popups.');
      case 'auth/popup-closed-by-user':
        throw new Error('Authentication popup was closed before completion.');
      default:
        throw new Error('Google Sign-In failed. Please try again.');
    }
  }
};

// GitHub Sign-In
export const signInWithGithub = async () => {
  try {
    const provider = new GithubAuthProvider();
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error: any) {
    console.error('GitHub Sign-In Error', error);
    
    // Handle specific Firebase Auth errors
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        throw new Error('An account already exists with a different credential.');
      case 'auth/popup-blocked':
        throw new Error('Authentication popup was blocked. Please enable popups.');
      case 'auth/popup-closed-by-user':
        throw new Error('Authentication popup was closed before completion.');
      default:
        throw new Error('GitHub Sign-In failed. Please try again.');
    }
  }
};

// Email/Password Sign-In
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Email Sign-In Error', error);
    
    switch (error.code) {
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled.');
      case 'auth/user-not-found':
        throw new Error('No user found with this email.');
      case 'auth/wrong-password':
        throw new Error('Incorrect password.');
      default:
        throw new Error('Login failed. Please try again.');
    }
  }
};

// Email/Password Registration
export const registerWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Email Registration Error', error);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('Email is already registered.');
      case 'auth/invalid-email':
        throw new Error('Invalid email address.');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled.');
      case 'auth/weak-password':
        throw new Error('Password is too weak.');
      default:
        throw new Error('Registration failed. Please try again.');
    }
  }
};

// Logout
export const firebaseSignOut = async () => {
  try {
    await signOut(firebaseAuth);
  } catch (error) {
    console.error('Logout Error', error);
    throw error;
  }
};

export default app;