import { useState, FormEvent, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ethers } from 'ethers';

export function LoginTerminal({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      if (err.code === 'auth/invalid-login-credentials' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         // Auto register instead
         try {
           await createUserWithEmailAndPassword(auth, email, password);
           onLogin();
         } catch (createErr: any) {
           if (createErr.code === 'auth/email-already-in-use') {
             setError('ERR: INVALID CREDENTIALS');
           } else if (createErr.code === 'auth/weak-password') {
             setError('ERR: SECURITY POLICY EXCEPTION (PW < 6 CHARS)');
           } else {
             setError(createErr.message || 'SYSTEM ERROR');
           }
         }
      } else {
        setError(err.message || 'SYSTEM ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  const [metamaskError, setMetamaskError] = useState('');

  const handleMetamaskLogin = async () => {
    setError('');
    setMetamaskError('');
    setLoading(true);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error("MetaMask is not installed. Please install it to connect.");
      }
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      
      try {
         await provider.send("eth_requestAccounts", []);
         const signer = await provider.getSigner();
         const address = await signer.getAddress();
         console.log("Connected to MetaMask:", address);
         onLogin();
      } catch (err: any) {
         if (err.code === 4001) {
             throw new Error("User rejected the request.");
         } else {
             throw new Error("Failed to connect to MetaMask");
         }
      }
      
    } catch (err: any) {
      setMetamaskError(err.message || 'Failed to connect to MetaMask');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'SYSTEM ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 antialiased h-full w-full relative">
      
      {/* Background Pulse Grid */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[100px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[400px] bg-black border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] font-mono text-blue-500 p-6 relative z-10"
      >
        {/* Terminal Header */}
        <div className="flex items-center mb-6">
          <div className="w-6 h-6 border border-blue-500 flex items-center justify-center mr-3 bg-blue-500/10 font-bold">Δ</div>
          <h1 className="text-lg tracking-[0.2em] font-bold">ARBANALYTICS</h1>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest opacity-80 mb-2">Institutional Access</div>
          <div className="w-full border-t border-blue-500/30 border-dashed"></div>
        </div>

        <form onSubmit={handleConnect} className="w-full flex flex-col gap-4">
          {error && (
             <div className="w-full p-2 bg-red-500/20 border border-red-500/50 text-red-500 text-[10px] animate-pulse">
               {error}
             </div>
          )}

          <div className="flex flex-col gap-3">
             <div className="relative border border-blue-500/30 focus-within:border-blue-500 transition-colors bg-blue-500/5">
               <input 
                 type="text"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full bg-transparent p-2 text-blue-400 text-xs placeholder:text-blue-500/30 focus:outline-none"
                 placeholder="Email / User ID"
                 required
               />
             </div>
             
             <div className="relative border border-blue-500/30 focus-within:border-blue-500 transition-colors bg-blue-500/5">
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-transparent p-2 text-blue-400 text-xs placeholder:text-blue-500/30 focus:outline-none"
                 placeholder="Password"
                 required
               />
             </div>

             <div className="relative border border-blue-500/30 focus-within:border-blue-500 transition-colors bg-blue-500/5">
               <input 
                 type="text"
                 value={mfa}
                 onChange={(e) => setMfa(e.target.value)}
                 className="w-full bg-transparent p-2 text-blue-400 text-xs placeholder:text-blue-500/30 focus:outline-none"
                 placeholder="MFA Code (optional)"
               />
             </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              '> CONNECT TO MARKETS <'
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-blue-500/30 hover:bg-blue-500/10 text-blue-500 font-bold py-3 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            [G] OAUTH: GOOGLE
          </button>
          <button 
            type="button"
            onClick={handleMetamaskLogin}
            disabled={loading}
            className="w-full border border-blue-500/30 hover:bg-blue-500/10 text-blue-500 font-bold py-3 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            [M] OAUTH: METAMASK
          </button>
        </form>

        {metamaskError && (
          <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 text-red-500 text-[10px] animate-pulse text-center">
             {metamaskError}
          </div>
        )}

        <div className="mt-8 text-center border-t border-blue-500/20 pt-4">
          <p className="text-[10px] opacity-60 tracking-widest">Powered by Simba Intelligence</p>
        </div>
      </motion.div>
    </div>
  );
}
